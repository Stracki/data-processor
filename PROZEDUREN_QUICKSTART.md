# Prozeduren - Quick Start

## Installation

### Backend

1. Dependencies installieren:
```bash
cd backend
pip install -r requirements.txt
```

2. Backend starten (erstellt automatisch DB-Tabellen):
```bash
uvicorn main:app --reload
```

### Frontend

Frontend sollte bereits laufen. Falls nicht:
```bash
cd frontend
npm install
npm run dev
```

## Erste Schritte

### 1. Prozedur erstellen

1. Navigiere zu "Tabellen" → "Prozeduren" in der Sidebar
2. Klicke auf "+ Neue Prozedur"
3. Schreibe den Code (der Funktionsname wird automatisch extrahiert):

```python
def multiply_column(tabelle, spalte: str, faktor: int = 2):
    """
    Multipliziert eine Spalte mit einem Faktor
    """
    if spalte not in tabelle.columns:
        raise ValueError(f"Spalte '{spalte}' nicht gefunden")
    
    tabelle[f'{spalte}_x{faktor}'] = tabelle[spalte] * faktor
    return tabelle
```

4. Optional: Füge eine Beschreibung hinzu
5. Klicke "Speichern"

**Wichtig:** Der Funktionsname im Code wird automatisch als Prozedurname verwendet!

### 2. Prozedur ausführen

1. Klicke auf "Ausführen" bei der Prozedur
2. **Wähle eine Tabelle aus dem Dropdown** (zeigt alle verfügbaren Tabellen mit Zeilenanzahl)
3. Gib die Parameter ein:
   - `spalte`: Name der zu multiplizierenden Spalte
   - `faktor`: Multiplikator (oder nutze Default: 2)
4. Klicke "Ausführen"
5. Die neue Tabelle wird automatisch erstellt

### 3. Neue Version erstellen

1. Klicke auf "Bearbeiten" bei einer Prozedur
2. Ändere den Code
3. Klicke "Speichern"
4. Eine neue Version wird erstellt und automatisch aktiviert

## Beispiel-Prozeduren

### Spalten kombinieren
```python
def combine_columns(tabelle, spalte1: str, spalte2: str, separator: str = "_"):
    """
    Kombiniert zwei Spalten mit einem Separator
    """
    tabelle['combined'] = tabelle[spalte1].astype(str) + separator + tabelle[spalte2].astype(str)
    return tabelle
```

### Filtern
```python
def filter_rows(tabelle, spalte: str, min_wert: float):
    """
    Filtert Zeilen basierend auf Mindestwert
    """
    return tabelle[tabelle[spalte] >= min_wert].reset_index(drop=True)
```

### Aggregieren
```python
def group_and_sum(tabelle, group_spalte: str, sum_spalte: str):
    """
    Gruppiert nach einer Spalte und summiert eine andere
    """
    result = tabelle.groupby(group_spalte)[sum_spalte].sum().reset_index()
    return result
```

### Datum-Operationen
```python
def add_date_columns(tabelle, datum_spalte: str):
    """
    Fügt Jahr, Monat, Tag Spalten hinzu
    """
    tabelle[datum_spalte] = pd.to_datetime(tabelle[datum_spalte])
    tabelle['jahr'] = tabelle[datum_spalte].dt.year
    tabelle['monat'] = tabelle[datum_spalte].dt.month
    tabelle['tag'] = tabelle[datum_spalte].dt.day
    return tabelle
```

## API Testing

Mit curl:
```bash
# Prozedur erstellen (Name wird aus Code extrahiert)
curl -X POST http://localhost:8000/api/procedures/ \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Test Prozedur",
    "code": "def test(tabelle):\n    return tabelle"
  }'

# Prozeduren auflisten
curl http://localhost:8000/api/procedures/

# Schema abrufen
curl http://localhost:8000/api/procedures/test/schema

# Ausführen
curl -X POST http://localhost:8000/api/procedures/test/execute \
  -H "Content-Type: application/json" \
  -d '{
    "parameters": {"tabelle": 1},
    "project_id": null
  }'
```

Mit Python (siehe `backend/test_procedures.py`):
```bash
cd backend
python test_procedures.py
```

## Troubleshooting

### "Funktionsname stimmt nicht überein"
- Bei neuen Versionen muss der Funktionsname im Code mit dem bestehenden Prozedurnamen übereinstimmen
- Der Funktionsname wird automatisch aus dem Code extrahiert

### "Keine Funktion im Code gefunden"
- Stelle sicher, dass dein Code eine `def` Funktion enthält
- Die Funktion muss auf oberster Ebene definiert sein (nicht nested)

### "Spalte nicht gefunden"
- Prüfe die Spaltennamen in deiner Tabelle
- Verwende `tabelle.columns` um alle Spalten zu sehen

### "Gefährliche Operation nicht erlaubt"
- Nur erlaubte Module: pandas, numpy, math, datetime
- Keine File I/O, Network Calls, etc.

### "Funktion muss DataFrame zurückgeben"
- Stelle sicher, dass deine Funktion `return tabelle` hat
- Der Return-Wert muss ein pandas DataFrame sein

## Nächste Schritte

- Erstelle komplexere Prozeduren mit mehreren Tabellen
- Nutze pandas-Funktionen für Datenmanipulation
- Experimentiere mit numpy für numerische Operationen
- Baue Prozedur-Pipelines (manuell mehrere Prozeduren nacheinander ausführen)
