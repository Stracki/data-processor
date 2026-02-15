# Workflow Handle-System - Dokumentation

## Übersicht

Das Handle-System ermöglicht typsichere Verbindungen zwischen Workflow-Nodes. Es validiert automatisch, ob Verbindungen erlaubt sind und zeigt Fehler an.

## Features

### ✅ Implementiert

- **Typ-Kompatibilitätsprüfung**: Nur kompatible Typen können verbunden werden
- **Required-Parameter-Validierung**: Pflichtparameter müssen verbunden sein
- **Default-Parameter-Unterstützung**: Parameter mit Defaults sind optional
- **Zykluserkennung**: Verhindert Endlosschleifen
- **Visuelles Feedback**: Farbcodierung für Required/Optional
- **Fehler-Anzeige**: Toast-Nachrichten und Validierungs-Panel

## Typ-Kompatibilität

### Kompatibilitäts-Matrix

| Source-Typ | Kann verbunden werden mit |
|------------|---------------------------|
| `Table` | `Table`, `Any` |
| `int` | `int`, `float`, `Any` |
| `float` | `int`, `float`, `Any` |
| `str` | `str`, `Any` |
| `bool` | `bool`, `Any` |
| `List[Table]` | `List[Table]`, `Table`, `Any` |
| `Any` | Alle Typen |

### Beispiele

✅ **Erlaubt:**
- Table → Procedure(param: Table)
- Value(int) → Procedure(param: float)
- Value(str) → Procedure(param: Any)

❌ **Nicht erlaubt:**
- Table → Procedure(param: int)
- Value(str) → Procedure(param: int)
- Value(bool) → Procedure(param: Table)

## Node-Schemas

Jeder Node-Typ hat ein Schema, das seine Inputs und Outputs definiert:

### Table Node

```javascript
{
  inputs: [],
  outputs: [
    { id: 'output', label: 'Table Name', type: 'Table' }
  ]
}
```

**Eigenschaften:**
- Keine Inputs
- Ein Output vom Typ `Table`
- Kann nur an Prozedur-Parameter vom Typ `Table` angedockt werden

---

### Procedure Node

```javascript
{
  inputs: [
    { 
      id: 'tabelle', 
      label: 'tabelle', 
      type: 'Table', 
      required: true, 
      default: null 
    },
    { 
      id: 'wert', 
      label: 'wert', 
      type: 'int', 
      required: false, 
      default: 10 
    }
  ],
  outputs: [
    { id: 'output', label: 'Result', type: 'Table' }
  ]
}
```

**Eigenschaften:**
- Dynamische Inputs basierend auf Prozedur-Parametern
- Parameter mit `required: true` und `default: null` müssen verbunden sein (rot)
- Parameter mit `default` sind optional (grün)
- Ein Output vom Typ `Table`

**Beispiel-Prozedur:**
```python
def berechne(tabelle: Table, wert: int = 10) -> Table:
    # tabelle ist required (kein Default)
    # wert ist optional (hat Default)
    return tabelle
```

---

### Value Node

```javascript
{
  inputs: [],
  outputs: [
    { id: 'output', label: 'Value', type: 'str' } // oder int, float, bool, Any
  ]
}
```

**Eigenschaften:**
- Keine Inputs
- Output-Typ abhängig von gewähltem Wert-Typ
- Typ-Mapping:
  - `string` → `str`
  - `number` → `float`
  - `boolean` → `bool`
  - `json` → `Any`

---

### Output Node

```javascript
{
  inputs: [
    { id: 'input', label: 'Input', type: 'Any', required: true, default: null }
  ],
  outputs: []
}
```

**Eigenschaften:**
- Ein Required Input (akzeptiert alle Typen)
- Keine Outputs
- Muss verbunden sein für gültigen Workflow

---

### API Node

```javascript
{
  inputs: [
    { id: 'params', label: 'Parameters', type: 'Any', required: false, default: {} }
  ],
  outputs: [
    { id: 'output', label: 'Response', type: 'Any' }
  ]
}
```

