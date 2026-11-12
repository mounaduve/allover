#!/bin/bash
# Läuft im Hintergrund der Vermittler-Sitzung auf dem Mac.
# Meldet alle paar Sekunden die laufenden Sitzungen ans Relay und wartet auf eine
# Nachricht aus dem Auto. Kommt eine, gibt es sie als JSON aus und beendet sich –
# die Vermittler-Sitzung wacht dadurch auf, leitet weiter und startet das Skript neu.
CONF="$HOME/.claude/auto-relay.env"
[ -f "$CONF" ] || { echo "FEHLER: $CONF fehlt" >&2; exit 2; }
. "$CONF"
: "${AUTO_RELAY_URL:?}" "${AUTO_MAC_TOKEN:?}"
SELF="${AUTO_SELF_HOST_ID:-}"

sessions_json() {
  SELF="$SELF" python3 - <<'PY'
import glob, json, os
# Zuletzt benutzt wie in der Seitenleiste der Claude-App; updatedAt der CLI-Datei bleibt oft stehen
act = {}
for f in glob.glob(os.path.expanduser("~/Library/Application Support/Claude/claude-code-sessions/*/*/local_*.json")):
    try:
        act[os.path.basename(f)[:-5]] = json.load(open(f)).get("lastActivityAt") or 0
    except Exception:
        pass
out = []
for f in glob.glob(os.path.expanduser("~/.claude/sessions/*.json")):
    try:
        s = json.load(open(f))
        os.kill(int(s["pid"]), 0)
    except Exception:
        continue
    hid = s.get("hostSessionId")
    if s.get("entrypoint") != "claude-desktop" or not hid or hid == os.environ.get("SELF"):
        continue
    out.append({"id": hid, "cli_id": s["sessionId"], "name": s.get("name"),
                "status": s.get("status"), "_t": max(act.get(hid, 0), s.get("updatedAt", 0))})
out.sort(key=lambda x: -x.pop("_t"))
print(json.dumps(out))
PY
}

while true; do
  sessions_json | curl -s -m 10 -o /dev/null -X POST -H "Authorization: Bearer $AUTO_MAC_TOKEN" \
    -H 'Content-Type: application/json' --data-binary @- "$AUTO_RELAY_URL/api/mac/sessions"
  RES=$(curl -s -m 35 -w '\n%{http_code}' -H "Authorization: Bearer $AUTO_MAC_TOKEN" \
    "$AUTO_RELAY_URL/api/mac/inbox?wait=25")
  CODE=$(printf '%s' "$RES" | tail -1)
  BODY=$(printf '%s' "$RES" | sed '$d')
  if [ "$CODE" = "200" ]; then
    printf 'AUTO-NACHRICHT %s\n' "$BODY"
    exit 0
  fi
  [ "$CODE" = "204" ] || sleep 5
done
