# SSE Integration (Events)

Dieses Patch fügt Server‑Sent Events hinzu, damit das Dashboard ohne Polling sofort aktualisiert,
wenn Einträge (Urlaub/Termine) angelegt oder gelöscht werden.

## Neue Dateien
- `db/init/sql/005_events.sql` – Tabelle `events` für Pub/Sub
- `db/init/api/db_pdo.php` – PDO‑Bootstrap ohne JSON‑Header (für SSE)
- `db/init/api/events.php` – SSE‑Endpoint

## Backend Änderungen
- `db/init/api/eintraege.php` publiziert nach POST/DELETE einen Event: `entries-changed`.

## Frontend Änderungen
- `src/App.jsx`:
  - EventSource (`/api/events.php`) wird beim Mount geöffnet und lädt Einträge bei `entries-changed`.
  - Fallback‑Polling bleibt aktiv (60s).
  - Exakter Refresh zu Start/Ende‑Zeitpunkten der Einträge.
- `src/EntriesModal.jsx`:
  - Optionaler **Abmelden**‑Button.
  - Lokales `window`‑Event `entries:changed` wird weiterhin gefeuert.

## Setup
1. SQL Migration ausführen (wird bei init automatisch ausgeführt): `005_events.sql`.
2. PHP‑Server muss **SSE** unterstützen (keine Output‑Buffer/Proxy, ggf. Apache `mod_php` oder nginx+php-fpm mit `X-Accel-Buffering: no`).

## Test
- Dashboard öffnen (Tab A).
- In einem zweiten Tab (B) im „Einträge“-Dialog einen Termin/Urlaub anlegen oder löschen.
- Tab A sollte ohne Reload automatisch den Status aktualisieren.
