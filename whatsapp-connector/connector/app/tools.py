"""WhatsApp-Tool-Logik — von app/main.py als MCP-Tools registriert.

Jede Funktion bekommt den Bridge-Client als ersten Parameter, damit sie sich
ohne Netz testen lässt.
"""
import re

from app.bridge import BridgeClient, BridgeError

_JID_RE = re.compile(r"^[\w.\-:]+@[\w.]+$")


def _looks_like_phone(value: str) -> bool:
    digits = re.sub(r"\D", "", value)
    return len(digits) >= 8 and not re.search(r"[A-Za-zÄÖÜäöüß]", value)


def resolve_chat(bridge: BridgeClient, chat: str) -> dict:
    """Macht aus Name, Telefonnummer oder JID eine eindeutige Chat-JID.

    Rückgabe: {"jid": ..., "name": ...} oder {"error": ..., "candidates": [...]}.
    """
    chat = chat.strip()
    if not chat:
        return {"error": "Kein Chat angegeben."}
    if _JID_RE.match(chat):
        return {"jid": chat, "name": chat}
    if _looks_like_phone(chat):
        digits = re.sub(r"\D", "", chat)
        if digits.startswith("00"):
            digits = digits[2:]
        elif digits.startswith("0"):
            return {"error": f"Bitte die Nummer mit Ländervorwahl angeben (z.B. +49…), nicht {chat!r}."}
        return {"jid": f"{digits}@s.whatsapp.net", "name": "+" + digits}

    chats = bridge.get("/chats", {"query": chat, "limit": 10}).get("chats", [])
    contacts = bridge.get("/contacts", {"query": chat, "limit": 10}).get("contacts", [])

    candidates: dict[str, str] = {}
    for c in chats:
        candidates[c["jid"]] = c["name"]
    for c in contacts:
        candidates.setdefault(c["jid"], c["name"] or c["push_name"] or c["phone"])

    if not candidates:
        return {"error": f"Kein Chat oder Kontakt passt zu {chat!r}. whatsapp_list_chats oder "
                         "whatsapp_search_contacts zeigt, was vorhanden ist."}
    exact = {j: n for j, n in candidates.items() if n and n.casefold() == chat.casefold()}
    if len(exact) == 1:
        jid, name = next(iter(exact.items()))
        return {"jid": jid, "name": name}
    if len(candidates) == 1:
        jid, name = next(iter(candidates.items()))
        return {"jid": jid, "name": name}
    return {
        "error": f"{chat!r} ist nicht eindeutig — bitte die passende JID angeben.",
        "candidates": [{"jid": j, "name": n} for j, n in candidates.items()],
    }


def status(bridge: BridgeClient) -> dict:
    return bridge.get("/status")


def list_chats(bridge: BridgeClient, query: str = "", limit: int = 20) -> dict:
    return bridge.get("/chats", {"query": query, "limit": limit})


def read_chat(bridge: BridgeClient, chat: str, limit: int = 30, before: str = "", after: str = "") -> dict:
    target = resolve_chat(bridge, chat)
    if "error" in target:
        return target
    result = bridge.get("/messages", {"chat": target["jid"], "limit": limit, "before": before, "after": after})
    return {"chat_jid": target["jid"], "chat_name": target["name"], **result}


def search_messages(bridge: BridgeClient, query: str, chat: str = "", limit: int = 30,
                    after: str = "", before: str = "") -> dict:
    params = {"query": query, "limit": limit, "after": after, "before": before}
    if chat:
        target = resolve_chat(bridge, chat)
        if "error" in target:
            return target
        params["chat"] = target["jid"]
    return bridge.get("/messages", params)


def search_contacts(bridge: BridgeClient, query: str, limit: int = 20) -> dict:
    return bridge.get("/contacts", {"query": query, "limit": limit})


def send_message(bridge: BridgeClient, to: str, text: str) -> dict:
    target = resolve_chat(bridge, to)
    if "error" in target:
        return target
    result = bridge.post("/send", {"to": target["jid"], "text": text})
    return {**result, "to_name": target["name"]}


def send_file(bridge: BridgeClient, to: str, filename: str, file_base64: str,
              caption: str = "", mimetype: str = "") -> dict:
    target = resolve_chat(bridge, to)
    if "error" in target:
        return target
    result = bridge.post("/send-file", {
        "to": target["jid"], "filename": filename, "data_base64": file_base64,
        "caption": caption, "mimetype": mimetype,
    })
    return {**result, "to_name": target["name"]}


def download_media(bridge: BridgeClient, chat_jid: str, message_id: str) -> dict:
    try:
        return bridge.get("/media", {"chat": chat_jid, "id": message_id})
    except BridgeError as e:
        return {"error": e.message}
