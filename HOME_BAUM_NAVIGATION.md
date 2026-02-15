# Home Baum-Navigation verbessert ✅

## Problem

Im Home-Baum waren nur Ressourcen (Workflows, etc.) klickbar. Projekte, Zyklen und Unterordner konnten nicht direkt geöffnet werden.

## Lösung: Getrennte Funktionalität

### Konzept

**Expand-Icon (▶/▼):**
- Klick auf Icon → Auf/Zuklappen
- Zeigt/versteckt Unterelemente
- Visuelles Feedback (Scale-Effekt)

**Element-Name:**
- Klick auf Name → Navigiert zur Seite
- Hover-Effekt (Underline + Grün)
- Jedes Element ist navigierbar

## Implementierung

### 1. ProjectTreeItem - Projekt-Navigation

**Expand-Icon:**
```jsx
<span className="expand-icon" onClick={onToggle}>
  {expanded ? '▼' : '▶'}
</span>
```

**Projekt-Name:**
```jsx
<span className="node-name" onClick={handleProjectClick}>
  {project.name}
</span>
```

**Navigation:**
```javascript
const handleProjectClick = () => {
  navigate(`/home?project=${project.id}`)
}
```

### 2. CycleTreeItem - Zyklus-Navigation

**Expand-Icon:**
```jsx
<span className="expand-icon" onClick={onToggle}>
  {expanded ? '▼' : '▶'}
</span>
```

**Zyklus-Name:**
```jsx
<span className="node-name" onClick={handleCycleClick}>
  {cycle.name}
</span>
```

**Navigation:**
```javascript
const handleCycleClick = () => {
  navigate(`/home?project=${projectId}&cycle=${cycle.id}`)
}
```

**Unterordner:**
```jsx
<div 
  className="tree-node folder-node"
  onClick={() => handleFolderClick(subfolder)}
>
  <span className="node-icon">📁</span>
  <span className="node-name">{subfolder}</span>
</div>
```

```javascript
const handleFolderClick = (folder) => {
  navigate(`/home?project=${projectId}&cycle=${cycle.id}&folder=${folder}`)
}
```

## CSS-Änderungen

### Basis-Node

```css
.tree-node {
  cursor: default;  /* Nicht mehr pointer */
}
```

### Expand-Icon

```css
.expand-icon {
  width: 1rem;
  text-align: center;
  cursor: pointer;
  user-select: none;
  flex-shrink: 0;
  transition: transform 0.2s;
}

.expand-icon:hover {
  transform: scale(1.3);  /* Visuelles Feedback */
}
```

### Node-Name

```css
.node-name {
  flex: 1;
  cursor: pointer;
}

.node-name:hover {
  text-decoration: underline;
  color: #4CAF50;
}
```

### Ressourcen & Ordner

```css
.resource-node {
  cursor: pointer;  /* Komplett klickbar */
}

.folder-node {
  cursor: pointer;  /* Komplett klickbar */
}

.folder-node:hover {
  background: #e3f2fd;
  transform: translateX(4px);
}
```

## Navigation-Matrix

| Element | Icon-Klick | Name-Klick | Ganzer Node-Klick |
|---------|-----------|------------|-------------------|
| Projekt | Expand/Collapse | → Projekt-Detailseite | - |
| Zyklus | Expand/Collapse | → Zyklus-Detailseite | - |
| Unterordner | - | → Unterordner-Ansicht | → Unterordner-Ansicht |
| Ressource | - | → Ressourcen-Seite | → Ressourcen-Seite |
| Aktion | - | Aktion ausführen | Aktion ausführen |

## Beispiel-Flow

### Projekt öffnen

```
1. Klick auf ▶ bei "Testprojekt"
   → Projekt expandiert, zeigt Ressourcen + Zyklen

2. Klick auf "Testprojekt" (Name)
   → Navigiert zu /home?project=3
   → Zeigt Projekt-Detailseite
```

### Zyklus öffnen

```
1. Projekt ist expandiert
2. Klick auf ▶ bei "Jahr_2026"
   → Zyklus expandiert, zeigt Unterordner

3. Klick auf "Jahr_2026" (Name)
   → Navigiert zu /home?project=3&cycle=2
   → Zeigt Zyklus-Detailseite
```

### Unterordner öffnen

```
1. Zyklus ist expandiert
2. Klick auf "Input" (ganzer Node)
   → Navigiert zu /home?project=3&cycle=2&folder=Input
   → Zeigt Unterordner-Ansicht (noch zu implementieren)
```

### Ressource öffnen

```
1. Projekt ist expandiert
2. Klick auf "Workflows" (ganzer Node)
   → Navigiert zu /workflows?project=3&scope=project
   → Zeigt Workflows-Seite
```

## Visuelles Feedback

### Expand-Icon
- Hover: Scale 1.3
- Zeigt an: "Hier klicken zum Auf/Zuklappen"

### Node-Name
- Hover: Underline + Grün
- Zeigt an: "Hier klicken zum Öffnen"

### Ressourcen/Ordner
- Hover: Hintergrund + Slide-Effekt
- Zeigt an: "Klickbar"

## Vorteile

✅ Intuitive Bedienung (wie Datei-Explorer)
✅ Klare Trennung: Icon = Expand, Name = Navigate
✅ Jedes Element ist navigierbar
✅ Visuelles Feedback für alle Interaktionen
✅ Konsistent über alle Node-Typen

## Geänderte Dateien

### frontend/src/components/projects/ProjectHome.jsx
- `ProjectTreeItem`: Getrennte Click-Handler für Icon und Name
- `CycleTreeItem`: Getrennte Click-Handler, Unterordner klickbar
- Navigation mit `useNavigate()` Hook

### frontend/src/components/projects/ProjectHome.css
- `.tree-node`: cursor: default
- `.expand-icon`: cursor: pointer, hover scale
- `.node-name`: cursor: pointer, hover underline
- `.folder-node`: cursor: pointer, hover background

## Test-Schritte

1. **Home-Seite öffnen:**
   - Gehe zu http://localhost:5173/home

2. **Projekt expandieren:**
   - Klick auf ▶ bei "Testprojekt"
   - Sollte expandieren

3. **Projekt öffnen:**
   - Klick auf "Testprojekt" (Name)
   - Sollte zur Projekt-Detailseite navigieren

4. **Zurück zu Home:**
   - Klick auf "Home" im Breadcrumb

5. **Zyklus expandieren:**
   - Projekt expandieren
   - Klick auf ▶ bei "Jahr_2026"
   - Sollte Unterordner zeigen

6. **Zyklus öffnen:**
   - Klick auf "Jahr_2026" (Name)
   - Sollte zur Zyklus-Detailseite navigieren

7. **Unterordner öffnen:**
   - Zyklus expandieren
   - Klick auf "Input"
   - Sollte navigieren (Unterordner-Ansicht noch zu implementieren)

8. **Ressource öffnen:**
   - Projekt expandieren
   - Klick auf "Workflows"
   - Sollte zur Workflows-Seite navigieren

## Nächste Schritte (Optional)

- Unterordner-Detailseite implementieren
- Keyboard-Navigation (Pfeiltasten)
- Drag & Drop für Reorganisation
- Kontextmenü (Rechtsklick)

## Ergebnis

Der Home-Baum ist jetzt vollständig navigierbar. Jedes Element kann geöffnet werden, und die Expand/Collapse-Funktionalität bleibt erhalten! 🎉
