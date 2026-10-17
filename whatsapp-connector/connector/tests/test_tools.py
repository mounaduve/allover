"""Tests für app/tools.py — ohne Netz, mit FakeBridge."""
from app import tools
from tests.conftest import FakeBridge

CHATS = [
    {"jid": "4917011111111@s.whatsapp.net", "name": "Anna Schmidt"},
    {"jid": "4917022222222@s.whatsapp.net", "name": "Anna Müller"},
    {"jid": "120363000000000001@g.us", "name": "DUWO 2016er Eltern"},
]
CONTACTS = [
    {"jid": "4917033333333@s.whatsapp.net", "name": "Thais Beispiel", "push_name": "Thais", "phone": "+4917033333333"},
]


def test_resolve_jid_passthrough():
    b = FakeBridge()
    assert tools.resolve_chat(b, "120363000000000001@g.us")["jid"] == "120363000000000001@g.us"
    assert b.calls == []


def test_resolve_phone_formats():
    b = FakeBridge()
    assert tools.resolve_chat(b, "+49 170 1234567")["jid"] == "491701234567@s.whatsapp.net"
    assert tools.resolve_chat(b, "0049-170-1234567")["jid"] == "491701234567@s.whatsapp.net"
    assert "error" in tools.resolve_chat(b, "0170 1234567")  # ohne Ländervorwahl


def test_resolve_unique_name_from_chats_and_contacts():
    b = FakeBridge(CHATS, CONTACTS)
    assert tools.resolve_chat(b, "duwo")["jid"] == "120363000000000001@g.us"
    assert tools.resolve_chat(b, "thais")["jid"] == "4917033333333@s.whatsapp.net"


def test_resolve_ambiguous_returns_candidates():
    r = tools.resolve_chat(FakeBridge(CHATS), "Anna")
    assert "error" in r and len(r["candidates"]) == 2


def test_resolve_exact_name_wins():
    assert tools.resolve_chat(FakeBridge(CHATS), "anna müller")["jid"] == "4917022222222@s.whatsapp.net"


def test_resolve_unknown():
    assert "error" in tools.resolve_chat(FakeBridge(CHATS), "Niemand")


def test_send_message_resolves_name():
    b = FakeBridge(CHATS)
    r = tools.send_message(b, "DUWO", "Training fällt aus")
    assert ("post", "/send", {"to": "120363000000000001@g.us", "text": "Training fällt aus"}) in b.calls
    assert r["to_name"] == "DUWO 2016er Eltern"


def test_send_message_ambiguous_does_not_send():
    b = FakeBridge(CHATS)
    r = tools.send_message(b, "Anna", "Hallo")
    assert "candidates" in r
    assert not any(c[0] == "post" for c in b.calls)


def test_read_chat_passes_filters():
    b = FakeBridge(CHATS, responses={"/messages": {"messages": [{"id": "1"}]}})
    r = tools.read_chat(b, "DUWO", limit=5, after="2026-10-01T00:00:00Z")
    assert r["chat_name"] == "DUWO 2016er Eltern" and r["messages"] == [{"id": "1"}]
    assert ("get", "/messages", {"chat": "120363000000000001@g.us", "limit": 5, "before": "",
                                  "after": "2026-10-01T00:00:00Z"}) in b.calls
