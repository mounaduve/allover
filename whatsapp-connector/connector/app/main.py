"""wk-whatsapp-connector: MCP-Server für WhatsApp, nutzbar als eigener
Connector in Claude Chat (Browser, Desktop, Handy).

Aufbau wie beim wk-m365-connector: dieser Server ist OAuth-Autorisierungsserver
für Claude und gibt eigene Tokens aus. Statt eines Microsoft-Logins gibt es
hier ein einzelnes Connector-Passwort, denn hinter dem Connector hängt genau
ein WhatsApp-Konto (verknüpftes Gerät in der Bridge).
"""
import asyncio
import base64
import html
import os
import secrets
import time
from contextlib import asynccontextmanager
from urllib.parse import urlencode, urlparse

from fastapi import FastAPI, Form, Request, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse, Response
from starlette.middleware.sessions import SessionMiddleware
from mcp.server.fastmcp import FastMCP, Image

from app import store, tools
from app.bridge import BridgeClient, BridgeError

BASE_URL = os.environ["PUBLIC_BASE_URL"].rstrip("/")
CONNECTOR_PASSWORD = os.environ["CONNECTOR_PASSWORD"]
SESSION_SECRET = os.environ["SESSION_SECRET"]
# Nur an diese Hosts schicken wir OAuth-Codes zurück (Claude im Web/Handy bzw.
# lokale Clients wie Claude Desktop/Code).
ALLOWED_REDIRECT_HOSTS = {
    h.strip() for h in os.environ.get("ALLOWED_REDIRECT_HOSTS", "claude.ai,claude.com,localhost,127.0.0.1").split(",")
    if h.strip()
}

store.init_db()
bridge = BridgeClient()

mcp = FastMCP("wk-whatsapp-connector")
# Muss VOR dem Zugriff auf mcp.session_manager aufgerufen werden (lazy init).
mcp_asgi_app = mcp.streamable_http_app()


@asynccontextmanager
async def lifespan(_: FastAPI):
    # FastMCPs Session-Manager läuft nur innerhalb dieses Kontexts — ohne das
    # schlägt jeder MCP-Request mit 500 fehl (eigene gemountete Sub-App).
    async with mcp.session_manager.run():
        yield


app = FastAPI(title="wk-whatsapp-connector", lifespan=lifespan)
app.add_middleware(SessionMiddleware, secret_key=SESSION_SECRET, https_only=BASE_URL.startswith("https://"))


@app.middleware("http")
async def require_bearer_for_mcp(request: Request, call_next):
    """Erzwingt ein gültiges Bearer-Token für /mcp, BEVOR die MCP-Session
    beginnt — sonst hält Claude den Server für "keine Anmeldung nötig"."""
    if request.url.path.startswith("/mcp"):
        auth = request.headers.get("authorization", "")
        token = auth.split(" ", 1)[1] if auth.lower().startswith("bearer ") else None
        if not token or not store.is_valid_access_token(token):
            return JSONResponse(
                {"error": "unauthorized"},
                status_code=401,
                headers={
                    "WWW-Authenticate": (
                        f'Bearer resource_metadata="{BASE_URL}/.well-known/oauth-protected-resource"'
                    )
                },
            )
    return await call_next(request)


# ---------------------------------------------------------------------------
# Gemeinsame HTML-Bausteine
# ---------------------------------------------------------------------------

PAGE_CSS = """
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#f4f5f2;color:#1d1f1c;
margin:0;padding:24px 16px;display:flex;justify-content:center}
main{background:#fff;border-radius:14px;box-shadow:0 2px 12px rgba(0,0,0,.08);padding:28px;max-width:420px;width:100%}
h1{font-size:1.3rem;margin:0 0 6px}p{line-height:1.5}.muted{color:#666;font-size:.9rem}
input{width:100%;box-sizing:border-box;padding:11px;border:1px solid #ccc;border-radius:8px;font-size:1rem;margin:6px 0 12px}
button{background:#1f8a4c;color:#fff;border:0;border-radius:8px;padding:11px 16px;font-size:1rem;cursor:pointer;width:100%}
button.secondary{background:#e9ebe6;color:#1d1f1c}.err{color:#b3261e}.ok{color:#1f8a4c}
img.qr{display:block;margin:12px auto;width:280px;height:280px;image-rendering:pixelated}
.code{font-family:ui-monospace,monospace;font-size:1.8rem;letter-spacing:.15em;text-align:center;margin:12px 0}
form{margin:14px 0}hr{border:0;border-top:1px solid #eee;margin:20px 0}
@media (prefers-color-scheme:dark){body{background:#151614;color:#e8e9e6}main{background:#1f201e;box-shadow:none}
input{background:#151614;color:#e8e9e6;border-color:#444}button.secondary{background:#2c2e2a;color:#e8e9e6}
.muted{color:#9a9c97}hr{border-color:#333}}
"""


