"""OAuth-Codes und Access-Tokens für Claude (SQLite).

Der Connector hat genau eine Besitzerin (ein WhatsApp-Konto), deshalb gibt es
keine Benutzertabelle — wer das Connector-Passwort kennt, bekommt ein Token.
"""
import base64
import hashlib
import os
import secrets
import sqlite3
import time
from pathlib import Path

DB_PATH = Path(os.environ.get("CONNECTOR_DB", Path(__file__).parent.parent / "data" / "connector.db"))

CODE_TTL = 600  # 10 min


def _con():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    return sqlite3.connect(DB_PATH)


def _hash(token: str) -> str:
    # Tokens nur gehasht ablegen — ein geleaktes DB-Backup verrät keine gültigen Tokens.
    return hashlib.sha256(token.encode()).hexdigest()


def init_db():
    con = _con()
    con.execute(
        """CREATE TABLE IF NOT EXISTS oauth_codes (
            code_hash TEXT PRIMARY KEY,
            redirect_uri TEXT,
            code_challenge TEXT,
            code_challenge_method TEXT,
            created_at REAL
        )"""
    )
    con.execute(
        """CREATE TABLE IF NOT EXISTS access_tokens (
            token_hash TEXT PRIMARY KEY,
            created_at REAL
        )"""
    )
    con.commit()
    con.close()


def create_oauth_code(redirect_uri: str, code_challenge: str | None, method: str | None) -> str:
    code = secrets.token_urlsafe(32)
    con = _con()
    con.execute(
        "INSERT INTO oauth_codes (code_hash, redirect_uri, code_challenge, code_challenge_method, created_at)"
        " VALUES (?,?,?,?,?)",
        (_hash(code), redirect_uri, code_challenge, method or "plain", time.time()),
    )
    con.commit()
    con.close()
    return code


def consume_oauth_code(code: str, redirect_uri: str | None, code_verifier: str | None) -> bool:
    """Löst einen Code genau einmal ein und prüft dabei PKCE und redirect_uri."""
    con = _con()
    row = con.execute(
        "SELECT redirect_uri, code_challenge, code_challenge_method, created_at FROM oauth_codes WHERE code_hash=?",
        (_hash(code),),
    ).fetchone()
    if row:
        con.execute("DELETE FROM oauth_codes WHERE code_hash=?", (_hash(code),))
        con.commit()
    con.close()
    if not row:
        return False
    stored_redirect, challenge, method, created_at = row
    if time.time() - created_at > CODE_TTL:
        return False
    if redirect_uri and redirect_uri != stored_redirect:
        return False
    if challenge:
        if not code_verifier:
            return False
        if method == "S256":
            digest = hashlib.sha256(code_verifier.encode()).digest()
            expected = base64.urlsafe_b64encode(digest).rstrip(b"=").decode()
        else:
            expected = code_verifier
        if not secrets.compare_digest(expected, challenge):
            return False
    return True


def create_access_token() -> str:
    token = secrets.token_urlsafe(48)
    con = _con()
    con.execute("INSERT INTO access_tokens (token_hash, created_at) VALUES (?,?)", (_hash(token), time.time()))
    con.commit()
    con.close()
    return token


def is_valid_access_token(token: str) -> bool:
    con = _con()
    row = con.execute("SELECT 1 FROM access_tokens WHERE token_hash=?", (_hash(token),)).fetchone()
    con.close()
    return row is not None


def revoke_all_access_tokens():
    con = _con()
    con.execute("DELETE FROM access_tokens")
    con.commit()
    con.close()