**Eigenschaften:**
- Optionaler Input für Parameter
- Output vom Typ `Any`
- Aktuell Platzhalter

## Visuelles Feedback

### Handle-Farben

- 🔴 **Rot**: Required Parameter ohne Default (muss verbunden werden)
- 🟢 **Grün**: Optional oder mit Default
- 🔵 **Blau**: Table-Output
- 🟠 **Orange**: Value-Output
- 🟣 **Lila**: API-Handles

### Verbindungs-Feedback

- **Grün beim Hovern**: Verbindung ist erlaubt
- **Rot beim Hovern**: Verbindung nicht erlaubt
- **Toast-Nachricht**: Zeigt Fehlergrund bei ungültiger Verbindung

### Validierungs-Panel

Zeigt alle Fehler im Workflow:
- Required Inputs ohne Verbindung
- Zyklen im Graph
- Position: Oben rechts im Editor

## Validierungsregeln

### 1. Typ-Kompatibilität

```javascript
// Prüfung ob Source-Typ mit Target-Typ kompatibel ist
areTypesCompatible(sourceType, targetType)
```

**Beispiel:**
```javascript
areTypesCompatible('Table', 'Table')  // ✅ true
areTypesCompatible('int', 'float')    // ✅ true
areTypesCompatible('str', 'int')      // ❌ false
```

### 2. Required Parameters

```javascript
// Prüfung ob alle Required Inputs verbunden sind
for (const input of schema.inputs) {
  if (input.required && input.default === null) {
    // Muss verbunden sein
  }
}
```

**Beispiel:**
```python
def process(data: Table, threshold: int = 100):
    # data ist required (kein Default) → muss verbunden sein
    # threshold ist optional (hat Default) → kann verbunden sein
```

### 3. Keine Duplikate

Ein Input-Handle kann nur **eine** Verbindung haben.

**Beispiel:**
```
❌ Nicht erlaubt:
Table A ──┐
          ├→ Procedure(param)
Table B ──┘

✅ Erlaubt:
Table A ──→ Procedure(param1)
Table B ──→ Procedure(param2)
```

### 4. Keine Selbst-Verbindungen

Ein Node kann nicht mit sich selbst verbunden werden.

### 5. Keine Zyklen

Der Graph darf keine Zyklen enthalten.

**Beispiel:**
```
❌ Nicht erlaubt:
A → B → C → A

✅ Erlaubt:
A → B → C → D
```

## API-Endpoints

### Node-Schema abrufen

```http
GET /api/workflows/node-schema/{node_type}/{node_id}
```

**Parameter:**
- `node_type`: `table`, `procedure`, `value`, `output`, `api`
- `node_id`: ID des Nodes (für table/procedure)

**Response:**
```json
{
  "inputs": [
    {
      "id": "param_name",
      "label": "Parameter Name",
      "type": "Table",
      "required": true,
      "default": null
    }
  ],
  "outputs": [
    {
      "id": "output",
      "label": "Result",
      "type": "Table"
    }
  ]
}
```

## Erweiterbarkeit

### Neuen Typ hinzufügen

1. **Typ-Kompatibilität erweitern** (`handleValidation.js`):
```javascript
const TYPE_COMPATIBILITY = {
  'MyNewType': ['MyNewType', 'Any'],
  // ...
}
```

2. **Node-Schema definieren**:
```javascript
data.schema = {
  inputs: [...],
  outputs: [{ id: 'output', label: 'My Output', type: 'MyNewType' }]
}
```

3. **Backend-Endpoint erweitern** (optional):
```python
elif node_type == "my_new_type":
    return {
        "inputs": [...],
        "outputs": [...]
    }
```

### Neue Validierungsregel hinzufügen

In `handleValidation.js`:

```javascript
export function validateWorkflow(nodes, edges) {
  const errors = []
  
  // Bestehende Validierungen...
  
  // Neue Regel hinzufügen
  for (const node of nodes) {
    if (myCustomValidation(node)) {
      errors.push({
        nodeId: node.id,
        message: 'Custom validation failed'
      })
    }
  }
  
  return errors
}
```