def _page(title: str, body: str, refresh: int | None = None) -> HTMLResponse:
    meta = f'<meta http-equiv="refresh" content="{refresh}">' if refresh else ""
    return HTMLResponse(
        f"""<!doctype html><html lang="de"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">{meta}
<title>{html.escape(title)}</title><style>{PAGE_CSS}</style></head>
<body><main>{body}</main></body></html>"""
    )


async def _check_password(password: str) -> bool:
    ok = secrets.compare_digest(password.encode(), CONNECTOR_PASSWORD.encode())
    if not ok:
        await asyncio.sleep(1.5)  # bremst Durchprobieren
    return ok


# ---------------------------------------------------------------------------
# OAuth: Claude <-> uns
# ---------------------------------------------------------------------------

@app.get("/.well-known/oauth-protected-resource")
def protected_resource_metadata():
    return {"resource": f"{BASE_URL}/mcp", "authorization_servers": [BASE_URL]}


@app.get("/.well-known/oauth-authorization-server")
def oauth_metadata():
    return {
        "issuer": BASE_URL,
        "authorization_endpoint": f"{BASE_URL}/authorize",
        "token_endpoint": f"{BASE_URL}/token",
        "registration_endpoint": f"{BASE_URL}/register",
        "response_types_supported": ["code"],
        "grant_types_supported": ["authorization_code"],
        "code_challenge_methods_supported": ["S256"],
        "token_endpoint_auth_methods_supported": ["none"],
    }


@app.post("/register")
async def register_client(request: Request):
    """Dynamic Client Registration (RFC 7591) — feste Client-ID, public client
    (abgesichert über PKCE und das Connector-Passwort)."""
    body = await request.json()
    return JSONResponse(
        {
            "client_id": "wk-whatsapp-connector-client",
            "client_name": body.get("client_name", "Claude"),
            "redirect_uris": body.get("redirect_uris", []),
            "token_endpoint_auth_method": "none",
            "grant_types": ["authorization_code"],
            "response_types": ["code"],
        },
        status_code=201,
    )


def _check_redirect_uri(redirect_uri: str):
    parsed = urlparse(redirect_uri)
    host = parsed.hostname or ""
    local = host in ("localhost", "127.0.0.1")
    if parsed.scheme != "https" and not local:
        raise HTTPException(400, "redirect_uri muss https sein")
    if host not in ALLOWED_REDIRECT_HOSTS:
        raise HTTPException(400, f"redirect_uri-Host {host!r} ist nicht erlaubt")


def _login_form(redirect_uri: str, state: str, code_challenge: str, method: str, error: str = "") -> HTMLResponse:
    hidden = "".join(
        f'<input type="hidden" name="{k}" value="{html.escape(v)}">'
        for k, v in (("redirect_uri", redirect_uri), ("state", state),
                     ("code_challenge", code_challenge), ("code_challenge_method", method))
    )
    err = f'<p class="err">{html.escape(error)}</p>' if error else ""
    return _page("WhatsApp mit Claude verbinden", f"""
<h1>WhatsApp mit Claude verbinden</h1>
<p class="muted">Claude möchte auf dein WhatsApp zugreifen (Chats lesen, Nachrichten senden).
Gib zum Bestätigen das Connector-Passwort ein.</p>{err}
<form method="post" action="/authorize">{hidden}
<input type="password" name="password" placeholder="Connector-Passwort" autofocus required>
<button type="submit">Verbinden</button></form>""")


@app.get("/authorize")
def authorize(redirect_uri: str, state: str = "", code_challenge: str = "", code_challenge_method: str = "S256"):
    _check_redirect_uri(redirect_uri)
    return _login_form(redirect_uri, state, code_challenge, code_challenge_method)


@app.post("/authorize")
async def authorize_submit(
    redirect_uri: str = Form(...), state: str = Form(""), code_challenge: str = Form(""),
    code_challenge_method: str = Form("S256"), password: str = Form(...),
):
    _check_redirect_uri(redirect_uri)
    if not await _check_password(password):
        return _login_form(redirect_uri, state, code_challenge, code_challenge_method, "Falsches Passwort.")
    code = store.create_oauth_code(redirect_uri, code_challenge or None, code_challenge_method)
    sep = "&" if "?" in redirect_uri else "?"
    return RedirectResponse(f"{redirect_uri}{sep}{urlencode({'code': code, 'state': state})}", status_code=303)


