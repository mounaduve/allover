"""Relay zwischen der Android-Auto-App und den Claude-Sitzungen auf dem Mac.

Der Mac ist nicht öffentlich erreichbar. Er meldet sich deshalb selbst beim Relay:
er schickt die Liste seiner Sitzungen, holt neue Nachrichten ab und liefert Antworten ein.
Die App spricht nur mit dem Relay.

Zugänge:
- Mac: fester Schlüssel MAC_TOKEN (Bearer).
- App: Geräteschlüssel aus der Kopplung. Die App fordert einen Code an, der Mac gibt ihn frei.
"""
import asyncio
import hashlib
import json
import os
import secrets
import sqlite3
import time
from contextlib import contextmanager

from fastapi import Depends, FastAPI, Header, HTTPException, Response
from pydantic import BaseModel, Field

DB_PATH = os.environ.get("DB_PATH", "/app/data/relay.db")
MAC_TOKEN = os.environ.get("MAC_TOKEN", "")
MAC_ONLINE_SECONDS = 60
PAIR_TTL_SECONDS = 600
MAX_WAIT = 25

app = FastAPI(title="claude-auto relay")


def _hash(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


@contextmanager
def db():
    con = sqlite3.connect(DB_PATH, timeout=10)
    con.row_factory = sqlite3.Row
    try:
        yield con
        con.commit()
    finally:
        con.close()


def init_db() -> None:
    os.makedirs(os.path.dirname(DB_PATH) or ".", exist_ok=True)
    with db() as con:
        con.executescript(
            """
            PRAGMA journal_mode=WAL;
            CREATE TABLE IF NOT EXISTS devices (
                token_hash TEXT PRIMARY KEY, name TEXT, created REAL);
            CREATE TABLE IF NOT EXISTS pairings (
                code TEXT PRIMARY KEY, secret_hash TEXT, name TEXT, created REAL,
                token TEXT);
            CREATE TABLE IF NOT EXISTS state (key TEXT PRIMARY KEY, value TEXT);
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT, session_id TEXT, text TEXT,
                created REAL, delivered REAL);
            CREATE TABLE IF NOT EXISTS replies (
                id INTEGER PRIMARY KEY AUTOINCREMENT, cli_id TEXT, text TEXT, created REAL);
            """
        )


init_db()


def _bearer(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Kein Zugangsschlüssel")
    return authorization[7:].strip()


def require_mac(authorization: str | None = Header(None)) -> None:
    token = _bearer(authorization)
    if not MAC_TOKEN or not secrets.compare_digest(token, MAC_TOKEN):
        raise HTTPException(401, "Falscher Schlüssel")


def require_device(authorization: str | None = Header(None)) -> None:
    token = _bearer(authorization)
    with db() as con:
        if not con.execute("SELECT 1 FROM devices WHERE token_hash=?", (_hash(token),)).fetchone():
            raise HTTPException(401, "Gerät nicht gekoppelt")


def _get_state(key: str, default=None):
    with db() as con:
        row = con.execute("SELECT value FROM state WHERE key=?", (key,)).fetchone()
    return json.loads(row["value"]) if row else default


def _set_state(key: str, value) -> None:
    with db() as con:
        con.execute(
            "INSERT INTO state(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            (key, json.dumps(value)),
        )


def _sessions() -> list[dict]:
    return _get_state("sessions", [])


def _cli_id(session_id: str) -> str | None:
    for s in _sessions():
        if s.get("id") == session_id:
            return s.get("cli_id")
    return None


def _mac_online() -> bool:
    return time.time() - _get_state("mac_seen", 0) < MAC_ONLINE_SECONDS


@app.get("/api/health")
def health():
    return {"ok": True}


# ---------- Kopplung ----------

class PairStart(BaseModel):
    name: str = Field("Handy", max_length=60)


@app.post("/api/pair/start")
def pair_start(body: PairStart):
    now = time.time()
    with db() as con:
        con.execute("DELETE FROM pairings WHERE created < ?", (now - PAIR_TTL_SECONDS,))
        if con.execute("SELECT count(*) FROM pairings").fetchone()[0] >= 5:
            raise HTTPException(429, "Zu viele offene Kopplungen")
        code = f"{secrets.randbelow(10**6):06d}"
        secret = secrets.token_urlsafe(32)
        con.execute(
            "INSERT INTO pairings(code, secret_hash, name, created) VALUES(?, ?, ?, ?)",
            (code, _hash(secret), body.name, now),
        )
    return {"code": code, "secret": secret}


@app.get("/api/pair/status")
def pair_status(secret: str):
    with db() as con:
        row = con.execute(
            "SELECT code, token FROM pairings WHERE secret_hash=?", (_hash(secret),)
        ).fetchone()
        if not row:
            raise HTTPException(404, "Kopplung abgelaufen")
        if not row["token"]:
            return {"approved": False}
        con.execute("DELETE FROM pairings WHERE code=?", (row["code"],))
    return {"approved": True, "token": row["token"]}


class PairApprove(BaseModel):
    code: str


@app.post("/api/mac/pair/approve", dependencies=[Depends(require_mac)])
def pair_approve(body: PairApprove):
    with db() as con:
        row = con.execute(
            "SELECT name, created FROM pairings WHERE code=? AND token IS NULL", (body.code,)
        ).fetchone()
        if not row or row["created"] < time.time() - PAIR_TTL_SECONDS:
            raise HTTPException(404, "Code unbekannt oder abgelaufen")
        token = secrets.token_urlsafe(32)
        con.execute("UPDATE pairings SET token=? WHERE code=?", (token, body.code))
        con.execute(
            "INSERT INTO devices(token_hash, name, created) VALUES(?, ?, ?)",
            (_hash(token), row["name"], time.time()),
        )
    return {"approved": True, "name": row["name"]}


# ---------- App ----------

@app.get("/api/status", dependencies=[Depends(require_device)])
def status():
    sessions = []
    with db() as con:
        for s in _sessions():
            last = con.execute(
                "SELECT id, text FROM replies WHERE cli_id=? ORDER BY id DESC LIMIT 1",
                (s.get("cli_id"),),
            ).fetchone()
            sessions.append({
                "id": s["id"],
                "name": s.get("name") or "Ohne Namen",
                "busy": s.get("status") == "busy",
                "last_reply_id": last["id"] if last else 0,
            })
    return {"mac_online": _mac_online(), "sessions": sessions}


class NewMessage(BaseModel):
    session_id: str
    text: str = Field(..., min_length=1, max_length=8000)


@app.post("/api/messages", dependencies=[Depends(require_device)])
def new_message(body: NewMessage):
    if not any(s["id"] == body.session_id for s in _sessions()):
        raise HTTPException(404, "Sitzung unbekannt")
    with db() as con:
        cur = con.execute(
            "INSERT INTO messages(session_id, text, created) VALUES(?, ?, ?)",
            (body.session_id, body.text, time.time()),
        )
    return {"id": cur.lastrowid, "mac_online": _mac_online()}


@app.get("/api/replies", dependencies=[Depends(require_device)])
async def replies(session_id: str, after: int = 0, wait: int = 0):
    """Neueste Antwort einer Sitzung nach `after`; wartet bis `wait` Sekunden darauf."""
    deadline = time.time() + min(max(wait, 0), MAX_WAIT)
    while True:
        cli_id = _cli_id(session_id)
        if cli_id:
            with db() as con:
                row = con.execute(
                    "SELECT id, text, created FROM replies WHERE cli_id=? AND id>? ORDER BY id DESC LIMIT 1",
                    (cli_id, after),
                ).fetchone()
            if row:
                return {"id": row["id"], "text": row["text"], "created": row["created"]}
        if time.time() >= deadline:
            return Response(status_code=204)
        await asyncio.sleep(0.5)


class LogLines(BaseModel):
    lines: list[str] = Field(..., max_length=200)


@app.post("/api/log", dependencies=[Depends(require_device)])
def device_log(body: LogLines):
    """Fehlerprotokoll der App (für die Fehlersuche vom Mac aus), die letzten 500 Zeilen."""
    log = _get_state("device_log", [])
    log = (log + [l[:500] for l in body.lines])[-500:]
    _set_state("device_log", log)
    return {"ok": True}


@app.get("/api/mac/log", dependencies=[Depends(require_mac)])
def mac_log(lines: int = 100):
    return {"lines": _get_state("device_log", [])[-lines:]}


# ---------- Mac ----------

class MacSession(BaseModel):
    id: str
    cli_id: str
    name: str | None = None
    status: str | None = None


@app.post("/api/mac/sessions", dependencies=[Depends(require_mac)])
def mac_sessions(body: list[MacSession]):
    _set_state("sessions", [s.model_dump() for s in body])
    _set_state("mac_seen", time.time())
    return {"ok": True, "count": len(body)}


@app.get("/api/mac/inbox", dependencies=[Depends(require_mac)])
async def mac_inbox(wait: int = 0):
    """Nächste nicht zugestellte Nachricht; wartet bis `wait` Sekunden. Zählt als Lebenszeichen."""
    deadline = time.time() + min(max(wait, 0), MAX_WAIT)
    while True:
        _set_state("mac_seen", time.time())
        with db() as con:
            row = con.execute(
                "SELECT id, session_id, text FROM messages WHERE delivered IS NULL ORDER BY id LIMIT 1"
            ).fetchone()
            if row:
                con.execute("UPDATE messages SET delivered=? WHERE id=?", (time.time(), row["id"]))
                return {"id": row["id"], "session_id": row["session_id"], "text": row["text"]}
        if time.time() >= deadline:
            return Response(status_code=204)
        await asyncio.sleep(0.5)


class MacReply(BaseModel):
    cli_id: str
    text: str = Field(..., max_length=20000)


@app.post("/api/mac/replies", dependencies=[Depends(require_mac)])
def mac_reply(body: MacReply):
    now = time.time()
    with db() as con:
        cur = con.execute(
            "INSERT INTO replies(cli_id, text, created) VALUES(?, ?, ?)", (body.cli_id, body.text, now)
        )
        con.execute("DELETE FROM replies WHERE created < ?", (now - 7 * 86400,))
        con.execute("DELETE FROM messages WHERE created < ?", (now - 7 * 86400,))
    return {"id": cur.lastrowid}
