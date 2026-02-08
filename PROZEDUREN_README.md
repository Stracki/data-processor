# Prozeduren System

## Übersicht

Das Prozeduren-System ermöglicht es, wiederverwendbare Python-Funktionen zu erstellen, die Datentabellen manipulieren. Prozeduren werden versioniert und können über eine dynamische UI ausgeführt werden.

## Konzept

Eine Prozedur ist eine Python-Funktion, die:
- Datentabellen als Input nimmt (werden automatisch zu pandas DataFrames konvertiert)
- Beliebige weitere Parameter akzeptiert (int, float, str, bool)
- Einen pandas DataFrame zurückgibt (wird automatisch als neue Tabelle gespeichert)

## Beispiel

```python
def beispiel(tabelle, wert1: int, wert2: int = 2):
    """
    Multipliziert eine Spalte mit wert1 und addiert wert2
    """
    tabelle['neue_spalte'] = tabelle['alte_spalte'] * wert1 + wert2
    return tabelle
```

**Wichtig:** Der Funktionsname (`beispiel`) wird automatisch als Prozedurname verwendet. Kein separates Name-Feld nötig!

## Features

### Versionierung
- Jede Änderung an einer Prozedur erstellt eine neue Version
- Nur eine Version kann aktiv sein
- Alte Versionen können reaktiviert werden

### Parameter-Typen

**Table**: Dropdown mit allen verfügbaren Tabellen
```python
# Option 1: Mit Type Hint
def meine_funktion(tabelle: Table):
    ...

# Option 2: Ohne Type Hint (Name muss "tabelle" oder "table" enthalten)
def meine_funktion(tabelle):
    ...

# Auch möglich:
def meine_funktion(input_tabelle, output_table):
    ...
```

**Primitive Typen**: Input-Felder
```python
def meine_funktion(wert: int, faktor: float, name: str, aktiv: bool):
    ...

# Ohne Type Hints werden sie als String behandelt
def meine_funktion(wert, faktor, name):
    # wert, faktor, name sind alle Strings
    ...
```

**Defaults**: Checkbox "Default nutzen"
```python
def meine_funktion(tabelle, wert: int = 10):
    # User kann wählen: eigenen Wert eingeben oder Default (10) nutzen
    ...
```

**Mehrere Tabellen**: Multi-Select (zukünftig)
```python
def meine_funktion(tabellen: List[Table]):
    ...
```

### Erlaubte Module

- `pandas` (als `pd`)
- `numpy` (als `np`)
- `math`
- `datetime`, `timedelta`

### Sicherheit

- Code wird in isoliertem Namespace ausgeführt
- Gefährliche Operationen sind blockiert (File I/O, Network, etc.)
- Timeout nach 30 Sekunden

## API Endpoints

### Prozeduren verwalten

```bash
# Neue Prozedur erstellen (Name wird aus Code extrahiert)
POST /api/procedures/
{
  "description": "Beschreibung",
  "code": "def beispiel(...):\n    ..."
}

# Alle Prozeduren auflisten
GET /api/procedures/

# Prozedur abrufen
GET /api/procedures/{name}

# Neue Version erstellen (Funktionsname muss übereinstimmen)
POST /api/procedures/{name}/versions
{
  "code": "def beispiel(...):\n    ..."
}

# Alle Versionen auflisten
GET /api/procedures/{name}/versions

# Version aktivieren
PUT /api/procedures/{name}/activate/{version}

# Parameter-Schema abrufen
GET /api/procedures/{name}/schema

# Prozedur löschen (alle Versionen)
DELETE /api/procedures/{id}
```

### Prozedur ausführen

```bash
POST /api/procedures/{name}/execute
{
  "parameters": {
    "tabelle": 5,
    "wert1": 10,
    "wert2": 2
  },
  "project_id": 1
}
```

Response:
```json
{
  "id": 1,
  "procedure_id": 1,
  "status": "success",
  "output_table_id": 42,
  "execution_time": 0.15,
  "executed_at": "2026-02-08T20:00:00"
}
```

### Execution History

```bash
GET /api/procedures/executions/?limit=50
```

## Datenbank-Schema

### Procedure
- `id`: Primary Key
- `name`: Funktionsname
- `version`: Version (1, 2, 3, ...)
- `code`: Python-Code
- `description`: Beschreibung
- `is_active`: Nur eine Version aktiv
- `created_at`: Timestamp

### ProcedureExecution
- `id`: Primary Key
- `procedure_id`: Foreign Key
- `project_id`: Foreign Key (optional)
- `input_params`: JSON mit Parametern
- `output_table_id`: Foreign Key zur Ergebnis-Tabelle
- `status`: "success" oder "error"
- `error_message`: Fehlermeldung
- `execution_time`: Dauer in Sekunden
- `executed_at`: Timestamp

## Frontend-Komponenten

### ProceduresView
Haupt-Container, verwaltet View-State

### ProcedureList
Listet alle Prozeduren mit Aktionen (Ausführen, Bearbeiten, Löschen)

### ProcedureEditor
Monaco-ähnlicher Editor für Python-Code
- Syntax-Highlighting (basic)
- Validierung beim Speichern
- Versionierung

### ProcedureExecutor
Dynamisches Formular basierend auf Parameter-Schema
- Automatische Input-Generierung
- Default-Handling
- Tabellen-Auswahl
- Ergebnis-Anzeige

## Workflow

1. **Erstellen**: User schreibt Python-Funktion im Editor
2. **Validieren**: Backend prüft Syntax und Sicherheit
3. **Speichern**: Prozedur wird in DB gespeichert (Version 1)
4. **Ausführen**: 
   - User wählt Prozedur
   - UI generiert Formular basierend auf Parametern
   - User füllt Formular aus
   - Backend lädt Tabellen, konvertiert zu DataFrames
   - Funktion wird ausgeführt
   - Ergebnis wird als neue Tabelle gespeichert
5. **Versionieren**: Bei Änderungen wird neue Version erstellt

## Zukünftige Erweiterungen

- [ ] Monaco Editor Integration für besseres Code-Editing
- [ ] Syntax-Highlighting und Auto-Complete
- [ ] Pre-Execution Validierung (z.B. "Spalte muss existieren")
- [ ] Prozedur-Templates
- [ ] Import/Export von Prozeduren
- [ ] Scheduling (automatische Ausführung)
- [ ] Prozedur-Pipelines (Verkettung)
- [ ] Projekt-spezifische vs. globale Prozeduren
- [ ] Permissions/Sharing
