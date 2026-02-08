"""
Beispiel-Prozeduren für das Prozeduren-System
Diese können als Vorlagen verwendet werden
"""

# Beispiel 1: Spalte multiplizieren
MULTIPLY_COLUMN = """def multiply_column(tabelle, spalte: str, faktor: int = 2):
    \"\"\"
    Multipliziert eine Spalte mit einem Faktor
    \"\"\"
    if spalte not in tabelle.columns:
        raise ValueError(f"Spalte '{spalte}' nicht gefunden")
    
    tabelle[f'{spalte}_x{faktor}'] = tabelle[spalte] * faktor
    return tabelle"""

# Beispiel 2: Spalten kombinieren
COMBINE_COLUMNS = """def combine_columns(tabelle, spalte1: str, spalte2: str, separator: str = "_"):
    \"\"\"
    Kombiniert zwei Spalten mit einem Separator
    \"\"\"
    if spalte1 not in tabelle.columns:
        raise ValueError(f"Spalte '{spalte1}' nicht gefunden")
    if spalte2 not in tabelle.columns:
        raise ValueError(f"Spalte '{spalte2}' nicht gefunden")
    
    tabelle['combined'] = tabelle[spalte1].astype(str) + separator + tabelle[spalte2].astype(str)
    return tabelle"""

# Beispiel 3: Zeilen filtern
FILTER_ROWS = """def filter_rows(tabelle, spalte: str, min_wert: float):
    \"\"\"
    Filtert Zeilen basierend auf Mindestwert
    \"\"\"
    if spalte not in tabelle.columns:
        raise ValueError(f"Spalte '{spalte}' nicht gefunden")
    
    result = tabelle[tabelle[spalte] >= min_wert].reset_index(drop=True)
    return result"""

# Beispiel 4: Gruppieren und Aggregieren
GROUP_AND_SUM = """def group_and_sum(tabelle, group_spalte: str, sum_spalte: str):
    \"\"\"
    Gruppiert nach einer Spalte und summiert eine andere
    \"\"\"
    if group_spalte not in tabelle.columns:
        raise ValueError(f"Spalte '{group_spalte}' nicht gefunden")
    if sum_spalte not in tabelle.columns:
        raise ValueError(f"Spalte '{sum_spalte}' nicht gefunden")
    
    result = tabelle.groupby(group_spalte)[sum_spalte].sum().reset_index()
    return result"""

# Beispiel 5: Datum-Operationen
ADD_DATE_COLUMNS = """def add_date_columns(tabelle, datum_spalte: str):
    \"\"\"
    Fügt Jahr, Monat, Tag Spalten aus einer Datum-Spalte hinzu
    \"\"\"
    if datum_spalte not in tabelle.columns:
        raise ValueError(f"Spalte '{datum_spalte}' nicht gefunden")
    
    tabelle[datum_spalte] = pd.to_datetime(tabelle[datum_spalte])
    tabelle['jahr'] = tabelle[datum_spalte].dt.year
    tabelle['monat'] = tabelle[datum_spalte].dt.month
    tabelle['tag'] = tabelle[datum_spalte].dt.day
    tabelle['wochentag'] = tabelle[datum_spalte].dt.day_name()
    return tabelle"""

# Beispiel 6: Fehlende Werte behandeln
HANDLE_MISSING = """def handle_missing(tabelle, spalte: str, methode: str = "mean"):
    \"\"\"
    Behandelt fehlende Werte in einer Spalte
    methode: 'mean', 'median', 'zero', 'drop'
    \"\"\"
    if spalte not in tabelle.columns:
        raise ValueError(f"Spalte '{spalte}' nicht gefunden")
    
    if methode == "mean":
        tabelle[spalte].fillna(tabelle[spalte].mean(), inplace=True)
    elif methode == "median":
        tabelle[spalte].fillna(tabelle[spalte].median(), inplace=True)
    elif methode == "zero":
        tabelle[spalte].fillna(0, inplace=True)
    elif methode == "drop":
        tabelle = tabelle.dropna(subset=[spalte]).reset_index(drop=True)
    else:
        raise ValueError(f"Unbekannte Methode: {methode}")
    
    return tabelle"""

