# Workflow-System

## Übersicht

Das Workflow-System ermöglicht es, Datentabellen, Prozeduren und zukünftig auch API-Calls grafisch zu verbinden und als automatisierte Workflows auszuführen.

## Features

### ✅ Implementiert

- **Grafische Workflow-Erstellung** mit React Flow
- **Node-Typen:**
  - 📊 **Tabelle**: Lädt eine Datentabelle
  - ⚙️ **Prozedur**: Führt eine Prozedur aus
  - 🔢 **Wert**: Statischer Wert (String, Number, Boolean, JSON)
  - 📤 **Output**: Definiert Workflow-Ausgaben
  - 🌐 **API Call**: Platzhalter für zukünftige API-Integration

- **Workflow-Verwaltung:**
  - Workflows erstellen, bearbeiten, löschen
  - Workflows ausführen
  - Projekt-Zuordnung
  - Aktiv/Inaktiv Status

- **Workflow-Executor:**
  - Topologische Sortierung für korrekte Ausführungsreihenfolge
  - Zykluserkennung
  - Execution Logging
  - Fehlerbehandlung

### 🚧 Geplant für zukünftige Versionen

- **API-Integration:**
  - REST API Calls
  - GraphQL Queries
  - SOAP Requests
  - Webhooks
  
- **Erweiterte Features:**
  - Bedingte Verzweigungen (If/Else)
  - Schleifen (For Each)
  - Parallele Ausführung
  - Workflow-Templates
  - Versionierung
  - Scheduling (Zeitgesteuerte Ausführung)

## Architektur

### Backend

```
backend/
├── models.py              # Workflow & WorkflowExecution Models
├── schemas.py             # Workflow Schemas
├── routers/
│   └── workflows.py       # Workflow API Endpoints
└── workflows/
    ├── __init__.py
    └── executor.py        # Workflow Execution Engine
```

### Frontend

```
frontend/src/
├── components/
│   └── workflows/
│       ├── WorkflowEditor.jsx       # Haupteditor mit React Flow
│       ├── WorkflowEditor.css
│       ├── WorkflowsView.jsx        # Workflow-Übersicht
│       ├── WorkflowsView.css
│       └── nodes/
│           ├── TableNode.jsx        # Tabellen-Node
│           ├── ProcedureNode.jsx    # Prozedur-Node
│           ├── ValueNode.jsx        # Wert-Node
│           ├── ApiNode.jsx          # API-Node (Platzhalter)
│           ├── OutputNode.jsx       # Output-Node
│           └── NodeStyles.css
└── pages/
    └── WorkflowEditPage.jsx         # Editor-Seite
```

## API Endpoints

### Workflows

- `GET /api/workflows` - Alle Workflows abrufen (optional: ?project_id=X)
- `GET /api/workflows/{id}` - Einzelnen Workflow abrufen
- `POST /api/workflows` - Neuen Workflow erstellen
- `PUT /api/workflows/{id}` - Workflow aktualisieren
- `DELETE /api/workflows/{id}` - Workflow löschen
- `POST /api/workflows/{id}/execute` - Workflow ausführen
- `GET /api/workflows/{id}/executions` - Ausführungshistorie abrufen

## Verwendung

### 1. Workflow erstellen

1. Navigiere zu "Workflows" in der Sidebar
2. Klicke auf "+ Neuer Workflow"
3. Gib einen Namen und Beschreibung ein
4. Füge Nodes hinzu über "+ Node hinzufügen"
5. Verbinde Nodes durch Ziehen von einem Output-Handle zu einem Input-Handle
6. Konfiguriere jeden Node (Tabelle auswählen, Prozedur wählen, etc.)
7. Klicke auf "Speichern"

### 2. Workflow ausführen

1. Gehe zur Workflow-Übersicht
2. Klicke auf "Ausführen" bei einem aktiven Workflow
3. Der Workflow wird ausgeführt und das Ergebnis angezeigt

### 3. Node-Typen konfigurieren

#### Tabellen-Node
- Wähle eine existierende Datentabelle aus
- Output: Komplette Tabelle mit Daten

#### Prozedur-Node
- Wähle eine Prozedur aus
- Verbinde Input-Parameter mit anderen Nodes
- Output: Ergebnis der Prozedur

#### Wert-Node
- Wähle Datentyp (String, Number, Boolean, JSON)
- Gib einen Wert ein
- Output: Der eingegebene Wert

