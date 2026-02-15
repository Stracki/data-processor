# Migration zum Projekt-System - Durchgeführt

## Durchgeführte Schritte

### 1. Problem identifiziert
- SQLAlchemy-Fehler: `metadata` ist ein reserviertes Wort
- Bestehende Daten hatten keine Projekt-Zuordnung

### 2. Fixes implementiert
- `metadata` → `project_metadata` in models.py
- `metadata` → `cycle_metadata` in ProjectCycle
- Alle Referenzen in schemas.py, routers und Frontend aktualisiert

### 3. Migration durchgeführt

```bash
# Im Docker-Container ausgeführt:
docker exec table-data-processor-backend-1 python migrate_to_project_system.py
```

**Ergebnis:**
- ✓ Neue Spalten hinzugefügt (is_global, cycle_config, project_metadata, scope, etc.)
- ✓ Neue Tabellen erstellt (project_cycles, global_values)
- ✓ Alte Constraints entfernt
- ✓ Bestehende Daten migriert (scope='project' gesetzt)

### 4. Global-Projekt initialisiert

```bash
docker exec table-data-processor-backend-1 python init_global.py
```

**Ergebnis:**
- ✓ Global-Projekt erstellt
- ✓ 5 Standard globale Werte erstellt:
  - MWST_SATZ (0.19)
  - MWST_REDUZIERT (0.07)
  - WAEHRUNG ("EUR")
  - DATUM_FORMAT ("DD.MM.YYYY")
  - DEZIMAL_TRENNZEICHEN (",")

### 5. Backend neu gestartet

```bash
docker restart table-data-processor-backend-1
```

## Aktueller Status

✅ Datenbank migriert
✅ Global-Projekt vorhanden
✅ Backend läuft
✅ Frontend läuft

## Nächste Schritte für den Benutzer

1. Browser öffnen: http://localhost:5173/projects
2. Global-Projekt erkunden
3. Erstes eigenes Projekt erstellen
4. Ersten Zyklus erstellen

## Wichtige Hinweise

### Bestehende Daten
- Alle bestehenden Prozeduren haben jetzt `scope='project'`
- Alle bestehenden Workflows haben jetzt `scope='project'`
- Sie sind weiterhin funktionsfähig
- Sie können nachträglich einem Projekt zugeordnet werden

### Datenbank-Schema
Die Datenbank wurde erweitert, aber nicht neu erstellt. Alle bestehenden Daten bleiben erhalten.

### Docker-Befehle für zukünftige Wartung

**Migration erneut ausführen (falls nötig):**
```bash
docker exec table-data-processor-backend-1 python migrate_to_project_system.py
```

**Global-Projekt neu initialisieren:**
```bash
docker exec table-data-processor-backend-1 python init_global.py
```

**Backend-Logs anzeigen:**
```bash
docker logs table-data-processor-backend-1
```

**In Backend-Container einsteigen:**
```bash
docker exec -it table-data-processor-backend-1 /bin/sh
```

**Datenbank-Backup erstellen:**
```bash
docker exec table-data-processor-db-1 pg_dump -U postgres webapp > backup.sql
```

## Bekannte Einschränkungen

1. Bestehende Prozeduren/Workflows sind noch nicht einem spezifischen Projekt zugeordnet
   - Sie funktionieren weiterhin
   - Können über die UI einem Projekt zugeordnet werden

2. Alte Unique Constraints wurden entfernt
   - Neue Constraints berücksichtigen scope, project_id und cycle_id
   - Ermöglicht gleiche Namen in verschiedenen Scopes

## Troubleshooting

### Backend startet nicht
```bash
docker logs table-data-processor-backend-1
```

### Datenbank-Verbindung fehlgeschlagen
```bash
docker ps  # Prüfe ob db-Container läuft
docker restart table-data-processor-db-1
```

### Frontend kann Backend nicht erreichen
- Prüfe ob Backend läuft: http://localhost:8000/docs
- Prüfe CORS-Einstellungen in backend/main.py

### Migration schlägt fehl
- Prüfe ob alle Container laufen
- Führe Migration im Container aus (nicht lokal)
- Prüfe Datenbank-Logs: `docker logs table-data-processor-db-1`
