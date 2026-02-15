# Projekt-System Dokumentation

## Übersicht

Das neue Projekt-System bildet die oberste Hierarchie-Ebene der Anwendung. Alle Ressourcen (Prozeduren, Workflows, Datentabellen) sind einem Projekt zugeordnet.

## Konzepte

### 1. Projekte

Projekte sind Container für alle Ressourcen und können Zyklen enthalten.

**Typen:**
- **Global-Projekt**: Spezial-Projekt für globale Ressourcen, die in allen anderen Projekten verfügbar sind
- **Standard-Projekte**: Normale Projekte mit eigenen Ressourcen und Zyklen

### 2. Zyklen (Cycles)

Zyklen sind zeitbasierte oder logische Unterteilungen innerhalb eines Projekts.

**Konfiguration:**
```json
{
  "cycleType": "yearly",           // yearly, quarterly, monthly
  "cyclePattern": "Jahr_{year}",   // Template mit Variablen
  "subfolders": [                  // Auto-erstellte Unterordner
    "01_Eingangsdaten",
    "02_Verarbeitung",
    "03_Ausgabe",
    "04_Archiv"
  ],
  "autoCreateSubfolders": true
}
```

**Nächster Zyklus:**
- Button "Nächster Zyklus" erstellt automatisch den nächsten Zyklus
- Inkrementiert die Variable im Pattern (z.B. Jahr_2024 → Jahr_2025)
- Erstellt automatisch die konfigurierten Unterordner

### 3. Scope-Hierarchie

Ressourcen (Prozeduren, Workflows) haben einen Scope:

```
Global (scope='global')
  ↓ immer verfügbar
Project (scope='project')
  ↓ nur im Projekt
Cycle (scope='cycle')
  ↓ nur im Zyklus
```

**Auflösungsreihenfolge:**
1. Cycle (höchste Priorität)
2. Project
3. Global (immer verfügbar)

### 4. Globale Werte

Globale Werte sind Key-Value-Paare, die überall verfügbar sind.

**Verwendung:**
```python
# In Prozeduren
result = betrag * global.MWST_SATZ

# In Workflows
{
  "value": "{{global.MWST_SATZ}}"
}
```

**Eigenschaften:**
- Immer verfügbar, kein Import nötig
- Read-only in anderen Projekten
- Können kategorisiert werden
- Unterstützen verschiedene Datentypen (string, number, boolean, object)

## Datenbankstruktur

### Neue/Erweiterte Tabellen

**projects:**
- `is_global`: Boolean - Markiert Global-Projekt
- `cycle_config`: JSON - Zyklen-Konfiguration
- `metadata`: JSON - Projekt-Metadaten (Kontakte, Adressen, Custom Fields)

**project_cycles:**
- `project_id`: FK zu projects
- `name`: String - Zyklus-Name (z.B. "Jahr_2024")
- `path`: String - Virtueller Pfad
- `metadata`: JSON - Zyklus-Metadaten

**procedures:**
- `scope`: String - 'global', 'project', 'cycle'
- `project_id`: FK zu projects (nullable)
- `cycle_id`: FK zu project_cycles (nullable)
- `copied_from_id`: FK zu procedures (nullable) - Referenz zum Original

**workflows:**
- `scope`: String - 'global', 'project', 'cycle'
- `project_id`: FK zu projects (nullable)
- `cycle_id`: FK zu project_cycles (nullable)
- `copied_from_id`: FK zu workflows (nullable)

**global_values:** (neu)
- `key`: String - Eindeutiger Key (z.B. "MWST_SATZ")
- `value`: JSON - Der Wert
- `value_type`: String - 'string', 'number', 'boolean', 'object'
- `category`: String - Kategorie (optional)
- `description`: String - Beschreibung

## API-Endpunkte

### Projekte

```
GET    /api/projects/                    # Alle Projekte
GET    /api/projects/{id}                # Einzelnes Projekt
POST   /api/projects/                    # Neues Projekt
PUT    /api/projects/{id}                # Projekt aktualisieren
DELETE /api/projects/{id}                # Projekt löschen
```

### Zyklen

```
GET    /api/projects/{id}/cycles         # Alle Zyklen eines Projekts
POST   /api/projects/{id}/cycles         # Nächsten Zyklus erstellen
DELETE /api/projects/{id}/cycles/{cycle_id}  # Zyklus löschen
```

### Globale Werte