@app.post("/token")
async def token(request: Request):
    form = await request.form()
    if form.get("grant_type", "authorization_code") != "authorization_code":
        return JSONResponse({"error": "unsupported_grant_type"}, status_code=400)
    code = form.get("code")
    if not code or not store.consume_oauth_code(code, form.get("redirect_uri"), form.get("code_verifier")):
        return JSONResponse({"error": "invalid_grant"}, status_code=400)
    return {"access_token": store.create_access_token(), "token_type": "bearer", "expires_in": 315360000}


# ---------------------------------------------------------------------------
# Einrichtungsseite: WhatsApp koppeln, Status, Abmelden
# ---------------------------------------------------------------------------

def _require_admin(request: Request):
    if not request.session.get("admin"):
        raise HTTPException(303, headers={"Location": "/setup"})


@app.get("/")
def root():
    return RedirectResponse("/setup")


@app.get("/setup")
def setup(request: Request):
    if not request.session.get("admin"):
        return _page("WhatsApp-Connector", """
<h1>WhatsApp-Connector</h1><p class="muted">Einrichtung — bitte anmelden.</p>
<form method="post" action="/setup/login">
<input type="password" name="password" placeholder="Connector-Passwort" autofocus required>
<button type="submit">Anmelden</button></form>""")

    try:
        st = bridge.get("/status")
    except Exception as e:  # Bridge nicht erreichbar
        return _page("WhatsApp-Connector", f"""<h1>WhatsApp-Connector</h1>
<p class="err">Die WhatsApp-Bridge ist nicht erreichbar: {html.escape(str(e))}</p>
<p class="muted">Läuft der Container <code>bridge</code>? Seite lädt automatisch neu.</p>""", refresh=10)

    pair_code = request.session.pop("pair_code", "")
    flash = request.session.pop("flash", "")
    flash_html = f'<p class="ok">{html.escape(flash)}</p>' if flash else ""
    err_html = f'<p class="err">{html.escape(st["last_error"])}</p>' if st.get("last_error") else ""

    if st.get("logged_in"):
        state_html = f"""<p class="ok">✅ Verknüpft mit {html.escape(st.get("push_name") or "")}
{html.escape(st.get("phone") or "")} — {"verbunden" if st.get("connected") else "Verbindung wird aufgebaut…"}</p>
<p class="muted">In Claude unter <b>Einstellungen → Connectoren → Eigenen Connector hinzufügen</b> diese URL eintragen:</p>
<p class="code" style="font-size:1rem;letter-spacing:0">{html.escape(BASE_URL)}/mcp</p>
<hr>
<form method="post" action="/setup/revoke-tokens"><button class="secondary" type="submit">
Alle Claude-Zugänge widerrufen</button></form>
<form method="post" action="/setup/logout" onsubmit="return confirm('WhatsApp-Verknüpfung wirklich trennen?')">
<button class="secondary" type="submit">WhatsApp-Verknüpfung trennen</button></form>"""
        refresh = None
    else:
        if pair_code:
            link_html = f"""<p>Kopplungscode:</p><p class="code">{html.escape(pair_code)}</p>
<p class="muted">WhatsApp → Einstellungen → Verknüpfte Geräte → Gerät hinzufügen →
„Stattdessen mit Telefonnummer verknüpfen" und den Code eingeben.</p>"""
        elif st.get("qr_available"):
            link_html = f"""<p>WhatsApp auf dem Handy öffnen → Einstellungen → Verknüpfte Geräte →
Gerät hinzufügen und diesen Code scannen:</p>
<img class="qr" src="/setup/qr.png?t={int(time.time())}" alt="QR-Code">"""
        else:
            link_html = '<p class="muted">QR-Code wird erzeugt…</p>'
        state_html = f"""{link_html}<hr>
<p class="muted">Seite auf dem Handy selbst geöffnet? Dann stattdessen per Kopplungscode verknüpfen:</p>
<form method="post" action="/setup/pair-phone">
<input name="phone" placeholder="Deine Nummer, z.B. +49 170 1234567" required>
<button class="secondary" type="submit">Kopplungscode anzeigen</button></form>"""
        refresh = None if pair_code else 15

    return _page("WhatsApp-Connector", f"<h1>WhatsApp-Connector</h1>{flash_html}{err_html}{state_html}", refresh)


@app.post("/setup/login")
async def setup_login(request: Request, password: str = Form(...)):
    if await _check_password(password):
        request.session["admin"] = True
    return RedirectResponse("/setup", status_code=303)