# Beispiel 7: Prozentuale Änderung
CALCULATE_CHANGE = """def calculate_change(tabelle, spalte: str):
    \"\"\"
    Berechnet die prozentuale Änderung zwischen aufeinanderfolgenden Zeilen
    \"\"\"
    if spalte not in tabelle.columns:
        raise ValueError(f"Spalte '{spalte}' nicht gefunden")
    
    tabelle[f'{spalte}_change'] = tabelle[spalte].pct_change() * 100
    return tabelle"""

# Beispiel 8: Normalisierung
NORMALIZE_COLUMN = """def normalize_column(tabelle, spalte: str):
    \"\"\"
    Normalisiert eine Spalte auf Bereich 0-1
    \"\"\"
    if spalte not in tabelle.columns:
        raise ValueError(f"Spalte '{spalte}' nicht gefunden")
    
    min_val = tabelle[spalte].min()
    max_val = tabelle[spalte].max()
    
    if max_val == min_val:
        tabelle[f'{spalte}_normalized'] = 0
    else:
        tabelle[f'{spalte}_normalized'] = (tabelle[spalte] - min_val) / (max_val - min_val)
    
    return tabelle"""

# Beispiel 9: Kategorisierung
CATEGORIZE_VALUES = """def categorize_values(tabelle, spalte: str, schwellwert: float):
    \"\"\"
    Kategorisiert Werte in 'niedrig', 'mittel', 'hoch'
    \"\"\"
    if spalte not in tabelle.columns:
        raise ValueError(f"Spalte '{spalte}' nicht gefunden")
    
    def categorize(value):
        if value < schwellwert * 0.5:
            return 'niedrig'
        elif value < schwellwert:
            return 'mittel'
        else:
            return 'hoch'
    
    tabelle[f'{spalte}_kategorie'] = tabelle[spalte].apply(categorize)
    return tabelle"""

# Beispiel 10: Duplikate entfernen
REMOVE_DUPLICATES = """def remove_duplicates(tabelle, spalte: str = None):
    \"\"\"
    Entfernt Duplikate basierend auf einer Spalte oder allen Spalten
    \"\"\"
    if spalte and spalte not in tabelle.columns:
        raise ValueError(f"Spalte '{spalte}' nicht gefunden")
    
    if spalte:
        result = tabelle.drop_duplicates(subset=[spalte]).reset_index(drop=True)
    else:
        result = tabelle.drop_duplicates().reset_index(drop=True)
    
    return result"""

# Dictionary für einfachen Zugriff
EXAMPLES = {
    "multiply_column": {
        "code": MULTIPLY_COLUMN,
        "description": "Multipliziert eine Spalte mit einem Faktor"
    },
    "combine_columns": {
        "code": COMBINE_COLUMNS,
        "description": "Kombiniert zwei Spalten mit einem Separator"
    },
    "filter_rows": {
        "code": FILTER_ROWS,
        "description": "Filtert Zeilen basierend auf Mindestwert"
    },
    "group_and_sum": {
        "code": GROUP_AND_SUM,
        "description": "Gruppiert und summiert Daten"
    },
    "add_date_columns": {
        "code": ADD_DATE_COLUMNS,
        "description": "Extrahiert Jahr, Monat, Tag aus Datum"
    },
    "handle_missing": {
        "code": HANDLE_MISSING,
        "description": "Behandelt fehlende Werte"
    },
    "calculate_change": {
        "code": CALCULATE_CHANGE,
        "description": "Berechnet prozentuale Änderung"
    },
    "normalize_column": {
        "code": NORMALIZE_COLUMN,
        "description": "Normalisiert Werte auf 0-1"
    },
    "categorize_values": {
        "code": CATEGORIZE_VALUES,
        "description": "Kategorisiert Werte in niedrig/mittel/hoch"
    },
    "remove_duplicates": {
        "code": REMOVE_DUPLICATES,
        "description": "Entfernt Duplikate"
    }
}
