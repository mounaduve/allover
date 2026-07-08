# Geteilte Urlaubspackliste

Eine schlichte, gemeinsam nutzbare Packliste zum Abhaken – ohne Login, per Link
auf dem Handy zu öffnen. Gedacht als Alternative zu Alexa-Listen (auf die von
außen nicht mehr zugegriffen werden kann).

## Link

**https://wahrekommunikation.app.n8n.cloud/webhook/packliste**

Einfach auf dem Handy öffnen und als Lesezeichen / zum Startbildschirm
hinzufügen. Der Link ist bewusst offen (kein Passwort) – wer ihn hat, kann die
Liste sehen und bearbeiten.

## Funktionen

- Punkte abhaken (Tippen auf den Kreis), Fortschrittsbalken oben
- Neue Punkte unten hinzufügen (mit Kategorie)
- Punkte löschen (× rechts)
- Gruppierung nach Kategorie: Dokumente, Kleidung, Schuhe, Kinder, Kulturbeutel, Medikamente, Supplements, Technik, Strand & Wasser, Spiele, Vor der Abreise, Sonstiges
- Aktualisiert sich alle ~8 Sekunden automatisch, damit beide dieselben Häkchen sehen
- Eintrag umbenennen: auf den Text tippen (dort auch Rubrik wechseln)
- Verschieben zwischen Rubriken: im Bearbeiten-Menü die Rubrik ändern
- Abschnitte ein-/ausklappen (auf die Überschrift tippen) und mit ▲▼ verschieben; Ansicht-Einstellungen werden lokal pro Gerät gespeichert

## Technik

- **Frontend:** `chunks/packliste.html` – eine Single-Page-App (Alpine.js + Tailwind via CDN)
- **Backend:** n8n-Workflow „Urlaubspackliste (geteilte Liste)" (im persönlichen
  n8n-Projekt), 6 Webhook-Routen:
  - `GET  /webhook/packliste` – liefert die Seite (mit vorab geladenen Daten)
  - `GET  /webhook/packliste/items` – Liste als JSON
  - `POST /webhook/packliste/toggle` – Häkchen speichern (`{id, completed}`)
  - `POST /webhook/packliste/add` – Punkt hinzufügen (`{title, category}`)
  - `POST /webhook/packliste/delete` – Punkt löschen (`{id}`)
  - `POST /webhook/packliste/update` – Titel/Kategorie ändern (`{id, title, category}`)
- **Daten:** n8n-Datentabelle `packliste` (Spalten: `title`, `category`, `completed`)
- `workflow.ts` ist der generierte Workflow-Code; `workflow.template.ts` die
  Vorlage mit Platzhalter für die (base64-eingebettete) HTML-Seite.

### Seite ändern und neu einspielen

1. `chunks/packliste.html` bearbeiten
2. Neu einbetten: `base64 -w0 chunks/packliste.html` → in `workflow.template.ts`
   für `__HTML_B64__` einsetzen → `workflow.ts` erzeugen
3. Workflow in n8n aktualisieren und neu aktivieren
