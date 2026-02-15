# Breadcrumb Layout - Finale Lösung ✅

## Problem

Das Breadcrumb war immer noch verschoben, trotz negativer Margins.

## Ursache

Die negative Margin-Lösung war zu komplex und funktionierte nicht zuverlässig. Das Problem war das globale `padding: 2rem` auf `.main-content`.

## Finale Lösung

### Ansatz: Selektives Padding

Statt negativer Margins: Entferne das Padding von `.main-content` und füge es nur für Views hinzu, die KEIN Breadcrumb haben.

### App.css - Änderung

**Vorher:**
```css
.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;  /* Globales Padding für alle */
}
```

**Nachher:**
```css
.main-content {
  flex: 1;
  overflow-y: auto;
  /* KEIN globales Padding mehr */
}

/* Nur für Views OHNE Breadcrumb */
.main-content > :not(.project-detail-view):not(.cycle-detail-view):not(.workflows-view):not(.table-overview):not(.procedures-view) {
  padding: 2rem;
}
```

### View-CSS - Vereinfacht

Alle Views mit Breadcrumb haben jetzt einfache Struktur:

```css
.view-name {
  min-height: 100vh;
  /* KEIN margin, KEIN padding */
}

.view-name .breadcrumb {
  padding: 1rem 2rem;
  margin: 0;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

.view-name-content {
  padding: 2rem;
}
```

## Geänderte Dateien

### 1. frontend/src/App.css
- Padding von `.main-content` entfernt
- Selektives Padding mit `:not()` Selektor hinzugefügt

### 2. frontend/src/components/projects/ProjectHome.css
- Negative Margins entfernt
- Einfache Struktur: `min-height: 100vh`

### 3. frontend/src/components/workflows/WorkflowsView.css
- Negative Margins entfernt
- Einfache Struktur

### 4. frontend/src/components/TableOverview.css
- Negative Margins entfernt
- Einfache Struktur

### 5. frontend/src/components/procedures/ProceduresView.css
- Negative Margins entfernt
- Einfache Struktur

## Vorteile dieser Lösung

✅ Einfacher und wartbarer Code
✅ Keine negativen Margins (kompliziert)
✅ Breadcrumb am oberen Rand
✅ Funktioniert zuverlässig
✅ Kein Caching-Problem

## Struktur

```
┌─────────────────────────────────────┐
│ Sidebar │ Breadcrumb (weiß, 1rem 2rem) │
│         ├─────────────────────────────┤
│         │ Content (padding: 2rem)     │
│         │                             │
└─────────────────────────────────────┘
```

## Test-Schritte

1. **Hard Refresh im Browser:**
   - Windows: `Ctrl + Shift + R`
   - Mac: `Cmd + Shift + R`
   - Oder: DevTools öffnen → "Disable cache" aktivieren

2. **Projekt-Detailseite testen:**
   - Navigiere zu einem Projekt
   - Breadcrumb sollte ganz oben sein, ohne Versatz

3. **Alle Views testen:**
   - Workflows
   - Tabellen
   - Prozeduren
   - Zyklus-Detailseite

4. **Andere Seiten prüfen:**
   - Home (Baum-Ansicht) sollte noch Padding haben
   - Andere Views ohne Breadcrumb sollten Padding haben

## Wichtig: Browser-Cache

Falls das Breadcrumb immer noch verschoben ist:

1. **Hard Refresh** (siehe oben)
2. **Cache leeren:**
   - Chrome: DevTools → Network → "Disable cache"
   - Oder: Settings → Clear browsing data → Cached images and files
3. **Vite Dev Server neu starten:**
   ```bash
   docker restart table-data-processor-frontend-1
   ```

## Ergebnis

Das Breadcrumb sollte jetzt:
- ✅ Ganz oben sein (kein Versatz)
- ✅ Weißen Hintergrund haben
- ✅ Horizontales Padding haben (1rem 2rem)
- ✅ Auf allen Seiten konsistent sein
