import time
from datetime import datetime
from sqlalchemy.orm import Session
from typing import Dict, Any
import pandas as pd

from models import Procedure, ProcedureExecution, DataTable
from .sandbox import create_safe_namespace, validate_code
from .parser import parse_function_signature
from .converter import datatable_to_dataframe, dataframe_to_datatable


class ProcedureExecutionError(Exception):
    """Custom Exception für Prozedur-Ausführungsfehler"""
    pass


def prepare_parameters(params: Dict[str, Any], param_schema: Dict[str, Dict], db: Session) -> Dict[str, Any]:
    """
    Bereitet Parameter für Funktion vor
    Konvertiert Table-IDs zu DataFrames
    """
    prepared = {}
    
    for param_name, param_value in params.items():
        if param_name not in param_schema:
            continue
            
        param_type = param_schema[param_name]["type"]
        
        # Table → DataFrame
        if param_type == "Table":
            table = db.query(DataTable).filter(DataTable.id == param_value).first()
            if not table:
                raise ProcedureExecutionError(f"Tabelle mit ID {param_value} nicht gefunden")
            prepared[param_name] = datatable_to_dataframe(table)
        
        # List[Table] → List[DataFrame]
        elif param_type == "List[Table]":
            if not isinstance(param_value, list):
                raise ProcedureExecutionError(f"Parameter {param_name} muss eine Liste sein")
            
            dataframes = []
            for table_id in param_value:
                table = db.query(DataTable).filter(DataTable.id == table_id).first()
                if not table:
                    raise ProcedureExecutionError(f"Tabelle mit ID {table_id} nicht gefunden")
                dataframes.append(datatable_to_dataframe(table))
            prepared[param_name] = dataframes
        
        # Andere Typen direkt übernehmen
        else:
            prepared[param_name] = param_value
    
    return prepared


def execute_procedure(
    procedure: Procedure,
    params: Dict[str, Any],
    db: Session,
    project_id: int = None,
    timeout: int = 30
) -> ProcedureExecution:
    """
    Führt eine Prozedur aus
    
    Args:
        procedure: Procedure-Objekt
        params: Parameter-Dict {"param_name": value}
        db: Database Session
        project_id: Optional Project ID
        timeout: Timeout in Sekunden
    
    Returns:
        ProcedureExecution-Objekt mit Ergebnis
    """
    
    start_time = time.time()
    execution = ProcedureExecution(
        procedure_id=procedure.id,
        project_id=project_id,
        input_params=params,
        status="running"
    )
    
    try:
        # 1. Code validieren
        is_valid, error_msg = validate_code(procedure.code)
        if not is_valid:
            raise ProcedureExecutionError(error_msg)
        
        # 2. Parameter-Schema extrahieren
        param_schema = parse_function_signature(procedure.code, procedure.name)
        
        # Überschreibe Types mit gespeicherten parameter_types (falls vorhanden)
        if procedure.parameter_types:
            for param_name, param_type in procedure.parameter_types.items():
                if param_name in param_schema:
                    param_schema[param_name]["type"] = param_type
        
        # 3. Parameter vorbereiten
        prepared_params = prepare_parameters(params, param_schema, db)
        
        # 4. Namespace erstellen
        namespace = create_safe_namespace()
        
        # 5. Code ausführen
        exec(procedure.code, namespace)
        
        # 6. Funktion holen
        if procedure.name not in namespace:
            raise ProcedureExecutionError(f"Funktion '{procedure.name}' nicht im Code gefunden")
        
        func = namespace[procedure.name]
        
        # 7. Funktion aufrufen
        result = func(**prepared_params)
        
        # DEBUG: Ergebnis der Funktion
        print("\n" + "="*80)
        print("DEBUG: Ergebnis nach Prozedur-Ausführung")
        print(f"Type: {type(result)}")
        print(f"Shape: {result.shape if isinstance(result, pd.DataFrame) else 'N/A'}")
        if isinstance(result, pd.DataFrame):
            print(f"Spalten: {list(result.columns)}")
            print(f"Dtypes:\n{result.dtypes}")
            print(f"\nErste 3 Zeilen:\n{result.head(3)}")
        print("="*80 + "\n")
        
        # 8. Ergebnis validieren
        if not isinstance(result, pd.DataFrame):
            raise ProcedureExecutionError(
                f"Funktion muss pandas DataFrame zurückgeben, nicht {type(result).__name__}"
            )
        
        # 9. Ergebnis als neue Tabelle speichern
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        result_name = f"{procedure.name}_v{procedure.version}_{timestamp}"
        
        result_table = dataframe_to_datatable(result, result_name, project_id)
        db.add(result_table)
        db.flush()  # Um ID zu bekommen
        
        # 10. Execution erfolgreich
        execution.status = "success"
        execution.output_table_id = result_table.id
        execution.execution_time = time.time() - start_time
        
    except Exception as e:
        # Fehler behandeln
        execution.status = "error"
        execution.error_message = str(e)
        execution.execution_time = time.time() - start_time
    
    # Execution speichern
    db.add(execution)
    db.commit()
    db.refresh(execution)
    
    return execution
