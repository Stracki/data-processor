from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Workflow, WorkflowExecution, WorkflowInstance
import schemas
from schemas import (
    WorkflowCreate, WorkflowUpdate, Workflow as WorkflowSchema,
    WorkflowExecuteRequest, WorkflowExecutionResult,
    WorkflowInstanceCreate, WorkflowInstanceUpdate, WorkflowInstance as WorkflowInstanceSchema
)
import time
import json

router = APIRouter(prefix="/api/workflows", tags=["workflows"])


@router.get("/", response_model=List[WorkflowSchema])
def get_workflows(project_id: int = None, db: Session = Depends(get_db)):
    """Alle Workflows abrufen, optional gefiltert nach Projekt"""
    query = db.query(Workflow)
    if project_id:
        query = query.filter(Workflow.project_id == project_id)
    return query.all()


@router.get("/{workflow_id}", response_model=WorkflowSchema)
def get_workflow(workflow_id: int, db: Session = Depends(get_db)):
    """Einzelnen Workflow abrufen"""
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow nicht gefunden")
    return workflow


@router.post("/", response_model=WorkflowSchema)
def create_workflow(workflow: WorkflowCreate, db: Session = Depends(get_db)):
    """Neuen Workflow erstellen"""
    db_workflow = Workflow(
        name=workflow.name,
        description=workflow.description,
        project_id=workflow.project_id,
        graph=workflow.graph.dict()
    )
    db.add(db_workflow)
    db.commit()
    db.refresh(db_workflow)
    return db_workflow


@router.put("/{workflow_id}", response_model=WorkflowSchema)
def update_workflow(workflow_id: int, workflow: WorkflowUpdate, db: Session = Depends(get_db)):
    """Workflow aktualisieren"""
    db_workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not db_workflow:
        raise HTTPException(status_code=404, detail="Workflow nicht gefunden")
    
    if workflow.name is not None:
        db_workflow.name = workflow.name
    if workflow.description is not None:
        db_workflow.description = workflow.description
    if workflow.graph is not None:
        db_workflow.graph = workflow.graph.dict()
    if workflow.is_active is not None:
        db_workflow.is_active = workflow.is_active
    
    db.commit()
    db.refresh(db_workflow)
    return db_workflow


@router.delete("/{workflow_id}")
def delete_workflow(workflow_id: int, db: Session = Depends(get_db)):
    """Workflow löschen"""
    db_workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not db_workflow:
        raise HTTPException(status_code=404, detail="Workflow nicht gefunden")
    
    db.delete(db_workflow)
    db.commit()
    return {"message": "Workflow gelöscht"}


@router.post("/{workflow_id}/execute", response_model=WorkflowExecutionResult)
def execute_workflow(workflow_id: int, request: WorkflowExecuteRequest, db: Session = Depends(get_db)):
    """Workflow ausführen"""
    from workflows.executor import WorkflowExecutor
    
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow nicht gefunden")
    
    if not workflow.is_active:
        raise HTTPException(status_code=400, detail="Workflow ist nicht aktiv")
    
    start_time = time.time()
    
    # Execution Record erstellen
    execution = WorkflowExecution(
        workflow_id=workflow_id,
        project_id=request.project_id or workflow.project_id,
        input_params=request.input_params,
        status="running"
    )
    db.add(execution)
    db.commit()
    db.refresh(execution)
    
    try:
        # Workflow ausführen
        executor = WorkflowExecutor(db)
        result = executor.execute(workflow.graph, request.input_params)
        
        execution.status = "completed"
        execution.output_data = result["output"]
        execution.execution_log = result["log"]
        execution.execution_time = time.time() - start_time
        
    except Exception as e:
        execution.status = "failed"
        execution.error_message = str(e)
        execution.execution_time = time.time() - start_time
    
    db.commit()
    db.refresh(execution)
    return execution


@router.get("/{workflow_id}/executions", response_model=List[WorkflowExecutionResult])
def get_workflow_executions(workflow_id: int, db: Session = Depends(get_db)):
    """Alle Ausführungen eines Workflows abrufen"""
    executions = db.query(WorkflowExecution).filter(
        WorkflowExecution.workflow_id == workflow_id
    ).order_by(WorkflowExecution.executed_at.desc()).all()
    return executions


@router.get("/node-schema/{node_type}/{node_id}")
def get_node_schema(node_type: str, node_id: int, db: Session = Depends(get_db)):
    """
    Gibt das Schema eines Nodes zurück (Input/Output Handles)
    """
    from models import Procedure, DataTable
    from procedures.parser import parse_function_signature, extract_function_name
    
    if node_type == "procedure":
        procedure = db.query(Procedure).filter(Procedure.id == node_id).first()
        if not procedure:
            raise HTTPException(status_code=404, detail="Procedure not found")
        
        # Parse Parameter aus Code
        func_name = extract_function_name(procedure.code)
        params = parse_function_signature(procedure.code, func_name)
        
        # Erstelle Input-Handles
        inputs = []
        for param_name, param_info in params.items():
            inputs.append({
                "id": param_name,
                "label": param_name,
                "type": param_info["type"],
                "required": param_info["required"],
                "default": param_info["default"]
            })
        
        return {
            "inputs": inputs,
            "outputs": [{"id": "output", "label": "Result", "type": "Table"}]
        }
    
    elif node_type == "table":
        table = db.query(DataTable).filter(DataTable.id == node_id).first()
        if not table:
            raise HTTPException(status_code=404, detail="Table not found")
        
        return {
            "inputs": [],
            "outputs": [{"id": "output", "label": table.name, "type": "Table"}]
        }
    
    elif node_type == "value":
        return {
            "inputs": [],
            "outputs": [{"id": "output", "label": "Value", "type": "Any"}]
        }
    
    elif node_type == "output":
        return {
            "inputs": [{"id": "input", "label": "Input", "type": "Any", "required": True}],
            "outputs": []
        }
    
    elif node_type == "api":
        return {
            "inputs": [{"id": "params", "label": "Parameters", "type": "Any", "required": False}],
            "outputs": [{"id": "output", "label": "Response", "type": "Any"}]
        }
    
    else:
        raise HTTPException(status_code=400, detail="Unknown node type")