@app.get("/setup/qr.png")
def setup_qr(request: Request):
    _require_admin(request)
    try:
        png = bridge.get_bytes("/qr.png")
    except BridgeError:
        raise HTTPException(404, "kein QR-Code verfügbar")
    return Response(png, media_type="image/png", headers={"Cache-Control": "no-store"})


@app.post("/setup/pair-phone")
def setup_pair_phone(request: Request, phone: str = Form(...)):
    _require_admin(request)
    try:
        request.session["pair_code"] = bridge.post("/pair-phone", {"phone": phone})["code"]
    except BridgeError as e:
        request.session["flash"] = f"Kopplungscode fehlgeschlagen: {e.message}"
    return RedirectResponse("/setup", status_code=303)


@app.post("/setup/logout")
def setup_logout(request: Request):
    _require_admin(request)
    bridge.post("/logout")
    request.session["flash"] = "WhatsApp-Verknüpfung getrennt."
    return RedirectResponse("/setup", status_code=303)


@app.post("/setup/revoke-tokens")
def setup_revoke(request: Request):
    _require_admin(request)
    store.revoke_all_access_tokens()
    request.session["flash"] = "Alle Claude-Zugänge widerrufen — Claude muss sich neu verbinden."
    return RedirectResponse("/setup", status_code=303)


# ---------------------------------------------------------------------------
# MCP-Tools (dünner Wrapper um app/tools.py)
# ---------------------------------------------------------------------------

@mcp.tool()
def whatsapp_status() -> dict:
    """Zeigt, ob WhatsApp verknüpft und verbunden ist (und mit welcher Nummer)."""
    return tools.status(bridge)


@mcp.tool()
def whatsapp_list_chats(query: str = "", limit: int = 20) -> dict:
    """Listet WhatsApp-Chats (Einzel- und Gruppenchats), neueste zuerst, mit letzter Nachricht. query filtert nach Name oder Nummer."""
    return tools.list_chats(bridge, query, limit)


@mcp.tool()
def whatsapp_read_chat(chat: str, limit: int = 30, before: str = "", after: str = "") -> dict:
    """Liest die letzten Nachrichten eines Chats (älteste zuerst). chat: Name, Telefonnummer mit Ländervorwahl oder JID. before/after: ISO-Zeitpunkt (z.B. 2026-10-17T00:00:00Z) zum Blättern bzw. Eingrenzen."""
    return tools.read_chat(bridge, chat, limit, before, after)


@mcp.tool()
def whatsapp_search_messages(query: str, chat: str = "", limit: int = 30, after: str = "", before: str = "") -> dict:
    """Volltextsuche in WhatsApp-Nachrichten, optional auf einen Chat (Name/Nummer/JID) und Zeitraum (ISO) begrenzt."""
    return tools.search_messages(bridge, query, chat, limit, after, before)


@mcp.tool()
def whatsapp_search_contacts(query: str, limit: int = 20) -> dict:
    """Sucht WhatsApp-Kontakte nach Name oder Nummer."""
    return tools.search_contacts(bridge, query, limit)


@mcp.tool()
def whatsapp_send_message(to: str, text: str) -> dict:
    """Sendet eine WhatsApp-Textnachricht SOFORT. to: Kontakt-/Gruppenname, Telefonnummer mit Ländervorwahl oder JID. Bei mehrdeutigem Namen kommt eine Kandidatenliste zurück statt zu senden. Vor dem Senden den Text mit der Person abstimmen."""
    return tools.send_message(bridge, to, text)


@mcp.tool()
def whatsapp_send_file(to: str, filename: str, file_base64: str, caption: str = "", mimetype: str = "") -> dict:
    """Sendet eine Datei (Base64) per WhatsApp — Bilder als Foto, alles andere als Dokument. to wie bei whatsapp_send_message."""
    return tools.send_file(bridge, to, filename, file_base64, caption, mimetype)


@mcp.tool()
def whatsapp_download_media(chat_jid: str, message_id: str):
    """Lädt Bild/Video/Audio/Dokument einer Nachricht herunter (IDs aus whatsapp_read_chat). Bilder werden direkt angezeigt, sonst Base64."""
    result = tools.download_media(bridge, chat_jid, message_id)
    mime = result.get("mimetype", "")
    if mime in ("image/jpeg", "image/png", "image/webp", "image/gif"):
        meta = {k: v for k, v in result.items() if k != "data_base64"}
        return [Image(data=base64.b64decode(result["data_base64"]), format=mime.split("/")[1]), meta]
    return result


@app.get("/health")
def health():
    return {"status": "ok", "time": time.time()}


app.mount("/", mcp_asgi_app)  # FastMCP hängt intern selbst "/mcp" an — muss NACH allen eigenen Routen stehen
