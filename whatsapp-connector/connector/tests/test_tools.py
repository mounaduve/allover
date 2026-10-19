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
    r = tools.send_message(b, "DUWO", text="Training fällt aus", typing=False)
    assert ("post", "/send", {"to": "120363000000000001@g.us", "text": "Training fällt aus", "typing_ms": 0}) in b.calls
    assert r["to_name"] == "DUWO 2016er Eltern"


def test_send_message_ambiguous_does_not_send():
    b = FakeBridge(CHATS)
    r = tools.send_message(b, "Anna", text="Hallo")
    assert "candidates" in r
    assert not any(c[0] == "post" for c in b.calls)


def test_read_chat_passes_filters():
    b = FakeBridge(CHATS, responses={"/messages": {"messages": [{"id": "1"}]}})
    r = tools.read_chat(b, "DUWO", limit=5, after="2026-10-01T00:00:00Z")
    assert r["chat_name"] == "DUWO 2016er Eltern" and r["messages"] == [{"id": "1"}]
    assert ("get", "/messages", {"chat": "120363000000000001@g.us", "limit": 5, "before": "",
                                  "after": "2026-10-01T00:00:00Z"}) in b.calls


def test_send_message_parts_go_out_in_order_with_typing():
    b = FakeBridge(CHATS)
    r = tools.send_message(b, "DUWO", parts=["Hey", "Training fällt heute aus"])
    sends = [c[2] for c in b.calls if c[:2] == ("post", "/send")]
    assert [s["text"] for s in sends] == ["Hey", "Training fällt heute aus"]
    assert all(s["typing_ms"] >= 1500 for s in sends)
    assert r["count"] == 2


def test_send_message_rejects_parts_and_text_and_too_many():
    b = FakeBridge(CHATS)
    assert "error" in tools.send_message(b, "DUWO", parts=["a"], text="b")
    assert "error" in tools.send_message(b, "DUWO", parts=["x"] * 7)
    assert "error" in tools.send_message(b, "DUWO")
    assert not any(c[0] == "post" for c in b.calls)


def test_list_chats_hides_archived_by_default():
    b = FakeBridge(CHATS)
    tools.list_chats(b, "", 10)
    tools.list_chats(b, "", 10, kind="groups", include_archived=True)
    assert ("get", "/chats", {"query": "", "limit": 10, "kind": ""}) in b.calls
    assert ("get", "/chats", {"query": "", "limit": 10, "kind": "groups", "include_archived": "true"}) in b.calls


def test_archive_chat_resolves_and_posts():
    b = FakeBridge(CHATS, responses={"/archive": {"status": "archiviert"}})
    r = tools.archive_chat(b, "DUWO")
    assert ("post", "/archive", {"jid": "120363000000000001@g.us", "archive": True}) in b.calls
    assert r["status"] == "archiviert"


def test_style_guide_returns_own_messages_without_secrets():
    msgs = [{"text": "Hey, klar, bin dabei 😊"}, {"text": "Code ist 123456789"}, {"text": ""}]
    b = FakeBridge(CHATS, responses={"/messages": {"messages": msgs}})
    r = tools.style_guide(b, "DUWO")
    assert r["own_recent_messages"] == ["Hey, klar, bin dabei 😊"]
    assert ("get", "/messages", {"chat": "120363000000000001@g.us", "from_me": "true", "limit": 60}) in b.calls
