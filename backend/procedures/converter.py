import pandas as pd
import re
from models import DataTable
from typing import Optional


def parse_currency(value) -> Optional[float]:
    """Parst Währungswerte (€, $, etc.) zu float"""
    if pd.isna(value) or value is None:
        return None
    
    if isinstance(value, (int, float)):
        return float(value)
    
    # Entferne Währungssymbole und Tausendertrennzeichen
    value_str = str(value).strip()
    # Entferne €, $, £, etc.
    value_str = re.sub(r'[€$£¥₹]', '', value_str)
    # Entferne Leerzeichen
    value_str = value_str.replace(' ', '')
    # Ersetze Komma durch Punkt (europäisches Format)
    value_str = value_str.replace(',', '.')
    
    try:
        return float(value_str)
    except (ValueError, AttributeError):
        return None


def datatable_to_dataframe(table: DataTable) -> pd.DataFrame:
    """Konvertiert DataTable zu pandas DataFrame mit korrekten Typen"""
    if not table.data:
        return pd.DataFrame()
    
    df = pd.DataFrame(table.data)
    
    # DEBUG: Vor der Konvertierung
    print("\n" + "="*80)
    print(f"DEBUG: DataTable '{table.name}' wird zu DataFrame konvertiert")
    print(f"Anzahl Zeilen: {len(df)}, Anzahl Spalten: {len(df.columns)}")
    print(f"Spalten im DataFrame: {list(df.columns)}")
    
    # Entferne 'id' Spalte falls vorhanden (interne DB-ID)
    if 'id' in df.columns:
        df = df.drop('id', axis=1)
    
    print("\nVOR Type-Konvertierung:")
    print(df.dtypes)
    print("\nErste 3 Zeilen:")
    print(df.head(3))
    
    # Prüfe ob Daten im alten Format (col_1, col_2) oder neuen Format (echte Namen) sind
    has_col_format = any(col.startswith('col_') for col in df.columns)
    
    # Verwende columns-Info für Umbenennung und Type-Konvertierung
    if table.columns:
        print("\nColumn-Info aus DB:")
        for col_info in table.columns:
            print(f"  ID {col_info['id']}: {col_info['name']} ({col_info.get('type', 'unknown')})")
        
        # Erstelle Mapping basierend auf Format
        rename_map = {}
        column_map = {}
        
        if has_col_format:
            # Altes Format: col_1 -> echter Name
            print("\nAltes Format erkannt (col_X), benenne um...")
            for col_info in table.columns:
                col_id = col_info['id']
                col_key = f"col_{col_id}"
                real_name = col_info['name']
                
                if col_key in df.columns:
                    rename_map[col_key] = real_name
                    column_map[real_name] = col_info
        else:
            # Neues Format: echte Namen bereits vorhanden
            print("\nNeues Format erkannt (echte Namen)")
            for col_info in table.columns:
                real_name = col_info['name']
                if real_name in df.columns:
                    column_map[real_name] = col_info
        
        # Benenne Spalten um (nur bei altem Format nötig)
        if rename_map:
            print(f"Benenne Spalten um: {rename_map}")
            df = df.rename(columns=rename_map)
        
        # Type-Konvertierung
        for col_name, col_info in column_map.items():
            col_type = col_info.get('type', 'string')
            
            try:
                # Unterstütze sowohl alte Backend-Namen als auch neue Frontend-Namen
                if col_type in ['integer', 'number']:
                    df[col_name] = pd.to_numeric(df[col_name], errors='coerce').astype('Int64')
                
                elif col_type in ['float', 'currency']:
                    # Bei currency: Parse Währungssymbole
                    if col_type == 'currency':
                        df[col_name] = df[col_name].apply(parse_currency)
                    else:
                        df[col_name] = pd.to_numeric(df[col_name], errors='coerce')
                
                elif col_type == 'boolean':
                    df[col_name] = df[col_name].astype(bool)
                
                elif col_type in ['datetime', 'date']:
                    df[col_name] = pd.to_datetime(df[col_name], errors='coerce')
                
                elif col_type == 'percent':
                    # Prozent als float speichern
                    df[col_name] = pd.to_numeric(df[col_name], errors='coerce')
                
                # string und time bleiben string (default)
                
            except Exception as e:
                # Bei Fehler: Spalte als string belassen
                print(f"Warnung: Konnte Spalte '{col_name}' nicht zu {col_type} konvertieren: {e}")
    
    # DEBUG: Nach der Konvertierung
    print("\nNACH Type-Konvertierung und Umbenennung:")
    print(df.dtypes)
    print("\nErste 3 Zeilen:")
    print(df.head(3))
    print("="*80 + "\n")
    
    return df


