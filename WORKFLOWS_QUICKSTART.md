# Workflows - Quickstart Guide

## 🚀 Schnellstart

### Installation

Die Dependencies wurden bereits installiert. Starte einfach Backend und Frontend:

```bash
# Backend starten
cd backend
python main.py

# Frontend starten (neues Terminal)
cd frontend
npm run dev
```

### Erster Workflow in 5 Minuten

#### 1. Vorbereitung

Stelle sicher, dass du hast:
- ✅ Mindestens eine Datentabelle erstellt
- ✅ Mindestens eine Prozedur erstellt

Falls nicht:
1. Gehe zu "Tabellen" → "Neue Datentabelle"
2. Gehe zu "Tabellen" → "Prozeduren" → "Neue Prozedur"

#### 2. Workflow erstellen

1. **Navigiere zu Workflows**
   - Klicke in der Sidebar auf "🔄 Workflows"

2. **Neuen Workflow anlegen**
   - Klicke auf "+ Neuer Workflow"
   - Gib einen Namen ein, z.B. "Mein erster Workflow"

3. **Nodes hinzufügen**
   - Klicke auf "+ Node hinzufügen"
   - Wähle "📊 Tabelle"
   - Wähle eine Tabelle aus dem Dropdown

4. **Prozedur hinzufügen**
   - Klicke erneut auf "+ Node hinzufügen"
   - Wähle "⚙️ Prozedur"
   - Wähle eine Prozedur aus

5. **Nodes verbinden**
   - Ziehe vom grünen Punkt (Handle) der Tabelle
   - Zum grünen Punkt der Prozedur
   - Eine Linie erscheint

6. **Output hinzufügen**
   - Füge einen "📤 Output" Node hinzu
   - Verbinde die Prozedur mit dem Output
   - Gib dem Output einen Namen

7. **Speichern**
   - Klicke auf "Speichern"

#### 3. Workflow ausführen

1. Gehe zurück zur Workflow-Übersicht
2. Klicke bei deinem Workflow auf "Ausführen"
3. Sieh dir das Ergebnis an!

## 📊 Beispiel-Workflows

### Beispiel 1: Einfache Datenverarbeitung

```
[Kundendaten] → [Filter-Prozedur] → [Output: Gefilterte Daten]
```

**Was passiert:**
1. Kundendaten werden geladen
2. Prozedur filtert die Daten
3. Ergebnis wird ausgegeben

### Beispiel 2: Mehrere Inputs

```
[Tabelle A] ──┐
              ├→ [Merge-Prozedur] → [Output]
[Tabelle B] ──┘
```

**Was passiert:**
1. Zwei Tabellen werden geladen
2. Prozedur kombiniert beide Tabellen
3. Kombiniertes Ergebnis wird ausgegeben

### Beispiel 3: Mit Parametern

```
[Kundendaten] ──→ [Berechnung] ──→ [Output]
                       ↑
                  [Wert: 1.19]
```

**Was passiert:**
1. Kundendaten werden geladen
2. Wert (z.B. MwSt-Satz) wird bereitgestellt
3. Prozedur berechnet mit beiden Inputs
4. Ergebnis wird ausgegeben

## 🎨 Node-Typen im Detail

### 📊 Tabelle
- **Zweck**: Lädt eine Datentabelle
- **Konfiguration**: Tabelle aus Dropdown wählen
- **Output**: Komplette Tabelle mit allen Daten

### ⚙️ Prozedur
- **Zweck**: Führt eine Prozedur aus
- **Konfiguration**: Prozedur wählen, Parameter verbinden
- **Output**: Ergebnis der Prozedur (meist eine neue Tabelle)

### 🔢 Wert
- **Zweck**: Stellt einen statischen Wert bereit
- **Konfiguration**: Typ wählen (String, Number, Boolean, JSON), Wert eingeben
- **Output**: Der eingegebene Wert

### 📤 Output
- **Zweck**: Definiert was der Workflow zurückgibt
- **Konfiguration**: Name für den Output
- **Output**: Sammelt Daten von verbundenen Nodes

### 🌐 API Call (Coming Soon)
- **Zweck**: Ruft externe APIs auf
- **Status**: Platzhalter für zukünftige Version
- **Geplant**: REST, GraphQL, SOAP, Webhooks

## 💡 Tipps & Tricks

### Workflow organisieren
- Nutze die Minimap (unten rechts) für Übersicht
- Ziehe Nodes mit der Maus um sie zu positionieren
- Nutze Zoom (Mausrad) für bessere Sicht

### Nodes löschen
- Klicke auf einen Node
- Drücke "Delete" oder "Backspace"

### Verbindungen löschen
- Klicke auf eine Verbindungslinie
- Drücke "Delete" oder "Backspace"

### Mehrere Outputs
- Eine Prozedur kann mehrere Output-Nodes haben
- Jeder Output kann einen eigenen Namen haben

### Debugging
- Schaue in die Browser-Konsole für Fehler
- Prüfe die Execution Logs nach der Ausführung
- Teste Prozeduren einzeln bevor du sie in Workflows nutzt

## ⚠️ Häufige Fehler

### "Workflow contains cycles"
- **Problem**: Du hast eine Schleife erstellt (A → B → A)
- **Lösung**: Entferne die Verbindung die die Schleife schließt

### "Procedure node requires procedureId"
- **Problem**: Prozedur-Node hat keine Prozedur ausgewählt
- **Lösung**: Wähle eine Prozedur aus dem Dropdown

### "Table not found"
- **Problem**: Die gewählte Tabelle existiert nicht mehr
- **Lösung**: Wähle eine andere Tabelle oder erstelle die Tabelle neu

### Workflow wird nicht ausgeführt
- **Problem**: Workflow ist auf "Inaktiv" gesetzt
- **Lösung**: Bearbeite den Workflow und setze ihn auf "Aktiv"

## 🔮 Kommende Features

### In Entwicklung
- ✅ Basis-Workflow-System
- 🚧 API-Integration
- 🚧 Bedingte Verzweigungen (If/Else)
- 🚧 Schleifen (For Each)

### Geplant
- ⏰ Zeitgesteuerte Ausführung (Scheduling)
- 📊 Workflow-Monitoring Dashboard
- 📦 Workflow-Templates
- 🔄 Workflow-Versionierung
- 🔀 Parallele Ausführung
- 📧 Benachrichtigungen bei Fehlern

## 🆘 Hilfe & Support

### Dokumentation
- Vollständige Dokumentation: `WORKFLOWS_README.md`
- Prozeduren-Dokumentation: `PROZEDUREN_README.md`
- Tabellen-Dokumentation: `DATENTABELLE_README.md`

### Probleme melden
- Prüfe zuerst die Browser-Konsole
- Schaue in die Backend-Logs
- Dokumentiere Schritte zur Reproduktion

## 🎯 Nächste Schritte

1. **Erstelle deinen ersten Workflow** (siehe oben)
2. **Experimentiere mit verschiedenen Node-Typen**
3. **Kombiniere mehrere Prozeduren**
4. **Erstelle komplexere Workflows**
5. **Teile deine Workflows mit dem Team**

Viel Erfolg! 🚀