## Beispiel-Workflows

### Beispiel 1: Einfache Datenverarbeitung

```
[Kundendaten: Table] ──→ [Filter: procedure(tabelle: Table)] ──→ [Output]
```

**Validierung:**
- ✅ Table → Table (kompatibel)
- ✅ Required Parameter verbunden
- ✅ Keine Zyklen

---

### Beispiel 2: Mit optionalem Parameter

```
[Verkäufe: Table] ──→ [Berechnung: procedure(data: Table, rate: float = 1.19)]
                                                                    ↑
                                                    [Wert: 1.25] ───┘
```

**Validierung:**
- ✅ Table → Table (kompatibel)
- ✅ float → float (kompatibel)
- ✅ Required Parameter (data) verbunden
- ✅ Optional Parameter (rate) kann, muss aber nicht verbunden sein

---

### Beispiel 3: Mehrere Inputs

```
[Tabelle A: Table] ──→ [Merge: procedure(left: Table, right: Table)] ──→ [Output]
                                                ↑
                        [Tabelle B: Table] ─────┘
```

**Validierung:**
- ✅ Beide Required Parameter verbunden
- ✅ Typ-Kompatibilität gegeben

---

### Beispiel 4: Ungültige Verbindung

```
[Wert: str] ──X──→ [Process: procedure(count: int)]
```

**Fehler:**
- ❌ Type mismatch: str cannot connect to int
- 🔴 Toast-Nachricht wird angezeigt
- ⚠️ Verbindung wird nicht erstellt

## Troubleshooting

### Problem: "This input is already connected"

**Ursache:** Ein Input-Handle kann nur eine Verbindung haben.

**Lösung:** Entferne die bestehende Verbindung zuerst.

---

### Problem: "Type mismatch: X cannot connect to Y"

**Ursache:** Die Typen sind nicht kompatibel.

**Lösung:** 
- Verwende einen Value-Node mit passendem Typ
- Oder verwende einen Node der `Any` akzeptiert

---

### Problem: "Required input is not connected"

**Ursache:** Ein Pflichtparameter ohne Default ist nicht verbunden.

**Lösung:** Verbinde einen passenden Node mit dem Input.

---

### Problem: "Workflow contains cycles"

**Ursache:** Der Graph enthält eine Schleife.

**Lösung:** Entferne die Verbindung die den Zyklus schließt.

---

### Problem: Handle ist nicht sichtbar

**Ursache:** Node wurde noch nicht konfiguriert (z.B. Prozedur nicht gewählt).

**Lösung:** Wähle zuerst die Prozedur/Tabelle aus dem Dropdown.

## Best Practices

### 1. Prozeduren mit Type Hints schreiben

✅ **Gut:**
```python
def process(data: Table, threshold: int = 100) -> Table:
    return data
```

❌ **Schlecht:**
```python
def process(data, threshold=100):  # Keine Type Hints
    return data
```

### 2. Sinnvolle Defaults setzen

✅ **Gut:**
```python
def calculate(data: Table, tax_rate: float = 1.19) -> Table:
    # tax_rate ist optional mit sinnvollem Default
```

❌ **Schlecht:**
```python
def calculate(data: Table, tax_rate: float) -> Table:
    # tax_rate ist required, könnte optional sein
```

### 3. Workflow vor Ausführung validieren

Der Editor zeigt Validierungsfehler automatisch an. Behebe diese vor der Ausführung.

### 4. Typ-Hierarchie nutzen

Nutze `Any` für flexible Parameter:
```python
def log(message: Any) -> Table:
    # Akzeptiert alle Typen
```

## Zusammenfassung

Das Handle-System bietet:
- ✅ Typsichere Verbindungen
- ✅ Automatische Validierung
- ✅ Visuelles Feedback
- ✅ Erweiterbare Architektur
- ✅ Required/Optional Parameter-Unterstützung
- ✅ Zykluserkennung

**Nächste Schritte:**
1. Prozeduren mit Type Hints schreiben
2. Workflows erstellen und testen
3. Bei Bedarf neue Typen hinzufügen