@router.post("/{workflow_id}/copy", response_model=WorkflowSchema)
def copy_workflow_to_scope(
    workflow_id: int,
    copy_request: schemas.WorkflowCopyRequest,
    db: Session = Depends(get_db)
):
    """Kopiert einen Workflow in einen anderen Scope (z.B. von Global zu Project)"""
    
    # Hole Original-Workflow
    original = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not original:
        raise HTTPException(status_code=404, detail="Workflow nicht gefunden")
    
    # Prüfe ob bereits eine Kopie existiert
    existing = db.query(Workflow).filter(
        Workflow.name == original.name,
        Workflow.scope == copy_request.target_scope,
        Workflow.project_id == copy_request.target_project_id,
        Workflow.cycle_id == copy_request.target_cycle_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400, 
            detail=f"Workflow '{original.name}' existiert bereits im Ziel-Scope"
        )
    
    # Erstelle Kopie
    copied_workflow = Workflow(
        name=original.name,
        description=original.description,
        graph=original.graph,
        scope=copy_request.target_scope,
        project_id=copy_request.target_project_id,
        cycle_id=copy_request.target_cycle_id,
        copied_from_id=original.id,
        is_active=True
    )
    
    db.add(copied_workflow)
    db.commit()
    db.refresh(copied_workflow)
    
    return copied_workflow


@router.get("/by-scope/", response_model=List[WorkflowSchema])
def list_workflows_by_scope(
    scope: str = None,
    project_id: int = None,
    cycle_id: int = None,
    include_global: bool = True,
    db: Session = Depends(get_db)
):
    """
    Listet Workflows nach Scope mit Namespace-Hierarchie
    - Global: immer verfügbar
    - Project: nur für das Projekt
    - Cycle: nur für den Zyklus
    """
    
    query = db.query(Workflow).filter(Workflow.is_active == True)
    
    workflows = []
    
    # Global-Workflows (immer verfügbar wenn include_global=True)
    if include_global:
        global_wfs = query.filter(Workflow.scope == 'global').all()
        workflows.extend(global_wfs)
    
    # Project-Workflows
    if project_id:
        project_wfs = query.filter(
            Workflow.scope == 'project',
            Workflow.project_id == project_id
        ).all()
        workflows.extend(project_wfs)
    
    # Cycle-Workflows
    if cycle_id:
        cycle_wfs = query.filter(
            Workflow.scope == 'cycle',
            Workflow.cycle_id == cycle_id
        ).all()
        workflows.extend(cycle_wfs)
    
    return workflows


# Workflow Instance Endpoints
@router.get("/{workflow_id}/instances", response_model=List[WorkflowInstanceSchema])
def get_workflow_instances(workflow_id: int, db: Session = Depends(get_db)):
    """Alle Instanzen eines Workflows abrufen (pro Zyklus)"""
    instances = db.query(WorkflowInstance).filter(
        WorkflowInstance.workflow_id == workflow_id
    ).all()
    return instances

@router.post("/{workflow_id}/instances", response_model=WorkflowInstanceSchema)
def create_workflow_instance(
    workflow_id: int, 
    instance: WorkflowInstanceCreate, 
    db: Session = Depends(get_db)
):
    """Workflow-Instanz für einen Zyklus erstellen"""
    # Prüfe ob Workflow existiert
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow nicht gefunden")
    
    # Prüfe ob bereits eine Instanz existiert
    existing = db.query(WorkflowInstance).filter(
        WorkflowInstance.workflow_id == workflow_id,
        WorkflowInstance.cycle_id == instance.cycle_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400, 
            detail="Workflow-Instanz für diesen Zyklus existiert bereits"
        )
    
    db_instance = WorkflowInstance(**instance.dict())
    db.add(db_instance)
    db.commit()
    db.refresh(db_instance)
    return db_instance

@router.put("/instances/{instance_id}", response_model=WorkflowInstanceSchema)
def update_workflow_instance(
    instance_id: int,
    instance: WorkflowInstanceUpdate,
    db: Session = Depends(get_db)
):
    """Workflow-Instanz aktualisieren (Parameter, Input-Mapping)"""
    db_instance = db.query(WorkflowInstance).filter(WorkflowInstance.id == instance_id).first()
    if not db_instance:
        raise HTTPException(status_code=404, detail="Workflow-Instanz nicht gefunden")
    
    update_data = instance.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_instance, key, value)
    
    db.commit()
    db.refresh(db_instance)
    return db_instance

@router.get("/instances/by-cycle/{cycle_id}", response_model=List[WorkflowInstanceSchema])
def get_cycle_workflow_instances(cycle_id: int, db: Session = Depends(get_db)):
    """Alle Workflow-Instanzen eines Zyklus abrufen"""
    instances = db.query(WorkflowInstance).filter(
        WorkflowInstance.cycle_id == cycle_id
    ).all()
    return instances