def infer_column_type(series: pd.Series, col_name: str = "") -> str:
    """Inferiert Spaltentyp aus pandas Series - verwendet Frontend-kompatible Type-Namen"""
    dtype = series.dtype
    
    # Prüfe auf Currency-Spalten (basierend auf Spaltennamen)
    currency_keywords = ['betrag', 'preis', 'kosten', 'währung', 'euro', 'dollar', 'gehalt', 'lohn']
    if any(keyword in col_name.lower() for keyword in currency_keywords):
        if pd.api.types.is_numeric_dtype(dtype):
            return "currency"
    
    if pd.api.types.is_integer_dtype(dtype):
        return "number"  # Frontend verwendet 'number' für Zahlen
    elif pd.api.types.is_float_dtype(dtype):
        return "number"  # Frontend verwendet 'number' für Zahlen
    elif pd.api.types.is_bool_dtype(dtype):
        return "string"  # Frontend hat keinen boolean-Type
    elif pd.api.types.is_datetime64_any_dtype(dtype):
        return "date"  # Frontend verwendet 'date' für Datum
    else:
        return "string"


def format_currency(value, symbol='€') -> str:
    """Formatiert einen Zahlenwert als Währung"""
    if pd.isna(value) or value is None:
        return ''
    return f"{value:,.2f} {symbol}".replace(',', 'X').replace('.', ',').replace('X', '.')


def dataframe_to_datatable(
    df: pd.DataFrame, 
    name: str, 
    project_id: Optional[int] = None
) -> DataTable:
    """Konvertiert pandas DataFrame zu DataTable"""
    
    print("\n" + "="*80)
    print(f"DEBUG: DataFrame wird zu DataTable '{name}' konvertiert")
    print(f"Anzahl Zeilen: {len(df)}, Anzahl Spalten: {len(df.columns)}")
    print(f"Spalten: {list(df.columns)}")
    print("\nDataFrame dtypes:")
    print(df.dtypes)
    print("\nErste 3 Zeilen:")
    print(df.head(3))
    
    # Columns definieren - verwende echte Spaltennamen
    columns = []
    for i, col in enumerate(df.columns):
        col_type = infer_column_type(df[col], col)  # Übergebe Spaltennamen für bessere Inferenz
        columns.append({
            "id": i + 1,
            "name": col,  # Echter Spaltenname
            "type": col_type
        })
    
    print("\nColumn-Definitionen:")
    for col in columns:
        print(f"  ID {col['id']}: {col['name']} ({col['type']})")
    
    # Data konvertieren
    # Konvertiere NaN/NaT zu None für JSON-Serialisierung
    df_clean = df.copy()
    for col in df_clean.columns:
        if pd.api.types.is_datetime64_any_dtype(df_clean[col]):
            # Konvertiere datetime zu String, NaT zu None
            df_clean[col] = df_clean[col].apply(
                lambda x: x.strftime('%Y-%m-%d %H:%M:%S') if pd.notna(x) else None
            )
        else:
            # Konvertiere NaN zu None
            df_clean[col] = df_clean[col].apply(
                lambda x: None if pd.isna(x) else x
            )
    
    # Konvertiere zu dict mit col_X als Keys (für Konsistenz mit bestehendem Format)
    data = []
    for idx, row in df_clean.iterrows():
        row_dict = {'id': int(idx) + 1}
        for i, col in enumerate(df_clean.columns):
            col_key = f"col_{i + 1}"
            value = row[col]
            # Zusätzliche Sicherheit: Konvertiere pandas-spezifische Types
            if pd.isna(value):
                value = None
            elif hasattr(value, 'item'):  # numpy types
                value = value.item()
            row_dict[col_key] = value
        data.append(row_dict)
    
    print(f"\nErste Zeile in data:")
    if data:
        print(data[0])
    
    print("="*80 + "\n")
    
    return DataTable(
        name=name,
        project_id=project_id,
        columns=columns,
        data=data,
        row_count=len(df),
        column_count=len(df.columns)
    )
