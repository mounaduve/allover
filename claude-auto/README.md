# Claude Auto

Sprachbedienung der Claude-Code-Sitzungen auf dem Mac aus dem Auto (Android Auto).

```
Automikrofon → App (Handy) → ElevenLabs Scribe → Text
App → Relay (NAS, https://molli-server.tail4e4456.ts.net/auto) → Mac holt ab
Mac: Vermittler-Sitzung leitet per send_message in die Zielsitzung
Antwort: Stop-Hook voice-send.sh → Relay → App liest vor (Android-Sprachausgabe)
```

- `relay/` – FastAPI + SQLite, Container `claude-auto-relay` auf molli-server (`/volume1/docker/claude-auto`,
  Port 127.0.0.1:8020, Funnel-Pfad `/auto`). Tests: `pytest` in Python 3.12.
- `mac/auto-wait.sh` – meldet die Sitzungen ans Relay, wartet auf Nachrichten, gibt eine aus und endet.
  Läuft im Hintergrund der Vermittler-Sitzung. `mac/auto-pair.sh <code>` gibt eine Kopplung frei.
  Konfiguration `~/.claude/auto-relay.env` (AUTO_RELAY_URL, AUTO_MAC_TOKEN, AUTO_SELF_HOST_ID).
- `mac/voice-send.sh.reference` – Stand des Vorlese-Hooks mit Relay-Versand.
- `android/` – App (Car App Library 1.7, CarAudioRecord, Kategorie IOT). Gebaut per GitHub Actions,
  APK unter Release `claude-auto-latest`. Signaturschlüssel in den Secrets `AUTO_KEYSTORE_*`, Kopie in `~/.claude/claude-auto/`.

## Deploy Relay
```
cd relay && docker buildx build --platform linux/amd64 -t claude-auto-relay:latest --load .
docker save claude-auto-relay:latest | gzip | ssh -i ~/.ssh/mailmcp_deploy admin@192.168.188.26 'gunzip | sudo -n /usr/local/bin/docker load'
ssh … 'cd /volume1/docker/claude-auto && sudo -n /usr/local/bin/docker-compose up -d --no-build'
```
**Achtung:** Funnel-Pfade immer mit `tailscale funnel --bg --https=443 --set-path=…` ändern.
`tailscale serve …` schaltet den Funnel für den ganzen Port ab (passiert 04.11., ca. 2 Min. Ausfall von Mail- und WhatsApp-Connector).
