# Home Baum-Ansicht an neue Struktur angepasst ✅

## Problem

Die Baum-Ansicht auf der Home-Seite zeigte eine andere Struktur als die DirectorySidebar:

**DirectorySidebar (richtig):**
```
Projekt
├─ ⚙️ Prozeduren
├─ 🔄 Workflows
├─ 📊 Datentabellen
└─ 📅 Zyklus
    ├─ 📁 Input
    ├─ 📁 Konfiguration
    └─ 📁 Output
```

**ProjectHome Baum (veraltet):**
```
Projekt
└─ 📦 _shared
    ├─ ⚙️ Prozeduren
    ├─ 🔄 Workflows
    └─ 📊 Datentabellen
└─ 📅 Zyklus
    ├─ 📁 Input
    │   ├─ ⚙️ Prozeduren
    │   ├─ 🔄 Workflows
    │   └─ 📊 Datentabellen
    └─ ...
```

## Lösung

Die Baum-Ansicht wurde vereinfacht und an die DirectorySidebar-Struktur angepasst.

## Änderungen

### 1. ProjectTreeItem - Entfernt "_shared" Ordner

**Vorher:**
- Ressourcen waren in einem "_shared" oder "Global" Ordner verschachtelt
- Zusätzliche Ebene ohne Funktion

**Nachher:**
- Ressourcen direkt unter Projekt
- Flachere, klarere Hierarchie

```javascript
{expanded && (
  <div className="tree-children">
    {/* Ressourcen direkt */}
    <div className="tree-node resource-node">
      <span className="node-icon">⚙️</span>
      <span className="node-name">Prozeduren</span>
    </div>
    {/* ... weitere Ressourcen ... */}
    
    {/* Zyklen */}
    {cycles.map(cycle => ...)}
  </div>
)}
```

### 2. CycleTreeItem - Vereinfacht

**Vorher:**
- Unterordner hatten jeweils Prozeduren/Workflows/Tabellen
- Zu viel Verschachtelung
- Verwirrend, da Ressourcen mehrfach auftauchten

**Nachher:**
- Unterordner sind nur noch Ordner-Namen
- Keine Ressourcen mehr unter Unterordnern in der Baum-Ansicht
- Konsistent mit DirectorySidebar

```javascript
{expanded && (
  <div className="tree-children">
    {subfolders.map(subfolder => (
      <div className="tree-node folder-node">
        <span className="node-icon">📁</span>
        <span className="node-name">{subfolder}</span>
      </div>
    ))}
  </div>
)}
```

## Neue Struktur

### Projekt-Ebene
```
📂 Testprojekt
  ├─ ⚙️ Prozeduren          (klickbar → navigiert zu Prozeduren)
  ├─ 🔄 Workflows           (klickbar → navigiert zu Workflows)
  ├─ 📊 Datentabellen       (klickbar → navigiert zu Tabellen)
  ├─ 📅 Jahr_2026           (expandierbar)
  └─ ➕ Nächster Zyklus     (klickbar → erstellt Zyklus)
```

### Zyklus-Ebene (expandiert)
```
📅 Jahr_2026
  ├─ 📁 01_Eingangsdaten    (nur Anzeige)
  ├─ 📁 02_Verarbeitung     (nur Anzeige)
  ├─ 📁 03_Ausgabe          (nur Anzeige)
  └─ 📁 04_Archiv           (nur Anzeige)
```

### Global-Projekt
```
🌐 Global
  ├─ ⚙️ Prozeduren
  ├─ 🔄 Workflows
  ├─ 📊 Datentabellen
  └─ 💎 Globale Werte       (nur bei Global)
```

## Vergleich: Vorher vs. Nachher

### Vorher (zu verschachtelt)
```
Testprojekt (4 Ebenen)
└─ _shared
    └─ Prozeduren
        └─ (Inhalt)

Jahr_2026 (5 Ebenen!)
└─ Input
    └─ Prozeduren
        └─ (Inhalt)
```

### Nachher (flach)
```
Testprojekt (2 Ebenen)
└─ Prozeduren
    └─ (Inhalt)

Jahr_2026 (2 Ebenen)
└─ Input
    └─ (Inhalt)
```

## Funktionalität

### Klickbare Elemente

**Projekt-Ebene:**
- ⚙️ Prozeduren → `/procedures?project=X&scope=project`
- 🔄 Workflows → `/workflows?project=X&scope=project`
- 📊 Datentabellen → `/tables?project=X&scope=project`
- 💎 Globale Werte → `/global-values?project=X`
- ➕ Nächster Zyklus → Erstellt neuen Zyklus

**Zyklus-Ebene:**
- 📁 Unterordner → Nur Anzeige (keine Navigation)

### Expandierbare Elemente

- 📂 Projekt → Zeigt Ressourcen + Zyklen
- 📅 Zyklus → Zeigt Unterordner

## Konsistenz

Jetzt sind beide Ansichten konsistent:

| Ansicht | Struktur | Verhalten |
|---------|----------|-----------|
| DirectorySidebar | Flach, nur aktuelle Ebene | Navigiert durch Ebenen |
| ProjectHome Baum | Flach, expandierbar | Zeigt Übersicht |

Beide zeigen:
- Ressourcen direkt unter Projekt
- Zyklen auf gleicher Ebene wie Ressourcen
- Unterordner unter Zyklen (nur Namen)

## Vorteile

✅ Konsistente Struktur in beiden Ansichten
✅ Weniger Verschachtelung
✅ Klarere Hierarchie
✅ Einfacher zu verstehen
✅ Keine doppelten Ressourcen-Einträge

## Test-Schritte

1. **Home-Seite öffnen:**
   - Gehe zu http://localhost:5173/home
   - Sollte Projekt-Liste zeigen

2. **Projekt expandieren:**
   - Klicke auf "▶ Testprojekt"
   - Sollte Ressourcen + Zyklen direkt zeigen
   - KEIN "_shared" Ordner mehr

3. **Zyklus expandieren:**
   - Klicke auf "▶ Jahr_2026"
   - Sollte nur Unterordner-Namen zeigen
   - KEINE Ressourcen unter Unterordnern

4. **Ressource öffnen:**
   - Klicke auf "⚙️ Prozeduren"
   - Sollte zu Prozeduren-Seite navigieren

5. **Mit Sidebar vergleichen:**
   - Navigiere mit Sidebar durch Projekt
   - Struktur sollte identisch sein

## Dateien geändert

- `frontend/src/components/projects/ProjectHome.jsx`
  - `ProjectTreeItem`: "_shared" Ordner entfernt
  - `CycleTreeItem`: Ressourcen unter Unterordnern entfernt
  - Flachere Hierarchie implementiert

## Ergebnis

Die Baum-Ansicht auf der Home-Seite zeigt jetzt die gleiche Struktur wie die DirectorySidebar. Keine Verwirrung mehr durch unterschiedliche Hierarchien! 🎉