```
GET    /api/global-values/               # Alle globalen Werte
GET    /api/global-values/categories     # Alle Kategorien
GET    /api/global-values/{key}          # Einzelner Wert
POST   /api/global-values/               # Neuer Wert
PUT    /api/global-values/{key}          # Wert aktualisieren
DELETE /api/global-values/{key}          # Wert löschen
```

### Prozeduren (erweitert)

```
POST   /api/procedures/{id}/copy         # Prozedur in anderen Scope kopieren
GET    /api/procedures/by-scope/         # Prozeduren nach Scope filtern
  ?scope=global&project_id=1&cycle_id=2&include_global=true
```

### Workflows (erweitert)

```
POST   /api/workflows/{id}/copy          # Workflow in anderen Scope kopieren
GET    /api/workflows/by-scope/          # Workflows nach Scope filtern
  ?scope=global&project_id=1&cycle_id=2&include_global=true
```

## Frontend-Komponenten

### Neue Komponenten

**ProjectDashboard** (`/projects`)
- Übersicht aller Projekte als Karten
- Global-Projekt prominent dargestellt
- Button "Neues Projekt"

**ProjectView** (`/projects/{id}`)
- Filesystem-ähnliche Baumansicht
- Zeigt Projekt-Struktur mit Zyklen
- Navigation zu Ressourcen (Prozeduren, Workflows, Tabellen)

**GlobalValuesView** (`/global-values`)
- Verwaltung globaler Werte
- Kategorisierung
- CRUD-Operationen

### Navigation

**Sidebar:**
- Zeigt aktuell ausgewähltes Projekt
- Link zu Projekt-Übersicht
- Bestehende Navigation bleibt erhalten

**Projekt-Kontext:**
- Wird im localStorage gespeichert
- Wird in URL-Parametern weitergegeben
- Filtert Ressourcen nach Projekt/Zyklus

## Initialisierung

### Backend

```bash
# Datenbank-Migration (neue Tabellen werden automatisch erstellt)
cd backend
python init_global.py
```

Das Script erstellt:
- Global-Projekt
- Standard globale Werte (MWST_SATZ, WAEHRUNG, etc.)

### Frontend

Keine spezielle Initialisierung nötig. Die Komponenten sind in App.jsx eingebunden.

## Workflow

### Typischer Arbeitsablauf

1. **Projekt erstellen**
   - Auf "Projekte" klicken
   - "Neues Projekt" → Name, Beschreibung, Zyklustyp eingeben
   - Projekt wird mit Standard-Konfiguration erstellt

2. **Ersten Zyklus erstellen**
   - Projekt öffnen
   - "Nächster Zyklus" klicken
   - Zyklus wird mit Unterordnern erstellt

3. **Ressourcen erstellen**
   - In Projektstruktur navigieren
   - Auf "Prozeduren", "Workflows" oder "Datentabellen" klicken
   - Ressource wird mit Projekt/Zyklus-Kontext erstellt

4. **Globale Ressourcen nutzen**
   - Globale Werte sind automatisch verfügbar
   - Globale Prozeduren können referenziert werden
   - Bei Bedarf: "In Projekt kopieren" für lokale Anpassungen

## Migration bestehender Daten

Bestehende Ressourcen ohne Projekt-Zuordnung:
- Werden weiterhin funktionieren
- Können nachträglich einem Projekt zugeordnet werden
- Empfehlung: Schrittweise Migration

## Best Practices

1. **Global-Projekt nutzen**
   - Für wiederverwendbare Prozeduren
   - Für Standard-Werte
   - Für Templates

2. **Projekt-Struktur**
   - Klare Namenskonventionen
   - Sinnvolle Zyklen-Konfiguration
   - Dokumentation in Projekt-Beschreibung

3. **Scope-Wahl**
   - Global: Nur für wirklich universelle Ressourcen
   - Project: Für projekt-spezifische Logik
   - Cycle: Für zeitraum-spezifische Anpassungen

4. **Globale Werte**
   - Kategorisieren für bessere Übersicht
   - Beschreibungen hinzufügen
   - Nicht zu viele Werte (Übersichtlichkeit)

## Zukünftige Erweiterungen

Mögliche Features:
- Projekt-Templates
- Bulk-Export/Import
- Projekt-Archivierung
- Berechtigungen pro Projekt
- Projekt-Dashboard mit Statistiken
- Automatische Zyklus-Erstellung (Scheduler)
