# Workflow Output-Aktionen

## Übersicht

Output-Nodes definieren was mit dem Workflow-Ergebnis passiert. Das System ist modular aufgebaut und kann einfach um neue Aktionen erweitert werden.

## Verfügbare Aktionen

### 1. Als Tabelle speichern 💾 (Implementiert)

**Status:** ✅ Vollständig implementiert

**Beschreibung:** Speichert das Workflow-Ergebnis als neue Datentabelle in der Datenbank.

**Felder:**
- **Name** (required): Name der neuen Tabelle
- **Projekt** (optional): Projekt-Zuordnung

**Verwendung:**
```
[Prozedur] → [Output: Als Tabelle speichern]
              Name: "Gefilterte Kunden"
              Projekt: "Marketing"
```

**Backend-Verarbeitung:**
- Extrahiert Tabellendaten aus Prozedur-Ergebnis
- Erstellt neue `DataTable` in Datenbank
- Gibt Tabellen-ID zurück

---

### 2. Anzeigen 👁️ (Geplant)

**Status:** 🚧 Platzhalter

**Beschreibung:** Zeigt das Ergebnis direkt im UI an, ohne es zu speichern.

**Felder:**
- **Name** (required): Anzeige-Name

**Verwendung:**
```
[Prozedur] → [Output: Anzeigen]
              Name: "Vorschau"
```

**Geplante Features:**
- Live-Vorschau im Workflow-Editor
- Interaktive Tabellen-Ansicht
- Export-Optionen aus Vorschau

---

### 3. Als CSV exportieren 📄 (Geplant)

**Status:** 🚧 Platzhalter

**Beschreibung:** Exportiert das Ergebnis als CSV-Datei.

**Felder:**
- **Dateiname** (required): Name der CSV-Datei (ohne .csv)

**Verwendung:**
```
[Prozedur] → [Output: Als CSV exportieren]
              Dateiname: "export_2024"
```

**Geplante Features:**
- Automatischer Download
- Konfigurierbare Trennzeichen
- Encoding-Optionen (UTF-8, Latin1)

---

### 4. Als Excel exportieren 📊 (Geplant)

**Status:** 🚧 Platzhalter

**Beschreibung:** Exportiert das Ergebnis als Excel-Datei (.xlsx).

**Felder:**
- **Dateiname** (required): Name der Excel-Datei (ohne .xlsx)

**Verwendung:**
```
[Prozedur] → [Output: Als Excel exportieren]
              Dateiname: "report_2024"
```

**Geplante Features:**
- Mehrere Sheets
- Formatierung (Farben, Schriftarten)
- Formeln
- Diagramme

---

### 5. Als PDF exportieren 📑 (Geplant)

**Status:** 🚧 Platzhalter

**Beschreibung:** Exportiert das Ergebnis als PDF-Dokument.

**Felder:**
- **Dateiname** (required): Name der PDF-Datei (ohne .pdf)
- **Template** (optional): Vorlage für PDF-Layout

**Verwendung:**
```
[Prozedur] → [Output: Als PDF exportieren]
              Dateiname: "rechnung_2024"
              Template: "Rechnung"
```

**Geplante Features:**
- Vordefinierte Templates
- Custom Templates
- Header/Footer
- Seitennummerierung

---

## Erweiterbarkeit

### Neue Aktion hinzufügen

#### 1. Frontend: Output-Aktion definieren

In `OutputNode.jsx`:

```javascript
const OUTPUT_ACTIONS = {
  'my_new_action': {
    label: 'Meine neue Aktion',
    icon: '🎯',
    fields: ['name', 'custom_field'],
    description: 'Beschreibung der Aktion'
  }
}
```

#### 2. Frontend: Felder hinzufügen (falls nötig)

```javascript
{currentAction.fields.includes('custom_field') && (
  <div className="output-field">
    <label className="output-label">Custom Field:</label>
    <input
      type="text"
      value={customField}
      onChange={handleCustomFieldChange}
      className="node-input"
    />
  </div>
)}
```

#### 3. Backend: Aktion implementieren

In `workflows/executor.py`:

```python
def _execute_output_node(self, node_id: str, edges: List[dict]) -> dict:
    # ...
    elif action == "my_new_action":
        return self._execute_my_new_action(inputs, node_data)

def _execute_my_new_action(self, inputs: dict, node_data: dict) -> dict:
    """Implementierung der neuen Aktion"""
    # Deine Logik hier
    return {
        "action": "my_new_action",
        "data": inputs,
        "status": "success"
    }
```

---

## Beispiel-Workflows

### Beispiel 1: Daten filtern und speichern

```
[Kundendaten] → [Filter-Prozedur] → [Output: Als Tabelle speichern]
                                      Name: "Aktive Kunden"
                                      Projekt: "CRM"
```

**Ergebnis:** Neue Tabelle "Aktive Kunden" im Projekt "CRM"

---

### Beispiel 2: Report erstellen (zukünftig)

```
[Verkaufsdaten] → [Aggregation] → [Output: Als PDF exportieren]
                                   Dateiname: "sales_report_2024"
                                   Template: "Report"
```

**Ergebnis:** PDF-Datei mit formatiertem Report

---

### Beispiel 3: Mehrere Outputs

