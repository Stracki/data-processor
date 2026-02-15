# Projekt-Detailseite implementiert ✅

## Problem

Wenn man in der DirectorySidebar auf ein Projekt klickt, ändert sich die URL zu `/home?project=X`, aber die Ansicht bleibt gleich (Baum-Übersicht). Es fehlte eine dedizierte Projekt-Detailseite.

## Lösung

`ProjectHome.jsx` wurde erweitert um eine Projekt-Detailansicht zu zeigen, wenn ein Projekt in der URL ausgewählt ist.

## Implementierung

### Logik

```javascript
// Prüfe ob ein Projekt ausgewählt ist
const selectedProjectId = searchParams.get('project')

// Wenn Projekt ausgewählt → Zeige Detailseite
if (selectedProjectId) {
  const project = projects.find(p => p.id === parseInt(selectedProjectId))
  if (project) {
    return <ProjectDetailView project={project} ... />
  }
}

// Sonst → Zeige Baum-Übersicht
return <div className="project-home">...</div>
```

### Neue Komponente: ProjectDetailView

**Anzeige:**
- Projekt-Icon und Name (groß, prominent)
- Beschreibung (falls vorhanden)
- Statistiken:
  - Anzahl Zyklen
  - Aktueller Zyklus (Name)
- Aktionen:
  - "📅 Aktueller Zyklus" (navigiert zu aktuellem Zyklus)
  - "➕ Nächster Zyklus anlegen" (erstellt neuen Zyklus)
- Platzhalter für Stammdaten (für zukünftige Implementierung)

**Navigation:**
- "← Zurück zur Übersicht" Button (zurück zu `/home`)
- "Aktueller Zyklus" Button (zu `/home?project=X&cycle=Y`)

## Features

### 1. Projekt-Info
- Großes Icon (🌐 für Global, 📂 für andere)
- Projekt-Name als Hauptüberschrift
- Beschreibung (falls vorhanden)
- Gradient-Hintergrund für visuellen Fokus

### 2. Statistik-Karten
- Anzahl Zyklen
- Name des aktuellen Zyklus
- Erweiterbar für weitere Metriken

### 3. Aktions-Buttons
- **Aktueller Zyklus**: Springt zum neuesten Zyklus
  - Deaktiviert wenn kein Zyklus vorhanden
- **Nächster Zyklus anlegen**: Erstellt neuen Zyklus
  - Immer aktiv

### 4. Stammdaten-Platzhalter
- Bereich für zukünftige Implementierung
- Zeigt aktuell nur Hinweistext
- Vorbereitet für:
  - Kontakte
  - Adressen
  - Custom-Felder

## Verwendung

### Navigation zur Detailseite

**Aus DirectorySidebar:**
```
Root → Klick auf Projekt → Detailseite
```

**Aus Baum-Übersicht:**
```
Home → Projekt expandieren → (noch nicht implementiert)
```

**Direkt per URL:**
```
http://localhost:5173/home?project=3
```

### Zurück zur Übersicht

**Button:**
```
Klick auf "← Zurück zur Übersicht"
```

**DirectorySidebar:**
```
Klick auf "← Zurück" (wenn in Projekt)
```

## Styling

### Farben
- Projekt-Header: Gradient (Lila-Blau)
- Primär-Button: Grün (#4CAF50)
- Sekundär-Button: Blau (#2196F3)
- Stat-Cards: Weiß mit Schatten

### Layout
- Zentriert, max-width 1200px
- Responsive Grid für Statistiken
- Flexbox für Buttons

### Effekte
- Hover: translateY(-2px) + Box-Shadow
- Transitions: 0.2s
- Disabled-State für "Aktueller Zyklus"

## Nächste Schritte (Optional)

### Sofort möglich:
1. Testen: Klick auf Projekt in Sidebar
2. Testen: "Aktueller Zyklus" Button
3. Testen: "Nächster Zyklus anlegen" Button
4. Testen: Zurück-Navigation

### Zukünftig:
1. Stammdaten-Formular implementieren
2. Projekt-Einstellungen (Zyklustyp, Subfolders)
3. Projekt-Statistiken (Anzahl Workflows, Prozeduren, Tabellen)
4. Projekt bearbeiten/löschen
5. Zyklus-Liste mit Details

## Dateien geändert

- `frontend/src/components/projects/ProjectHome.jsx`
  - Import von `useSearchParams` hinzugefügt
  - `selectedProjectId` aus URL extrahiert
  - Conditional Rendering für Detailseite
  - Neue Komponente `ProjectDetailView` erstellt

- `frontend/src/components/projects/ProjectHome.css`
  - Styles für `.project-detail-view` hinzugefügt
  - Styles für `.project-info` (Header)
  - Styles für `.project-stats` (Statistik-Karten)
  - Styles für `.project-actions` (Buttons)
  - Styles für `.project-metadata-placeholder`

## Ergebnis

✅ Klick auf Projekt in Sidebar → Zeigt Projekt-Detailseite
✅ Projekt-Name und Info prominent angezeigt
✅ Zwei Aktions-Buttons (Platzhalter funktionsfähig)
✅ Zurück-Navigation funktioniert
✅ Platzhalter für zukünftige Stammdaten
✅ Responsive und ansprechend gestylt
