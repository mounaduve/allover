#!/bin/bash
# Rückfrage des Auto-Vermittlers an Mouna ins Auto schicken – erscheint und wird vorgelesen
# als Antwort der Zielsitzung (damit die App nicht ewig auf „Claude arbeitet …“ wartet).
# Aufruf: auto-ask.sh <local_…-Sitzungs-ID> "<Text>"
set -e
. "$HOME/.claude/auto-relay.env"
SID="$1"; TEXT="$2"
[ -n "$SID" ] && [ -n "$TEXT" ] || { echo "Aufruf: auto-ask.sh <local_id> <text>"; exit 2; }
CLI=$(python3 - "$SID" <<'PY'
import glob, json, os, sys
for f in glob.glob(os.path.expanduser("~/.claude/sessions/*.json")):
    try:
        s = json.load(open(f))
    except Exception:
        continue
    if s.get("hostSessionId") == sys.argv[1]:
        print(s["sessionId"]); break
PY
)
[ -n "$CLI" ] || { echo "Sitzung $SID nicht gefunden"; exit 1; }
CODE=$(jq -n --arg c "$CLI" --arg t "$TEXT" '{cli_id:$c, text:$t}' | curl -s -m 15 -o /dev/null -w '%{http_code}' \
  -X POST -H "Authorization: Bearer $AUTO_MAC_TOKEN" -H 'Content-Type: application/json' \
  --data-binary @- "$AUTO_RELAY_URL/api/mac/replies")
[ "$CODE" = 200 ] && echo "Rückfrage ans Auto gesendet" || { echo "Fehler $CODE"; exit 1; }
