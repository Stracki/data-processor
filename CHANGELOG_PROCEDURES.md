# Changelog - Prozeduren System

## Version 1.1 (Aktuell)

### Änderungen

#### Backend
- ✅ **Automatische Namens-Extraktion**: Funktionsname wird automatisch aus dem Code extrahiert
- ✅ `extract_function_name()` Funktion in `parser.py`
- ✅ `validate_function_structure()` gibt jetzt auch den Funktionsnamen zurück
- ✅ `ProcedureCreate` Schema benötigt kein `name` Feld mehr
- ✅ API validiert bei neuen Versionen, dass Funktionsname übereinstimmt

#### Frontend
- ✅ **Name-Feld entfernt**: Kein redundantes Eingabefeld mehr im Editor
- ✅ Funktionsname wird automatisch aus dem Code erkannt
- ✅ **Tabellen-Dropdown**: Bereits korrekt implementiert mit Tabellenname und Zeilenanzahl

#### Dokumentation
- ✅ Quickstart aktualisiert
- ✅ Test-Skript angepasst
- ✅ Changelog erstellt

### Breaking Changes

**API Änderung:**
```json
// ALT
{
  "name": "beispiel",
  "description": "...",
  "code": "def beispiel(...):\n..."
}

// NEU
{
  "description": "...",
  "code": "def beispiel(...):\n..."
}
```

Der `name` Parameter wird nicht mehr akzeptiert und aus dem Code extrahiert.

### Migration

Keine Datenbank-Migration nötig. Bestehende Prozeduren funktionieren weiterhin.

Beim Erstellen neuer Prozeduren oder Versionen:
- Entferne das `name` Feld aus API-Requests
- Der Funktionsname im Code wird automatisch verwendet

### Vorteile

1. **Keine Redundanz**: User muss Namen nicht doppelt eingeben
2. **Weniger Fehler**: Keine Diskrepanz zwischen Funktionsname und Prozedurname möglich
3. **Einfacherer Workflow**: Ein Feld weniger im UI
4. **Konsistenz**: Name ist immer korrekt

---

## Version 1.0 (Initial)

### Features
- Python-Funktionen als Prozeduren
- Versionierung
- Parameter-Analyse
- Sichere Ausführung
- UI mit Editor und Executor
- Execution History
