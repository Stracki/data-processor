from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import datetime

from database import get_db
from models import Procedure, ProcedureExecution
import schemas
from procedures import parse_function_signature, execute_procedure, extract_function_name, add_type_hints_to_code
from procedures.parser import validate_function_structure
from procedures.sandbox import validate_code
from procedure_examples import EXAMPLES

router = APIRouter(prefix="/api/procedures", tags=["procedures"])


@router.post("/validate", response_model=schemas.ProcedureParametersPreview)
def validate_procedure_code(
    procedure: schemas.ProcedureCreate,
    db: Session = Depends(get_db)
):
    """
    Validiert Code und gibt Parameter-Preview zurück
    Zeigt welche Parameter keine Type Hints haben
    """
    
    # Validiere Code-Struktur und extrahiere Namen
    is_valid, error_msg, func_name = validate_function_structure(procedure.code)
    if not is_valid:
        raise HTTPException(status_code=400, detail=f"Code-Validierung fehlgeschlagen: {error_msg}")
    
    # Validiere Sicherheit
    is_safe, error_msg = validate_code(procedure.code)
    if not is_safe:
        raise HTTPException(status_code=400, detail=f"Sicherheits-Validierung fehlgeschlagen: {error_msg}")
    
    # Parse Parameter
    try:
        parameters = parse_function_signature(procedure.code, func_name)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Fehler beim Parsen: {str(e)}")
    
    # Finde Parameter ohne Type Hints
    missing_types = [name for name, info in parameters.items() if info["type"] == "Any"]
    
    return schemas.ProcedureParametersPreview(
        function_name=func_name,
        parameters=parameters,
        missing_types=missing_types
    )


@router.post("/", response_model=schemas.Procedure, status_code=status.HTTP_201_CREATED)
def create_procedure(
    procedure: schemas.ProcedureCreate,
    db: Session = Depends(get_db)
):
    """Erstellt eine neue Prozedur (Version 1)"""
    
    # Validiere Code-Struktur und extrahiere Namen
    is_valid, error_msg, func_name = validate_function_structure(procedure.code)
    if not is_valid:
        raise HTTPException(status_code=400, detail=f"Code-Validierung fehlgeschlagen: {error_msg}")
    
    # Validiere Sicherheit
    is_safe, error_msg = validate_code(procedure.code)
    if not is_safe:
        raise HTTPException(status_code=400, detail=f"Sicherheits-Validierung fehlgeschlagen: {error_msg}")
    
    # Wenn parameter_types angegeben, füge Type Hints zum Code hinzu
    code_to_save = procedure.code
    if procedure.parameter_types:
        try:
            code_to_save = add_type_hints_to_code(procedure.code, procedure.parameter_types)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Fehler beim Hinzufügen von Type Hints: {str(e)}")
    
    # Prüfe ob Name bereits existiert
    existing = db.query(Procedure).filter(Procedure.name == func_name).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Prozedur mit Name '{func_name}' existiert bereits. Nutze POST /procedures/{func_name}/versions für neue Version.")
    
    # Erstelle neue Prozedur
    db_procedure = Procedure(
        name=func_name,
        version=1,
        code=code_to_save,
        description=procedure.description,
        parameter_types=procedure.parameter_types,
        is_active=True
    )
    
    db.add(db_procedure)
    db.commit()
    db.refresh(db_procedure)
    
    return db_procedure


@router.get("/", response_model=List[schemas.Procedure])
def list_procedures(
    active_only: bool = True,
    db: Session = Depends(get_db)
):
    """Listet alle Prozeduren (nur aktive Versionen standardmäßig)"""
    
    if active_only:
        # Nur aktive Versionen
        procedures = db.query(Procedure).filter(Procedure.is_active == True).all()
    else:
        # Alle Prozeduren
        procedures = db.query(Procedure).all()
    
    return procedures


@router.get("/{name}", response_model=schemas.Procedure)
def get_procedure(name: str, db: Session = Depends(get_db)):
    """Holt die aktive Version einer Prozedur"""
    
    procedure = db.query(Procedure).filter(
        Procedure.name == name,
        Procedure.is_active == True
    ).first()
    
    if not procedure:
        raise HTTPException(status_code=404, detail=f"Aktive Prozedur '{name}' nicht gefunden")
    
    return procedure


@router.get("/{name}/versions", response_model=List[schemas.Procedure])
def list_procedure_versions(name: str, db: Session = Depends(get_db)):
    """Listet alle Versionen einer Prozedur"""
    
    procedures = db.query(Procedure).filter(
        Procedure.name == name
    ).order_by(desc(Procedure.version)).all()
    
    if not procedures:
        raise HTTPException(status_code=404, detail=f"Prozedur '{name}' nicht gefunden")
    
    return procedures


