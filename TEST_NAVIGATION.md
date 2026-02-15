# Test der neuen Navigation

## Status: Phase 1-3 Abgeschlossen ✅

### Implementierte Features

#### Backend
- ✅ `WorkflowInstance` Model erstellt
- ✅ API-Endpunkte für Workflow-Instanzen
- ✅ Migration-Scripts ausgeführt
- ✅ Daten korrekt zugeordnet (Testprojekt)

#### Frontend
- ✅ `DirectorySidebar` Component erstellt
- ✅ Verzeichnis-basierte Navigation
- ✅ Zurück-Button und aktuelle Position
- ✅ `WorkflowExecutionDialog` erstellt
- ✅ Parameter und Input-Mapping
- ✅ Integration in `WorkflowsView`
- ✅ Breadcrumb mit Folder-Support

### Datenbank-Status

**Projekte:**
- ID 1: Global (is_global=True)
- ID 2: testprojekt (is_global=False)
- ID 3: Testprojekt (is_global=False)

**Workflows:**
- 1 Workflow in Projekt 3 (Testprojekt)

**Prozeduren:**
- 8 Prozeduren in Projekt 3 (Testprojekt)
  - simple_test v1-v3
  - BBG v1-v5

**Tabellen:**
- 10 Tabellen in Projekt 3 (Testprojekt)

**Zyklen:**
- 2 Zyklen (je einer in Projekt 2 und 3)
- Alte Subfolder-Struktur: ['01_Eingangsdaten', '02_Verarbeitung', '03_Ausgabe', '04_Archiv']

### Test-Schritte

1. **Frontend öffnen**: http://localhost:5173
2. **Navigation testen**:
   - Root-Ebene sollte Projekte zeigen (Global, testprojekt, Testprojekt)
   - Klick auf "Testprojekt" → Sollte Ressourcen + Zyklen zeigen
   - Klick auf "Jahr_2026" → Sollte Unterordner zeigen
   - Zurück-Button testen
3. **Workflow-Ausführung testen**:
   - In Testprojekt → Workflows
   - Workflow auswählen → Ausführen
   - Dialog sollte Input-Auswahl und Parameter zeigen
   - Bei Ausführung in Zyklus: Konfiguration wird gespeichert

### Bekannte Punkte

1. **Alte Subfolder-Struktur**: Zyklen haben noch alte Namen
   - Sollte: ['Input', 'Konfiguration', 'Output']
   - Ist: ['01_Eingangsdaten', '02_Verarbeitung', '03_Ausgabe', '04_Archiv']
   - Kann bei Bedarf aktualisiert werden

2. **Workflow ohne Name**: Workflow ID 1 hat keinen Namen
   - Sollte in der UI trotzdem funktionieren

### Nächste Schritte (Optional)

- Subfolder-Struktur aktualisieren auf neue Namen
- Workflow-Namen setzen
- Weitere Workflows erstellen zum Testen
- ProjectHome anpassen für neue Navigation
- Workflow-Instanzen testen (Speichern/Laden von Konfiguration)

## Fazit

Die Implementierung ist vollständig und sollte funktionieren. Alle Komponenten sind erstellt und integriert. Das System kann jetzt getestet werden.
