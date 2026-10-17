"""OAuth-Ablauf gegen app.main (Passwort, PKCE, Bearer-Schutz von /mcp)."""
import base64
import hashlib
from urllib.parse import parse_qs, urlparse

import pytest
from fastapi.testclient import TestClient

from app import main
from tests.conftest import FakeBridge

REDIRECT = "https://claude.ai/api/mcp/auth_callback"
VERIFIER = "v" * 50
CHALLENGE = base64.urlsafe_b64encode(hashlib.sha256(VERIFIER.encode()).digest()).rstrip(b"=").decode()


@pytest.fixture(scope="module")
def client():
    # Ein Client fürs ganze Modul: FastMCPs Session-Manager lässt sich pro
    # Prozess nur einmal starten.
    main.bridge = FakeBridge(responses={"/status": {"logged_in": True, "connected": True}})
    with TestClient(main.app) as c:
        yield c


def _get_code(client, password="geheim"):
    r = client.post("/authorize", data={"redirect_uri": REDIRECT, "state": "xyz", "code_challenge": CHALLENGE,
                                        "code_challenge_method": "S256", "password": password},
                    follow_redirects=False)
    return r


def test_mcp_requires_bearer(client):
    r = client.post("/mcp/", json={})
    assert r.status_code == 401
    assert "resource_metadata" in r.headers["www-authenticate"]


def test_foreign_redirect_rejected(client):
    assert client.get("/authorize", params={"redirect_uri": "https://evil.example/cb"}).status_code == 400


def test_wrong_password(client):
    r = _get_code(client, "falsch")
    assert r.status_code == 200 and "Falsches Passwort" in r.text


def test_full_flow_with_pkce(client):
    r = _get_code(client)
    assert r.status_code == 303
    loc = urlparse(r.headers["location"])
    assert loc.netloc == "claude.ai"
    qs = parse_qs(loc.query)
    assert qs["state"] == ["xyz"]
    code = qs["code"][0]

    bad = client.post("/token", data={"grant_type": "authorization_code", "code": code,
                                       "code_verifier": "falsch", "redirect_uri": REDIRECT})
    assert bad.status_code == 400  # falscher Verifier verbraucht den Code

    code = parse_qs(urlparse(_get_code(client).headers["location"]).query)["code"][0]
    tok = client.post("/token", data={"grant_type": "authorization_code", "code": code,
                                       "code_verifier": VERIFIER, "redirect_uri": REDIRECT})
    assert tok.status_code == 200
    access = tok.json()["access_token"]

    # Code ist nur einmal gültig
    again = client.post("/token", data={"code": code, "code_verifier": VERIFIER})
    assert again.status_code == 400

    headers = {"Authorization": f"Bearer {access}", "Accept": "application/json, text/event-stream"}
    init = client.post("/mcp/", headers=headers, json={
        "jsonrpc": "2.0", "id": 1, "method": "initialize",
        "params": {"protocolVersion": "2025-03-26", "capabilities": {},
                   "clientInfo": {"name": "test", "version": "1"}},
    })
    assert init.status_code == 200
    sid = init.headers["mcp-session-id"]
    headers["mcp-session-id"] = sid
    client.post("/mcp/", headers=headers, json={"jsonrpc": "2.0", "method": "notifications/initialized"})
    lst = client.post("/mcp/", headers=headers, json={"jsonrpc": "2.0", "id": 2, "method": "tools/list"})
    assert "whatsapp_send_message" in lst.text and "whatsapp_read_chat" in lst.text


def test_setup_requires_login(client):
    r = client.get("/setup")
    assert "anmelden" in r.text
    assert client.get("/setup/qr.png", follow_redirects=False).status_code == 303
    client.post("/setup/login", data={"password": "geheim"})
    assert "Verknüpft" in client.get("/setup").text