@router.post("/{name}/versions", response_model=schemas.Procedure, status_code=status.HTTP_201_CREATED)
def create_procedure_version(
    name: str,
    procedure: schemas.ProcedureCreate,
    db: Session = Depends(get_db)
):
    """Erstellt eine neue Version einer existierenden Prozedur"""
    
    # Prüfe ob Prozedur existiert
    existing = db.query(Procedure).filter(Procedure.name == name).first()
    if not existing:
        raise HTTPException(status_code=404, detail=f"Prozedur '{name}' nicht gefunden")
    
    # Validiere Code und extrahiere Namen
    is_valid, error_msg, func_name = validate_function_structure(procedure.code)
    if not is_valid:
        raise HTTPException(status_code=400, detail=f"Code-Validierung fehlgeschlagen: {error_msg}")
    
    # Prüfe ob Funktionsname übereinstimmt
    if func_name != name:
        raise HTTPException(status_code=400, detail=f"Funktionsname '{func_name}' stimmt nicht mit Prozedurname '{name}' überein")
    
    is_safe, error_msg = validate_code(procedure.code)
    if not is_safe:
        raise HTTPException(status_code=400, detail=f"Sicherheits-Validierung fehlgeschlagen: {error_msg}")
    
    # Wenn parameter_types angegeben, füge Type Hints zum Code hinzu
    code_to_save = procedure.code
    if procedure.parameter_types:
        try:
            code_to_save = add_type_hints_to_code(procedure.code, procedure.parameter_types)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Fehler beim Hinzufügen von Type Hints: {str(e)}")
    
    # Finde höchste Version
    max_version = db.query(Procedure).filter(
        Procedure.name == name
    ).order_by(desc(Procedure.version)).first().version
    
    # Deaktiviere alte aktive Version
    db.query(Procedure).filter(
        Procedure.name == name,
        Procedure.is_active == True
    ).update({"is_active": False})
    
    # Erstelle neue Version
    new_procedure = Procedure(
        name=name,
        version=max_version + 1,
        code=code_to_save,
        description=procedure.description,
        parameter_types=procedure.parameter_types,
        is_active=True
    )
    
    db.add(new_procedure)
    db.commit()
    db.refresh(new_procedure)
    
    return new_procedure


@router.put("/{name}/activate/{version}", response_model=schemas.Procedure)
def activate_procedure_version(
    name: str,
    version: int,
    db: Session = Depends(get_db)
):
    """Aktiviert eine bestimmte Version einer Prozedur"""
    
    # Finde die Version
    procedure = db.query(Procedure).filter(
        Procedure.name == name,
        Procedure.version == version
    ).first()
    
    if not procedure:
        raise HTTPException(status_code=404, detail=f"Prozedur '{name}' Version {version} nicht gefunden")
    
    # Deaktiviere alle anderen Versionen
    db.query(Procedure).filter(
        Procedure.name == name,
        Procedure.is_active == True
    ).update({"is_active": False})
    
    # Aktiviere diese Version
    procedure.is_active = True
    db.commit()
    db.refresh(procedure)
    
    return procedure


@router.get("/{name}/schema", response_model=schemas.ProcedureSchema)
def get_procedure_schema(name: str, db: Session = Depends(get_db)):
    """Holt das Parameter-Schema einer Prozedur für UI-Generierung"""
    
    procedure = db.query(Procedure).filter(
        Procedure.name == name,
        Procedure.is_active == True
    ).first()
    
    if not procedure:
        raise HTTPException(status_code=404, detail=f"Aktive Prozedur '{name}' nicht gefunden")
    
    try:
        parameters = parse_function_signature(procedure.code, procedure.name)
        
        # Überschreibe Types mit gespeicherten parameter_types (falls vorhanden)
        if procedure.parameter_types:
            for param_name, param_type in procedure.parameter_types.items():
                if param_name in parameters:
                    parameters[param_name]["type"] = param_type
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Parsen der Funktion: {str(e)}")
    
    return schemas.ProcedureSchema(
        name=procedure.name,
        version=procedure.version,
        description=procedure.description,
        parameters=parameters
    )


