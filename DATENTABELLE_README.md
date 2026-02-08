# Datentabelle - Dokumentation

## Übersicht

Die Datentabelle wurde vereinfacht und ist nun speziell für die Datenverarbeitung optimiert. Tabellen werden in der PostgreSQL-Datenbank gespeichert.

## Speicherung

### Backend (PostgreSQL)

Datentabellen werden in der Datenbank gespeichert:

**Tabelle: `data_tables`**
- `id`: Eindeutige ID
- `name`: Tabellenname
- `columns`: JSON-Array mit Spaltendefinitionen
- `data`: JSON-Array mit Zeilendaten
- `row_count`: Anzahl Zeilen
- `column_count`: Anzahl Spalten
- `project_id`: Optional - Zuordnung zu einem Projekt
- `created_at`: Erstellungsdatum
- `updated_at`: Aktualisierungsdatum

### API-Endpunkte

- `GET /api/tables/` - Alle Tabellen abrufen
- `GET /api/tables/{id}` - Einzelne Tabelle abrufen
- `POST /api/tables/` - Neue Tabelle erstellen
- `PUT /api/tables/{id}` - Tabelle aktualisieren
- `DELETE /api/tables/{id}` - Tabelle löschen
- `GET /api/tables/project/{project_id}` - Tabellen eines Projekts

## Workflow

### 1. Excel hochladen (ImportExcel)
- Excel-Datei auswählen und hochladen
- Wird im Backend als BLOB gespeichert

### 2. Excel bearbeiten (ExcelViewer)
- Excel mit x-spreadsheet bearbeiten
- Versionen verwalten
- **NEU:** "In Datentabelle umwandeln" klicken

### 3. Datentabelle erstellen (NewTable)
- Daten aus Excel werden importiert
- Erste Zeile = Spaltenüberschriften
- Datentypen werden automatisch erkannt
- Tabelle bearbeiten und speichern

### 4. Tabellen verwalten (TableOverview)
- Alle gespeicherten Tabellen anzeigen
- Tabellen öffnen, bearbeiten, löschen
- Statistiken anzeigen (Zeilen/Spalten)

### 5. Tabelle bearbeiten (TableEdit)
- Gespeicherte Tabelle laden
- Daten bearbeiten
- Spalten/Zeilen hinzufügen/löschen
- Änderungen speichern

## Änderungen

### NewTable.jsx - Vereinfachte Datentabelle

**Entfernt:**
- Excel-Import-Logik (verschoben zu ExcelViewer)
- Komplexe Excel-ähnliche Darstellung
- Template-System
- Settings-Dialog
- Vollbild-Modus

**Neu:**
- Einfache, übersichtliche Tabellenansicht
- Spalten mit Namen und Datentyp
- Inline-Bearbeitung von Spaltennamen und -typen
- Zeilen und Spalten hinzufügen/löschen
- Datenformate werden beibehalten (Datum, Nummer, etc.)
- **Speichern in Datenbank**

### ExcelViewer.jsx - Neue Funktion

**Neu hinzugefügt:**
- Button "In Datentabelle umwandeln"
- Dialog zur Bestätigung der Umwandlung
- Automatische Erkennung von Datentypen
- Erste Zeile wird als Spaltenüberschriften verwendet
- Navigation zur Datentabelle mit vorausgefüllten Daten

### TableOverview.jsx - NEU

**Funktionen:**
- Übersicht aller gespeicherten Datentabellen
- Karten-Layout mit Statistiken
- Tabellen öffnen/löschen
- Neue Tabelle erstellen
- Sortierung nach Aktualisierungsdatum

### TableEdit.jsx - NEU

**Funktionen:**
- Gespeicherte Tabelle laden und bearbeiten
- Identische Bearbeitungsfunktionen wie NewTable
- Änderungen in Datenbank speichern
- Zurück zur Übersicht

## Datentypen

Die folgenden Datentypen werden unterstützt:

- **Text** (📝): Standard-Textformat
- **Nummer** (🔢): Zahlen mit deutscher Formatierung
- **Datum** (📅): Datumsformat (TT.MM.JJJJ)
- **Zeit** (🕐): Zeitformat (HH:MM:SS)
- **Prozent** (%): Prozentwerte
- **Währung** (€): Währungsformat mit 2 Dezimalstellen

## Datenformat-Konvertierung

Beim Umwandeln von Excel zu Datentabelle:

1. **Excel-Seriennummern** werden automatisch erkannt:
   - Datum: Excel-Seriennummer → deutsches Datumsformat
   - Zeit: Bruchteil eines Tages → HH:MM:SS

2. **Automatische Typ-Erkennung**:
   - Erste 10 Zeilen werden analysiert
   - Datentyp wird basierend auf Inhalt erkannt
   - Kann manuell angepasst werden

## Tastatursteuerung

- **Enter**: Nächste Zeile
- **Tab**: Nächste Spalte
- **Pfeiltasten**: Navigation
- **ESC**: Bearbeitung beenden
- **Buchstabe/Zahl**: Bearbeitung starten

## Technische Details

### Datenstruktur

```javascript
// Spalten
columns: [
  { id: 1, name: 'Spalte 1', type: 'string' },
  { id: 2, name: 'Datum', type: 'date' }
]

// Daten
data: [
  { id: 1, col_1: 'Wert 1', col_2: '2024-01-15' },
  { id: 2, col_1: 'Wert 2', col_2: '2024-01-16' }
]
```

### LocalStorage-Kommunikation

Daten werden zwischen ExcelViewer und NewTable über localStorage übertragen:

```javascript
localStorage.setItem('tableDataFromExcel', JSON.stringify({
  name: 'Tabellenname',
  columns: [...],
  data: [...]
}))
```

### Backend-Modell

```python
class DataTable(Base):
    __tablename__ = "data_tables"
    
    id = Column(Integer, primary_key=True)
    name = Column(String, nullable=False)
    columns = Column(JSON, nullable=False)
    data = Column(JSON, nullable=False)
    row_count = Column(Integer)
    column_count = Column(Integer)
    project_id = Column(Integer, ForeignKey("projects.id"))
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
```

## Navigation

- **Sidebar → Tabellen → Übersicht**: Alle gespeicherten Tabellen
- **Sidebar → Tabellen → Datentabelle**: Neue Tabelle erstellen
- **Sidebar → Tabellen → Excel Import**: Excel hochladen und umwandeln
