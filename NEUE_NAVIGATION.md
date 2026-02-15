# Neue Navigation & Workflow-System

## Übersicht

Das System wurde komplett umgebaut auf eine verzeichnis-basierte Navigation mit Workflow-Instanzen für zyklus-spezifische Konfigurationen.

## Navigation

### Sidebar (Datei-Explorer-Stil)

**Funktionsweise:**
- Zeigt nur die aktuelle Ebene
- Zurück-Button um eine Ebene hochzugehen
- Aktuelle Position wird angezeigt
- Keine doppelten Menüpunkte mehr

**Ebenen:**

1. **Root-Ebene**
   ```
   📁 Global
   📁 Testprojekt
   📁 Projekt A
   ```

2. **Projekt-Ebene**
   ```
   ⚙️ Prozeduren
   🔄 Workflows
   📊 Datentabellen
   💎 Globale Werte (nur bei Global)
   📅 Jahr_2024
   📅 Jahr_2025
   ➕ Nächster Zyklus
   ```

3. **Zyklus-Ebene**
   ```
   📁 Input
   📁 Konfiguration
   📁 Output
   ```

4. **Unterordner-Ebene**
   ```
   📊 Datentabellen
   ▶️ Workflow-Ausführungen
   ```

### Breadcrumb

Zeigt den kompletten Pfad:
```
🏠 Home / 📂 Testprojekt / 📅 Jahr_2024 / 📁 Input
```

- Klickbar für direkten Sprung
- Immer sichtbar wenn in Projekt/Zyklus

## Projekt-Struktur

### Standard-Subfolders

Beim Erstellen eines Zyklus werden automatisch erstellt:
- **Input**: Eingangsdaten für diesen Zeitraum
- **Konfiguration**: Workflow-Parameter und Einstellungen
- **Output**: Ergebnisse der Verarbeitung

Diese sind konfigurierbar in `cycle_config.subfolders`.

### Beispiel-Struktur

```
Global/
├─ Globale Werte
├─ Prozeduren (wiederverwendbar)
├─ Workflows (Templates)
└─ Datentabellen (Referenzdaten)

Testprojekt/
├─ Prozeduren (projekt-spezifisch)
├─ Workflows (Workflow-Definitionen)
├─ Datentabellen (Stammdaten)
│
└─ Jahr_2024/
    ├─ Input/
    │   └─ Datentabellen (für diesen Lauf)
    ├─ Konfiguration/
    │   └─ Workflow-Instanzen (Parameter)
    └─ Output/
        └─ Datentabellen (Ergebnisse)
```

## Workflow-System

### Konzept: 2-Ebenen-System

**Ebene 1: Workflow-Definition (Projekt-Level)**
- Definiert die Logik (welche Prozeduren, wie verbunden)
- Wiederverwendbar für alle Zyklen
- Wird einmal erstellt, mehrfach ausgeführt

**Ebene 2: Workflow-Instanz (Zyklus-Level)**
- Verknüpft Workflow mit Zyklus
- Speichert zyklus-spezifische Parameter
- Speichert Input-Mapping (welche Tabellen)
- Wird automatisch beim ersten Ausführen erstellt

### Workflow-Ausführung

1. **Workflow auswählen** (aus Projekt-Ebene)
2. **Ausführen-Dialog öffnet sich**
   - Input-Daten auswählen (aus verfügbaren Tabellen)
   - Parameter setzen (optional)
   - Konfiguration wird gespeichert (bei Zyklus)
3. **Workflow wird ausgeführt**
   - Mit gewählten Inputs und Parametern
   - Output wird im Zyklus gespeichert
4. **Nächstes Mal**: Gespeicherte Konfiguration wird vorgeschlagen

### Workflow-Instanzen

**Datenbank-Tabelle: `workflow_instances`**
```sql
CREATE TABLE workflow_instances (
    id SERIAL PRIMARY KEY,
    workflow_id INTEGER REFERENCES workflows(id),
    cycle_id INTEGER REFERENCES project_cycles(id),
    parameters JSON,           -- {"schwellwert": 1000, "faktor": 1.2}
    input_mapping JSON,        -- {"tabelle_a": 5, "tabelle_b": 7}
    is_active BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(workflow_id, cycle_id)
)
```

**API-Endpunkte:**
```
GET    /api/workflows/{id}/instances              # Alle Instanzen eines Workflows
POST   /api/workflows/{id}/instances              # Neue Instanz erstellen
PUT    /api/workflows/instances/{id}              # Instanz aktualisieren
GET    /api/workflows/instances/by-cycle/{id}    # Instanzen eines Zyklus
```

## Verwendung

### Typischer Workflow

1. **Projekt erstellen**
   - Home → "Neues Projekt"
   - Name, Beschreibung, Zyklustyp

2. **Workflow definieren** (Projekt-Ebene)
   - Sidebar: Workflows
   - Neuer Workflow erstellen
   - Prozeduren verbinden

3. **Zyklus erstellen**
   - Sidebar: "Nächster Zyklus"
   - Automatisch mit Subfolders

4. **Input-Daten vorbereiten**
   - Zyklus → Input → Datentabellen
   - Excel hochladen oder Tabelle erstellen

5. **Workflow ausführen**
   - Zyklus → Workflows (oder Projekt → Workflows)
   - Workflow auswählen → Ausführen
   - Input-Daten wählen
   - Parameter setzen
   - Ausführen

6. **Output prüfen**
   - Zyklus → Output → Datentabellen
   - Ergebnisse ansehen

### Sonderanforderungen

**Option 1: Workflow-Variante**
```
Projekt/Workflows:
├─ Jahresabschluss (Standard)
└─ Jahresabschluss_Sonderfall (Variante)
```

**Option 2: Parameter-basiert**
```json
{
  "sonderfall": true,
  "spezial_faktor": 1.5
}
```

## Migration

### Bestehende Daten

- Alle bestehenden Workflows sind auf Projekt-Ebene
- Keine Workflow-Instanzen vorhanden
- Beim ersten Ausführen in einem Zyklus wird Instanz erstellt

### Neue Projekte

- Standard-Subfolders: `["Input", "Konfiguration", "Output"]`
- Konfigurierbar in Projekt-Einstellungen
- Automatisch beim Zyklus-Erstellen angelegt

## Vorteile

1. **Klarere Struktur**
   - Verzeichnis-basiert, wie Datei-Explorer
   - Keine Verwirrung durch doppelte Menüpunkte

2. **Workflow-Wiederverwendung**
   - Einmal definieren, mehrfach ausführen
   - Verschiedene Parameter pro Zyklus

3. **Gespeicherte Konfigurationen**
   - Workflow-Instanzen merken sich Einstellungen
   - Schnelleres Ausführen beim nächsten Mal

4. **Flexible Unterstruktur**
   - Subfolders konfigurierbar
   - Anpassbar an verschiedene Prozesse

5. **Bessere Navigation**
   - Fokussiert auf aktuelle Ebene
   - Weniger Ablenkung
   - Schneller Zugriff

## Nächste Schritte

Mögliche Erweiterungen:
- Workflow-Templates (aus Instanz erstellen)
- Batch-Ausführung (mehrere Zyklen)
- Workflow-Scheduling
- Output-Vergleich zwischen Zyklen
- Workflow-Versionierung