@router.post("/{name}/execute", response_model=schemas.ProcedureExecutionResult)
def execute_procedure_endpoint(
    name: str,
    request: schemas.ProcedureExecuteRequest,
    db: Session = Depends(get_db)
):
    """Führt eine Prozedur aus"""
    
    # Hole aktive Prozedur
    procedure = db.query(Procedure).filter(
        Procedure.name == name,
        Procedure.is_active == True
    ).first()
    
    if not procedure:
        raise HTTPException(status_code=404, detail=f"Aktive Prozedur '{name}' nicht gefunden")
    
    # Führe aus
    try:
        execution = execute_procedure(
            procedure=procedure,
            params=request.parameters,
            db=db,
            project_id=request.project_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler bei Ausführung: {str(e)}")
    
    return execution


@router.get("/executions/", response_model=List[schemas.ProcedureExecutionResult])
def list_executions(
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Listet die letzten Prozedur-Ausführungen"""
    
    executions = db.query(ProcedureExecution).order_by(
        desc(ProcedureExecution.executed_at)
    ).limit(limit).all()
    
    return executions


@router.delete("/{procedure_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_procedure(procedure_id: int, db: Session = Depends(get_db)):
    """Löscht eine Prozedur (alle Versionen mit gleichem Namen)"""
    
    procedure = db.query(Procedure).filter(Procedure.id == procedure_id).first()
    if not procedure:
        raise HTTPException(status_code=404, detail="Prozedur nicht gefunden")
    
    # Lösche erst alle Executions die diese Prozedur referenzieren
    db.query(ProcedureExecution).filter(
        ProcedureExecution.procedure_id.in_(
            db.query(Procedure.id).filter(Procedure.name == procedure.name)
        )
    ).delete(synchronize_session=False)
    
    # Lösche alle Versionen mit gleichem Namen
    db.query(Procedure).filter(Procedure.name == procedure.name).delete()
    db.commit()
    
    return None


@router.get("/examples/", response_model=dict)
def get_procedure_examples():
    """Gibt Beispiel-Prozeduren zurück"""
    return EXAMPLES


@router.post("/{procedure_id}/copy", response_model=schemas.Procedure)
def copy_procedure_to_scope(
    procedure_id: int,
    copy_request: schemas.ProcedureCopyRequest,
    db: Session = Depends(get_db)
):
    """Kopiert eine Prozedur in einen anderen Scope (z.B. von Global zu Project)"""
    
    # Hole Original-Prozedur
    original = db.query(Procedure).filter(Procedure.id == procedure_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Prozedur nicht gefunden")
    
    # Prüfe ob bereits eine Kopie existiert
    existing = db.query(Procedure).filter(
        Procedure.name == original.name,
        Procedure.scope == copy_request.target_scope,
        Procedure.project_id == copy_request.target_project_id,
        Procedure.cycle_id == copy_request.target_cycle_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400, 
            detail=f"Prozedur '{original.name}' existiert bereits im Ziel-Scope"
        )
    
    # Erstelle Kopie
    copied_procedure = Procedure(
        name=original.name,
        version=1,  # Neue Version im neuen Scope
        code=original.code,
        description=original.description,
        parameter_types=original.parameter_types,
        scope=copy_request.target_scope,
        project_id=copy_request.target_project_id,
        cycle_id=copy_request.target_cycle_id,
        copied_from_id=original.id,
        is_active=True
    )
    
    db.add(copied_procedure)
    db.commit()
    db.refresh(copied_procedure)
    
    return copied_procedure


@router.get("/by-scope/", response_model=List[schemas.Procedure])
def list_procedures_by_scope(
    scope: str = None,
    project_id: int = None,
    cycle_id: int = None,
    include_global: bool = True,
    db: Session = Depends(get_db)
):
    """
    Listet Prozeduren nach Scope mit Namespace-Hierarchie
    - Global: immer verfügbar
    - Project: nur für das Projekt
    - Cycle: nur für den Zyklus
    """
    
    query = db.query(Procedure).filter(Procedure.is_active == True)
    
    procedures = []
    
    # Global-Prozeduren (immer verfügbar wenn include_global=True)
    if include_global:
        global_procs = query.filter(Procedure.scope == 'global').all()
        procedures.extend(global_procs)
    
    # Project-Prozeduren
    if project_id:
        project_procs = query.filter(
            Procedure.scope == 'project',
            Procedure.project_id == project_id
        ).all()
        procedures.extend(project_procs)
    
    # Cycle-Prozeduren
    if cycle_id:
        cycle_procs = query.filter(
            Procedure.scope == 'cycle',
            Procedure.cycle_id == cycle_id
        ).all()
        procedures.extend(cycle_procs)
    
    return procedures
