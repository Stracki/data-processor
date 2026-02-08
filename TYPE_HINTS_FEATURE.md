# Type Hints Feature - Automatische Ergänzung

## Übersicht

Das System ergänzt automatisch fehlende Type Hints in Prozeduren-Code. User können Code ohne Type Hints schreiben und werden beim Speichern nach den Typen gefragt.

## Workflow

### 1. User schreibt Code ohne Type Hints

```python
def beispiel(tabelle, wert1, wert2=2):
    tabelle['neue_spalte'] = tabelle['alte_spalte'] * wert1 + wert2
    return tabelle
```

### 2. User klickt "Speichern"

Backend validiert Code und erkennt:
- `tabelle` → kein Type Hint
- `wert1` → kein Type Hint  
- `wert2` → kein Type Hint

### 3. Frontend zeigt Type-Selection Modal

```
Parameter-Typen festlegen
─────────────────────────────────────
tabelle          [Dropdown: Table ▼]
wert1            [Dropdown: int ▼]
wert2 (Default: 2)  [Dropdown: int ▼]

[Abbrechen]  [Typen hinzufügen und speichern]
```

### 4. Backend fügt Type Hints hinzu

Code wird automatisch ergänzt (außer "Table" - das ist kein Python-Typ):

```python
def beispiel(tabelle, wert1: int, wert2: int = 2):
    # Table parameters: tabelle
    tabelle['neue_spalte'] = tabelle['alte_spalte'] * wert1 + wert2
    return tabelle
```

**Wichtig:** "Table" wird als Kommentar hinzugefügt, nicht als Type Hint, da es kein Python-Typ ist. Die Type-Information wird in der Datenbank gespeichert.

### 5. Code wird mit Type Hints gespeichert

Beim nächsten Bearbeiten sind die Type Hints bereits vorhanden!

## Verfügbare Typen

- **Table**: Datentabelle (wird als Dropdown angezeigt)
- **int**: Ganzzahl
- **float**: Dezimalzahl
- **str**: Text
- **bool**: Ja/Nein

## Technische Details

### Backend

**parser.py:**
- `add_type_hints_to_code(code, parameter_types)`: Fügt Type Hints zum AST hinzu
- Verwendet `ast.unparse()` um modifizierten Code zu generieren

**API Endpoint:**
```
POST /api/procedures/validate
{
  "code": "def test(tabelle, wert): ..."
}

Response:
{
  "function_name": "test",
  "parameters": {
    "tabelle": {"type": "Any", "required": true, "default": null},
    "wert": {"type": "Any", "required": true, "default": null}
  },
  "missing_types": ["tabelle", "wert"]
}
```

**Speichern:**
```
POST /api/procedures/
{
  "code": "def test(tabelle, wert): ...",
  "parameter_types": {
    "tabelle": "Table",
    "wert": "int"
  }
}
```

Backend fügt Type Hints hinzu und speichert:
```python
def test(tabelle: Table, wert: int):
    ...
```

### Frontend

**TypeSelectionModal.jsx:**
- Zeigt Parameter ohne Type Hints
- Dropdown für jeden Parameter
- Validiert dass alle Typen ausgewählt wurden

**ProcedureEditor.jsx:**
- Ruft `/validate` Endpoint auf
- Zeigt Modal wenn `missing_types` vorhanden
- Sendet `parameter_types` beim Speichern

### Datenbank

**Procedure Model:**
```python
parameter_types = Column(JSON, nullable=True)
# Format: {"param_name": "Table", "wert1": "int"}
```

Wird gespeichert für Referenz, aber Code enthält bereits die Type Hints.

## Vorteile

1. **User-Friendly**: Kein Zwang Type Hints zu schreiben
2. **Konsistenz**: Code wird automatisch standardisiert
3. **Kein Re-Fragen**: Type Hints bleiben im Code
4. **Flexibilität**: User kann auch manuell Type Hints schreiben

## Edge Cases

### User hat bereits Type Hints

```python
def test(tabelle, wert: int):  # tabelle ohne Type Hint
    ...
```

→ Kein Modal, "Table" wird aus DB gelesen (wenn gespeichert)

### Gemischt (einige mit, einige ohne)

```python
def test(tabelle, wert):
    ...
```

→ Modal für beide Parameter
→ Gespeichert wird:
```python
def test(tabelle, wert: int):
    # Table parameters: tabelle
    ...
```

### User ändert Code später

```python
# Gespeichert:
def test(tabelle: Table, wert: int):
    ...

# User ändert zu:
def test(tabelle: Table, wert: int, neu):
    ...
```

→ Modal nur für `neu`

## Migration

**Neue Spalte in DB:**
```sql
ALTER TABLE procedures ADD COLUMN parameter_types JSON;
```

Wird automatisch durch `Base.metadata.create_all()` erstellt.

**Bestehende Prozeduren:**
- Haben `parameter_types = NULL`
- Funktionieren weiterhin
- Beim Bearbeiten werden Types aus Code gelesen

## Testing

### Manuell

1. Erstelle Prozedur ohne Type Hints:
```python
def test(tabelle, wert):
    return tabelle
```

2. Klicke "Speichern"
3. Modal erscheint
4. Wähle Types: tabelle=Table, wert=int
5. Klicke "Typen hinzufügen und speichern"
6. Prozedur wird gespeichert
7. Bearbeite Prozedur → Code hat jetzt Type Hints!

### API

```bash
# Validieren
curl -X POST http://localhost:8000/api/procedures/validate \
  -H "Content-Type: application/json" \
  -d '{"code": "def test(tabelle, wert):\n    return tabelle"}'

# Speichern mit Types
curl -X POST http://localhost:8000/api/procedures/ \
  -H "Content-Type: application/json" \
  -d '{
    "code": "def test(tabelle, wert):\n    return tabelle",
    "parameter_types": {"tabelle": "Table", "wert": "int"}
  }'
```

## Zukünftige Erweiterungen

- [ ] Type Inference (automatisch erraten basierend auf Usage)
- [ ] Custom Types (z.B. `List[Table]`)
- [ ] Type Validation (prüfen ob Type sinnvoll ist)
- [ ] Type Hints für Return-Type
- [ ] Docstring-Generierung basierend auf Types
