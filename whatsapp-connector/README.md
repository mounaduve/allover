# wk-whatsapp-connector

WhatsApp als **eigener Connector in Claude Chat** (Browser, Desktop-App, Handy),
statt nur lokal in Claude Code. Aufgebaut wie der `wk-m365-connector`, läuft
aber auf der Synology.

## Warum ein eigener Server?

Claude Code darf MCP-Server lokal auf dem Rechner starten, Claude Chat nicht.
Claude Chat spricht nur mit Connectoren, die über eine öffentliche
**HTTPS-Adresse** erreichbar sind und sich per OAuth anmelden lassen. Genau das
macht dieser Connector.

## Aufbau

```
Claude Chat ──HTTPS──▶ Synology Reverse Proxy ──▶ connector (Python, Port 8010)
                                                      │  interne API + Token
                                                      ▼
                                                   bridge (Go, whatsmeow) ──▶ WhatsApp
```

- **`bridge/`** (Go, [whatsmeow](https://github.com/tulir/whatsmeow)): ist bei
  WhatsApp als **verknüpftes Gerät** angemeldet (wie WhatsApp Web), hält die
  Verbindung dauerhaft offen und speichert Chats und Nachrichten in
  `data/bridge/messages.db`. Die Sitzung liegt in `data/bridge/session.db`.
  Die Bridge ist nur im Docker-Netz erreichbar und zusätzlich über
  `BRIDGE_TOKEN` geschützt.
- **`connector/`** (Python, FastAPI und FastMCP): MCP-Endpunkt `/mcp` für Claude.
  Er ist gleichzeitig OAuth-Server (`/authorize`, `/token`, PKCE S256). Statt
  eines Microsoft-Logins gibt es ein **Connector-Passwort**, weil genau ein
  WhatsApp-Konto dahintersteht. Unter `/setup` liegt die Einrichtungsseite
  (QR-Code bzw. Kopplungscode, Status, Trennen, Claude-Zugänge widerrufen).

## Verfügbare Tools

| Tool | Was es tut |
|---|---|
| `whatsapp_status` | Ist WhatsApp verknüpft und verbunden, mit welcher Nummer? |
| `whatsapp_list_chats` | Chats (Einzel und Gruppen), neueste zuerst, mit letzter Nachricht; optional nach Name filtern |
| `whatsapp_read_chat` | Nachrichten eines Chats lesen (Name, Nummer oder JID); Zeitraum mit `before`/`after` |
| `whatsapp_search_messages` | Volltextsuche, optional je Chat und Zeitraum |
| `whatsapp_search_contacts` | Kontakte nach Name oder Nummer suchen |
| `whatsapp_send_message` | Textnachricht senden; bei mehrdeutigem Namen kommt eine Auswahl zurück statt zu senden |
| `whatsapp_send_file` | Datei senden (Bild als Foto, sonst als Dokument) |
| `whatsapp_download_media` | Bild, Audio, Video oder Dokument einer Nachricht laden (Bilder werden direkt angezeigt) |

## Einrichtung auf der Synology

Voraussetzung: DSM 7.2 oder neuer mit dem Paket **Container Manager**.

1. **Dateien ablegen:** Den Ordner `whatsapp-connector/` per File Station nach
   z. B. `/docker/whatsapp-connector` kopieren.
2. **`.env` anlegen:** `.env.example` nach `.env` kopieren und ausfüllen. Für
   `SESSION_SECRET` und `BRIDGE_TOKEN` lange Zufallsstrings verwenden, für
   `CONNECTOR_PASSWORD` ein gutes Passwort.
3. **Adresse und Zertifikat:**
   - *Systemsteuerung → Externer Zugriff → DDNS*, z. B. `deinname.synology.me`
     (falls noch nicht vorhanden).
   - *Systemsteuerung → Sicherheit → Zertifikat*: Let's-Encrypt-Zertifikat für
     `whatsapp.deinname.synology.me` (oder Wildcard) anlegen.
4. **Reverse Proxy:** *Systemsteuerung → Anmeldeportal → Erweitert → Reverse
   Proxy → Erstellen*
   - Quelle: `HTTPS`, Hostname `whatsapp.deinname.synology.me`, Port `443`
   - Ziel: `HTTP`, `localhost`, Port `8010`
   - Im Router Port 443 auf die Synology weiterleiten (falls noch nicht
     geschehen). Diese Adresse gehört als `PUBLIC_BASE_URL` in die `.env`.
5. **Starten:** *Container Manager → Projekt → Erstellen*, Pfad
   `/docker/whatsapp-connector` wählen. Die vorhandene `docker-compose.yml`
   wird erkannt. Dann *Erstellen* klicken; beide Images werden auf der
   Synology gebaut.
6. **WhatsApp koppeln:** `https://whatsapp.deinname.synology.me/setup` öffnen,
   mit dem Connector-Passwort anmelden und den QR-Code scannen: im Handy unter
   *WhatsApp → Einstellungen → Verknüpfte Geräte → Gerät hinzufügen*. Ist die
   Seite auf dem Handy selbst offen, geht es stattdessen per Kopplungscode.
   Läuft ein QR-Code ungescannt ab, erscheint auf der Seite der Knopf
   *Neuen QR-Code erzeugen*.
7. **In Claude eintragen:** *claude.ai → Einstellungen → Connectoren →
   Benutzerdefinierten Connector hinzufügen*
   - URL: `https://whatsapp.deinname.synology.me/mcp`
   - *Verbinden* klicken und das Connector-Passwort eingeben.

   Danach steht WhatsApp in Claude Chat zur Verfügung, auch in der Handy-App.
   Den alten lokalen WhatsApp-MCP in Claude Code kann man dann entfernen und
   stattdessen auch dort diesen Connector nutzen.

### Alternative: Tailscale Funnel unter einem Teilpfad

Ohne öffentliche IPv4 (z. B. Starlink/CGNAT) gehen DDNS und Reverse Proxy nicht.
Dann kann Tailscale Funnel den Connector veröffentlichen. claude.ai erreicht nur
Port 443. Läuft dort schon ein anderer Dienst, hängt der Connector unter einem
Teilpfad, z. B. `/whatsapp`:

- `.env`: `PUBLIC_BASE_URL=https://<gerät>.<tailnet>.ts.net/whatsapp`
- Funnel (Tailscale schneidet den Teilpfad ab):
  ```
  tailscale funnel --bg --set-path /whatsapp 8010
  tailscale funnel --bg --set-path /.well-known/oauth-authorization-server/whatsapp http://127.0.0.1:8010/.well-known/oauth-authorization-server
  tailscale funnel --bg --set-path /.well-known/oauth-protected-resource/whatsapp http://127.0.0.1:8010/.well-known/oauth-protected-resource
  ```
  Die beiden `.well-known`-Einträge braucht Claude, um die Anmeldung unter dem
  Teilpfad zu finden (RFC 8414 / RFC 9728).
- URL in Claude: `https://<gerät>.<tailnet>.ts.net/whatsapp/mcp`

Der Port ist in der `docker-compose.yml` auf `127.0.0.1` begrenzt. Für den
Synology-Reverse-Proxy (Ziel `localhost`) reicht das ebenfalls.

**Images bauen auf schwachen NAS:** Hat die NAS wenig RAM, baut man die Images
auf einem anderen Rechner (`docker buildx build --platform linux/amd64 -t
whatsapp-connector-bridge:latest --load bridge`, ebenso `connector`), überträgt
sie mit `docker save … | ssh … docker load` und startet mit
`docker-compose up -d --no-build`.

### Aktualisieren

Neue Version einspielen, dann im Container Manager das Projekt *Stoppen* und
*Erstellen* (bzw. *Bereinigen und neu erstellen*). Die Daten in `data/` bleiben
erhalten. WhatsApp muss nicht neu gekoppelt werden.

## Gut zu wissen

- **Verlauf:** Beim ersten Koppeln schickt WhatsApp einen Teil des älteren
  Verlaufs mit (meist die letzten Monate). Ab dann wird alles mitgeschrieben,
  solange der Container läuft.
- **Handy online halten:** Verknüpfte Geräte werden von WhatsApp abgemeldet,
  wenn das Handy rund 14 Tage offline war. Dann auf `/setup` neu koppeln.
- **Inoffizielle Schnittstelle:** whatsmeow nutzt dasselbe Protokoll wie
  WhatsApp Web, ist aber keine offizielle API. Für normale persönliche Nutzung
  ist das unproblematisch. Massenversand sollte man damit nicht machen.
- **Sicherheit:** Wer das Connector-Passwort kennt, kann WhatsApp lesen und
  schreiben. Über `/setup` → *Alle Claude-Zugänge widerrufen* werden alle
  ausgegebenen Tokens ungültig. Die Bridge ist von außen nicht erreichbar.
  `data/` enthält die WhatsApp-Sitzung und alle Nachrichten; das sollte nicht in
  eine öffentliche Freigabe.

## Entwicklung

```bash
# Bridge
cd bridge && go build . && DATA_DIR=./data BRIDGE_TOKEN=t LISTEN_ADDR=:8080 ./wk-whatsapp-bridge

# Connector
cd connector
pip install -r requirements-dev.txt
pytest
PUBLIC_BASE_URL=http://localhost:8000 CONNECTOR_PASSWORD=pw SESSION_SECRET=s \
  BRIDGE_TOKEN=t BRIDGE_URL=http://localhost:8080 uvicorn app.main:app --reload
```