```
                    ┌→ [Output: Als Tabelle speichern]
                    │   Name: "Backup"
[Daten] → [Prozess] ┤
                    └→ [Output: Als CSV exportieren]
                        Dateiname: "export"
```

**Ergebnis:** Daten werden gespeichert UND exportiert

---

## Backend-Verarbeitung

### Save Table Action

```python
def _execute_save_table_action(self, inputs: dict, node_data: dict) -> dict:
    # 1. Extrahiere Tabellendaten
    input_data = inputs.get("input", {})
    
    # 2. Konvertiere zu Tabellenformat
    if input_data.get("type") == "procedure_result":
        table_data = input_data.get("result", {})
    
    # 3. Erstelle neue Tabelle
    new_table = DataTable(
        name=node_data.get("name"),
        project_id=node_data.get("project"),
        columns=table_data.get("columns", []),
        data=table_data.get("data", [])
    )
    
    # 4. Speichere in DB
    self.db.add(new_table)
    self.db.commit()
    
    return {
        "action": "save_table",
        "table_id": new_table.id
    }
```

### Display Action (Platzhalter)

```python
def _execute_display_action(self, inputs: dict, node_data: dict) -> dict:
    return {
        "action": "display",
        "name": node_data.get("name"),
        "data": inputs,
        "status": "not_implemented"
    }
```

---

## Datenfluss

### 1. Workflow-Ausführung

```
User → Execute Workflow
  ↓
Executor → Process Nodes
  ↓
Output Node → Execute Action
  ↓
Action Handler → Save/Export/Display
  ↓
Result → Return to User
```

### 2. Output-Node Datenstruktur

```json
{
  "id": "output-1",
  "type": "output",
  "data": {
    "action": "save_table",
    "name": "Ergebnis",
    "project": "5",
    "schema": {
      "inputs": [
        {
          "id": "input",
          "label": "Input",
          "type": "Any",
          "required": true
        }
      ],
      "outputs": []
    }
  }
}
```

### 3. Execution Result

```json
{
  "id": 123,
  "workflow_id": 1,
  "status": "completed",
  "output_data": {
    "output-1": {
      "action": "save_table",
      "table_id": 42,
      "table_name": "Ergebnis",
      "data": { ... }
    }
  },
  "execution_time": 1.23
}
```

---

## Best Practices

### 1. Aussagekräftige Namen

✅ **Gut:**
```
Name: "Gefilterte_Kunden_2024_Q1"
Dateiname: "sales_report_january_2024"
```

❌ **Schlecht:**
```
Name: "output"
Dateiname: "export"
```

### 2. Projekt-Zuordnung

Ordne Tabellen immer einem Projekt zu für bessere Organisation:
```
Output: Als Tabelle speichern
  Name: "Monatsbericht"
  Projekt: "Reporting"  ← Wichtig!
```

### 3. Mehrere Outputs für verschiedene Zwecke

```
[Daten] → [Prozess] → [Output 1: Speichern für Archiv]
                    → [Output 2: CSV für Excel-User]
                    → [Output 3: PDF für Management]
```

### 4. Validierung vor Export

```
[Daten] → [Validierung] → [Filter: Nur gültige] → [Output: Exportieren]
                        → [Filter: Fehler] → [Output: Fehler-Log]
```

---

## Zukünftige Erweiterungen

### Phase 1: Export-Funktionen
- ✅ CSV Export
- ✅ Excel Export
- ✅ PDF Export
- ⬜ JSON Export
- ⬜ XML Export

### Phase 2: Anzeige-Optionen
- ⬜ Live-Vorschau
- ⬜ Interaktive Tabelle
- ⬜ Diagramme
- ⬜ Dashboard

### Phase 3: Verteilung
- ⬜ Email versenden
- ⬜ FTP Upload
- ⬜ Cloud Storage (S3, Drive)
- ⬜ API POST

### Phase 4: Benachrichtigungen
- ⬜ Slack Notification
- ⬜ Teams Notification
- ⬜ Webhook
- ⬜ SMS

---

## Troubleshooting

### Problem: "Tabelle wird nicht erstellt"

**Ursache:** Output-Node nicht verbunden oder Name fehlt

**Lösung:**
1. Prüfe ob Input verbunden ist
2. Prüfe ob Name ausgefüllt ist
3. Schaue in Execution Log

---

### Problem: "Export-Aktion nicht verfügbar"

**Ursache:** Aktion ist noch nicht implementiert

**Lösung:** Nutze "Als Tabelle speichern" oder warte auf zukünftige Version

---

### Problem: "Projekt nicht gefunden"

**Ursache:** Projekt wurde gelöscht

**Lösung:** Wähle ein anderes Projekt oder "Kein Projekt"

---

## Zusammenfassung

Output-Aktionen definieren was mit Workflow-Ergebnissen passiert:

- ✅ **Als Tabelle speichern**: Vollständig implementiert
- 🚧 **Anzeigen, Export**: Geplant für zukünftige Versionen
- 🔧 **Erweiterbar**: Neue Aktionen einfach hinzufügbar
- 📊 **Modular**: Jede Aktion hat eigene Felder und Logik

**Nächste Schritte:**
1. Nutze "Als Tabelle speichern" für produktive Workflows
2. Plane zukünftige Export-Anforderungen
3. Erweitere System bei Bedarf mit eigenen Aktionen
