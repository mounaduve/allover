"""Dünner HTTP-Client für die interne WhatsApp-Bridge (Go/whatsmeow)."""
import os

import httpx


class BridgeError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(f"WhatsApp-Bridge {status}: {message}")
        self.status = status
        self.message = message


class BridgeClient:
    def __init__(self, base_url: str | None = None, token: str | None = None, timeout: float = 60):
        self.base_url = (base_url or os.environ.get("BRIDGE_URL", "http://bridge:8080")).rstrip("/")
        self.token = token or os.environ["BRIDGE_TOKEN"]
        self.timeout = timeout

    def _request(self, method: str, path: str, params=None, json=None) -> httpx.Response:
        params = {k: v for k, v in (params or {}).items() if v not in (None, "")}
        resp = httpx.request(
            method, f"{self.base_url}{path}", params=params, json=json,
            headers={"X-Bridge-Token": self.token}, timeout=self.timeout,
        )
        if resp.status_code >= 400:
            try:
                msg = resp.json().get("error", resp.text)
            except ValueError:
                msg = resp.text
            raise BridgeError(resp.status_code, msg)
        return resp

    def get(self, path: str, params=None) -> dict:
        return self._request("GET", path, params=params).json()

    def post(self, path: str, json=None) -> dict:
        return self._request("POST", path, json=json or {}).json()

    def get_bytes(self, path: str) -> bytes:
        return self._request("GET", path).content
