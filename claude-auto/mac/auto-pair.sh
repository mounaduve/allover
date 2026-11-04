#!/bin/bash
# Gibt eine Kopplung frei: auto-pair.sh <6-stelliger Code aus der App>
. "$HOME/.claude/auto-relay.env"
curl -s -m 15 -X POST -H "Authorization: Bearer $AUTO_MAC_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"code\":\"$1\"}" "$AUTO_RELAY_URL/api/mac/pair/approve"; echo
