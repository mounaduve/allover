import importlib
import os

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("DB_PATH", str(tmp_path / "r.db"))
    monkeypatch.setenv("MAC_TOKEN", "mac-test")
    import app.main as m
    importlib.reload(m)
    return TestClient(m.app)


MAC = {"Authorization": "Bearer mac-test"}


def pair(client):
    r = client.post("/api/pair/start", json={"name": "S25"}).json()
    assert client.get("/api/pair/status", params={"secret": r["secret"]}).json() == {"approved": False}
    assert client.post("/api/mac/pair/approve", json={"code": r["code"]}, headers=MAC).status_code == 200
    tok = client.get("/api/pair/status", params={"secret": r["secret"]}).json()["token"]
    # Kopplung ist danach verbraucht
    assert client.get("/api/pair/status", params={"secret": r["secret"]}).status_code == 404
    return {"Authorization": f"Bearer {tok}"}


def test_auth(client):
    assert client.get("/api/status").status_code == 401
    assert client.get("/api/status", headers={"Authorization": "Bearer x"}).status_code == 401
    assert client.get("/api/mac/inbox", headers={"Authorization": "Bearer x"}).status_code == 401
    assert client.post("/api/mac/pair/approve", json={"code": "123456"}).status_code == 401


def test_roundtrip(client):
    dev = pair(client)
    client.post("/api/mac/sessions", headers=MAC,
                json=[{"id": "local_a", "cli_id": "cli-a", "name": "Aufgaben", "status": "idle"}])
    st = client.get("/api/status", headers=dev).json()
    assert st["mac_online"] and st["sessions"][0]["name"] == "Aufgaben"
    assert client.post("/api/messages", headers=dev, json={"session_id": "nope", "text": "x"}).status_code == 404
    client.post("/api/messages", headers=dev, json={"session_id": "local_a", "text": "Hallo"})
    msg = client.get("/api/mac/inbox", headers=MAC).json()
    assert msg["session_id"] == "local_a" and msg["text"] == "Hallo"
    assert client.get("/api/mac/inbox", headers=MAC).status_code == 204
    assert client.get("/api/replies", headers=dev, params={"session_id": "local_a"}).status_code == 204
    rid = client.post("/api/mac/replies", headers=MAC, json={"cli_id": "cli-a", "text": "Antwort"}).json()["id"]
    r = client.get("/api/replies", headers=dev, params={"session_id": "local_a"}).json()
    assert r["text"] == "Antwort" and r["id"] == rid
    assert client.get("/api/replies", headers=dev, params={"session_id": "local_a", "after": rid}).status_code == 204


def test_log(client):
    dev = pair(client)
    assert client.post("/api/log", json={"lines": ["a"]}).status_code == 401
    client.post("/api/log", headers=dev, json={"lines": ["eins", "zwei"]})
    assert client.get("/api/mac/log", headers=MAC).json()["lines"] == ["eins", "zwei"]
