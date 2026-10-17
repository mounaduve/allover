import os
import tempfile

# app.main liest diese Werte beim Import.
os.environ.setdefault("PUBLIC_BASE_URL", "http://testserver")
os.environ.setdefault("CONNECTOR_PASSWORD", "geheim")
os.environ.setdefault("SESSION_SECRET", "test-session-secret")
os.environ.setdefault("BRIDGE_TOKEN", "bridge-token")
os.environ.setdefault("CONNECTOR_DB", os.path.join(tempfile.mkdtemp(), "connector.db"))


class FakeBridge:
    """Zeichnet Aufrufe auf und liefert vorbereitete Antworten."""

    def __init__(self, chats=None, contacts=None, responses=None):
        self.calls = []
        self.chats = chats or []
        self.contacts = contacts or []
        self.responses = responses or {}

    def get(self, path, params=None):
        self.calls.append(("get", path, params))
        if path == "/chats":
            q = (params or {}).get("query", "").lower()
            return {"chats": [c for c in self.chats if q in c["name"].lower()]}
        if path == "/contacts":
            q = (params or {}).get("query", "").lower()
            return {"contacts": [c for c in self.contacts if q in c["name"].lower()]}
        return self.responses.get(path, {})

    def post(self, path, json=None):
        self.calls.append(("post", path, json))
        return self.responses.get(path, {"status": "gesendet", "id": "MSG1"})

    def get_bytes(self, path):
        self.calls.append(("get_bytes", path, None))
        return b"\x89PNG"
