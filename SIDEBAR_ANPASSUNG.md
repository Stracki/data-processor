# Sidebar passt sich an Projekt-Kontext an ✅

## Problem

Wenn man auf ein Projekt klickt (z.B. `/home?project=3`), zeigte die Sidebar immer noch die Root-Ebene (alle Projekte) statt die Projekt-Inhalte.

## Ursache

Die `parsePathFromLocation()` Funktion prüfte zuerst ob `pathname === '/home'` und gab dann `[]` (Root) zurück, bevor sie die URL-Parameter prüfte. Da der pathname bei `/home?project=3` immer noch `/home` ist, wurde nie der Projekt-Kontext erkannt.

## Lösung

### 1. Logik-Reihenfolge geändert

**Vorher:**
```javascript
if (pathname === '/home' || pathname === '/') {
  return []  // Root
}
// Dann erst Parameter prüfen
```

**Nachher:**
```javascript
// Erst Parameter extrahieren
const projectId = searchParams.get('project')
const cycleId = searchParams.get('cycle')
const folder = searchParams.get('folder')

// Nur Root wenn keine Parameter UND /home
if (!projectId && (pathname === '/home' || pathname === '/')) {
  return []
}
```

### 2. Projekt/Zyklus-Namen speichern

Neue State-Variablen hinzugefügt:
```javascript
const [currentProject, setCurrentProject] = useState(null)
const [currentCycle, setCurrentCycle] = useState(null)
```

Diese werden beim Laden gesetzt:
- `loadProjectContents()` → `setCurrentProject(project)`
- `loadCycleContents()` → `setCurrentCycle(cycle)`
- `loadProjects()` → Reset auf `null`

### 3. Bessere Namen-Anzeige

`getCurrentName()` zeigt jetzt echte Namen:
```javascript
if (last.type === 'project' && currentProject) {
  return currentProject.name  // "Testprojekt" statt "project 3"
}
```

## Ergebnis

### Verhalten jetzt:

**Root-Ebene (`/home`):**
```
Sidebar zeigt:
- 🌐 Global
- 📂 testprojekt
- 📂 Testprojekt

Aktuelle Position: "Root"
```

**Projekt-Ebene (`/home?project=3`):**
```
Sidebar zeigt:
- ⚙️ Prozeduren
- 🔄 Workflows
- 📊 Datentabellen
- 📅 Jahr_2026
- ➕ Nächster Zyklus

Aktuelle Position: "Testprojekt"
Zurück-Button: ← Zurück
```

**Zyklus-Ebene (`/home?project=3&cycle=2`):**
```
Sidebar zeigt:
- 📁 01_Eingangsdaten
- 📁 02_Verarbeitung
- 📁 03_Ausgabe
- 📁 04_Archiv

Aktuelle Position: "Jahr_2026"
Zurück-Button: ← Zurück
```

**Unterordner-Ebene (`/home?project=3&cycle=2&folder=Input`):**
```
Sidebar zeigt:
- 📊 Datentabellen
- ▶️ Workflow-Ausführungen

Aktuelle Position: "Input"
Zurück-Button: ← Zurück
```

## Navigation-Flow

```
Root
  ↓ Klick auf Projekt
Projekt (zeigt Ressourcen + Zyklen)
  ↓ Klick auf Zyklus
Zyklus (zeigt Unterordner)
  ↓ Klick auf Unterordner
Unterordner (zeigt Ressourcen)
```

Jede Ebene zeigt nur ihre direkten Kinder, nicht die gesamte Hierarchie.

## Änderungen im Detail

### Datei: `frontend/src/components/DirectorySidebar.jsx`

**1. State erweitert:**
```javascript
const [currentProject, setCurrentProject] = useState(null)
const [currentCycle, setCurrentCycle] = useState(null)
```

**2. parsePathFromLocation() korrigiert:**
- Parameter-Extraktion vor Root-Check
- Root nur wenn keine Parameter

**3. loadProjectContents() erweitert:**
- `setCurrentProject(project)` hinzugefügt

**4. loadCycleContents() erweitert:**
- `setCurrentCycle(cycle)` hinzugefügt

**5. loadProjects() erweitert:**
- Reset: `setCurrentProject(null)` und `setCurrentCycle(null)`

**6. getCurrentName() verbessert:**
- Zeigt echte Namen statt IDs
- Nutzt `currentProject` und `currentCycle`

## Test-Schritte

1. **Root-Ebene testen:**
   - Öffne http://localhost:5173/home
   - Sidebar sollte alle Projekte zeigen
   - Position: "Root"

2. **Projekt-Ebene testen:**
   - Klicke auf "Testprojekt"
   - URL: `/home?project=3`
   - Sidebar sollte Ressourcen + Zyklen zeigen
   - Position: "Testprojekt"
   - Zurück-Button sollte sichtbar sein

3. **Zurück-Navigation testen:**
   - Klicke "← Zurück"
   - Sollte zu Root zurückkehren
   - Sidebar zeigt wieder alle Projekte

4. **Zyklus-Ebene testen:**
   - In Projekt → Klick auf "Jahr_2026"
   - Sidebar sollte Unterordner zeigen
   - Position: "Jahr_2026"

5. **Ressourcen-Navigation testen:**
   - In Projekt → Klick auf "Workflows"
   - Sollte zu `/workflows?project=3&scope=project` navigieren
   - Sidebar bleibt auf Projekt-Ebene

## Vorteile

✅ Sidebar zeigt nur relevante Inhalte der aktuellen Ebene
✅ Keine Verwirrung durch zu viele Optionen
✅ Klare Navigation mit Zurück-Button
✅ Echte Namen statt IDs
✅ Konsistentes Verhalten auf allen Ebenen

## Nächste Schritte

Die Sidebar funktioniert jetzt korrekt. Optional:
- Icon für aktuelles Projekt im Header
- Breadcrumb-Integration in Sidebar
- Keyboard-Navigation (Pfeiltasten)