#### Output-Node
- Definiere einen Namen für den Output
- Sammelt Daten von verbundenen Nodes
- Wird im Workflow-Ergebnis zurückgegeben

#### API-Node (Platzhalter)
- Wähle API-Typ (REST, GraphQL, SOAP, Webhook)
- Konfiguriere Endpoint und Methode
- Wird in zukünftiger Version implementiert

## Workflow-Graph-Format

```json
{
  "nodes": [
    {
      "id": "table-1",
      "type": "table",
      "position": {"x": 100, "y": 100},
      "data": {
        "label": "Kundendaten",
        "tableId": 5
      }
    },
    {
      "id": "procedure-1",
      "type": "procedure",
      "position": {"x": 400, "y": 100},
      "data": {
        "label": "Berechnung",
        "procedureId": 3,
        "parameterMapping": {
          "tabelle": "table-1"
        }
      }
    }
  ],
  "edges": [
    {
      "id": "e1",
      "source": "table-1",
      "target": "procedure-1",
      "sourceHandle": "output",
      "targetHandle": "tabelle"
    }
  ]
}
```

## Erweiterbarkeit

Das System ist so konzipiert, dass neue Node-Typen einfach hinzugefügt werden können:

### Neuen Node-Typ hinzufügen

1. **Backend**: Erweitere `WorkflowExecutor._execute_node()` in `workflows/executor.py`
2. **Frontend**: Erstelle neue Node-Komponente in `components/workflows/nodes/`
3. **Registrierung**: Füge Node-Typ zu `nodeTypes` in `WorkflowEditor.jsx` hinzu
4. **UI**: Füge Button zur Node-Palette hinzu

### Beispiel: Datenbank-Query Node

```python
# Backend
def _execute_database_node(self, data: dict, node_id: str, edges: List[dict]) -> dict:
    query = data.get("query")
    params = self._collect_node_inputs(node_id, edges, {})
    result = self.db.execute(query, params)
    return {"type": "query_result", "data": result}
```

```jsx
// Frontend
export default function DatabaseNode({ data, id }) {
  return (
    <div className="custom-node database-node">
      <div className="node-header">
        <span className="node-icon">🗄️</span>
        <span className="node-title">Datenbank Query</span>
      </div>
      <div className="node-content">
        <textarea placeholder="SQL Query..." />
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
```

## Installation

### Backend Dependencies

Bereits in `requirements.txt` enthalten (FastAPI, SQLAlchemy, etc.)

### Frontend Dependencies

```bash
cd frontend
npm install
```

Die Dependency `reactflow` wurde bereits zu `package.json` hinzugefügt.

## Datenbank-Migration

Nach dem Hinzufügen der neuen Models:

```bash
# Backend neu starten - SQLAlchemy erstellt automatisch die neuen Tabellen
cd backend
python main.py
```

## Beispiel-Workflow

### Szenario: Datenverarbeitung mit Prozedur

1. **Tabellen-Node**: Lädt "Verkaufsdaten"
2. **Wert-Node**: Schwellenwert = 1000
3. **Prozedur-Node**: Filtert Verkäufe > Schwellenwert
4. **Output-Node**: Speichert gefilterte Daten

```
[Verkaufsdaten] ──→ [Filter-Prozedur] ──→ [Output]
                           ↑
                    [Schwellenwert]
```

## Troubleshooting

### Workflow wird nicht ausgeführt
- Prüfe ob Workflow auf "Aktiv" gesetzt ist
- Überprüfe ob alle Nodes korrekt konfiguriert sind
- Schaue in die Execution Logs für Details

### Nodes können nicht verbunden werden
- Stelle sicher, dass Source und Target kompatibel sind
- Prüfe ob keine Zyklen entstehen

### API-Node funktioniert nicht
- API-Nodes sind aktuell Platzhalter
- Implementierung folgt in zukünftiger Version

## Nächste Schritte

1. **API-Integration implementieren**
   - REST Client hinzufügen
   - Authentication-Mechanismen
   - Response-Parsing

2. **Erweiterte Kontrollstrukturen**
   - If/Else Nodes
   - Loop Nodes
   - Switch/Case Nodes

3. **Workflow-Monitoring**
   - Live-Ausführungsanzeige
   - Performance-Metriken
   - Fehler-Benachrichtigungen

4. **Workflow-Templates**
   - Vordefinierte Workflows
   - Import/Export
   - Workflow-Bibliothek
