from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Project, ProjectCycle
from schemas import (
    Project as ProjectSchema, 
    ProjectCreate, 
    ProjectUpdate,
    ProjectCycle as ProjectCycleSchema,
    ProjectCycleCreate
)
from datetime import datetime

router = APIRouter(prefix="/projects", tags=["projects"])

@router.get("/", response_model=List[ProjectSchema])
def get_projects(db: Session = Depends(get_db)):
    projects = db.query(Project).all()
    return projects

@router.get("/{project_id}", response_model=ProjectSchema)
def get_project(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projekt nicht gefunden")
    return project

@router.post("/", response_model=ProjectSchema)
def create_project(project: ProjectCreate, db: Session = Depends(get_db)):
    # Prüfen ob Global-Projekt bereits existiert
    if project.is_global:
        existing_global = db.query(Project).filter(Project.is_global == True).first()
        if existing_global:
            raise HTTPException(status_code=400, detail="Global-Projekt existiert bereits")
    
    # Standard Cycle Config wenn nicht angegeben
    if not project.cycle_config and not project.is_global:
        project.cycle_config = {
            "cycleType": "yearly",
            "cyclePattern": "Jahr_{year}",
            "subfolders": ["Input", "Konfiguration", "Output"],
            "autoCreateSubfolders": True
        }
    
    db_project = Project(**project.dict())
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project

@router.put("/{project_id}", response_model=ProjectSchema)
def update_project(project_id: int, project: ProjectUpdate, db: Session = Depends(get_db)):
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Projekt nicht gefunden")
    
    update_data = project.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_project, key, value)
    
    db.commit()
    db.refresh(db_project)
    return db_project

@router.delete("/{project_id}")
def delete_project(project_id: int, db: Session = Depends(get_db)):
    db_project = db.query(Project).filter(Project.id == project_id).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Projekt nicht gefunden")
    
    if db_project.is_global:
        raise HTTPException(status_code=400, detail="Global-Projekt kann nicht gelöscht werden")
    
    db.delete(db_project)
    db.commit()
    return {"message": "Projekt gelöscht"}


# Cycle Management
@router.get("/{project_id}/cycles", response_model=List[ProjectCycleSchema])
def get_project_cycles(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projekt nicht gefunden")
    
    cycles = db.query(ProjectCycle).filter(ProjectCycle.project_id == project_id).all()
    return cycles

@router.post("/{project_id}/cycles", response_model=ProjectCycleSchema)
def create_cycle(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Projekt nicht gefunden")
    
    if not project.cycle_config:
        raise HTTPException(status_code=400, detail="Projekt hat keine Zyklen-Konfiguration")
    
    # Nächsten Zyklus berechnen
    existing_cycles = db.query(ProjectCycle).filter(ProjectCycle.project_id == project_id).all()
    
    cycle_pattern = project.cycle_config.get("cyclePattern", "Jahr_{year}")
    cycle_type = project.cycle_config.get("cycleType", "yearly")
    
    # Aktuelles Jahr oder höchstes Jahr aus existierenden Zyklen
    current_year = datetime.now().year
    if existing_cycles:
        # Extrahiere Jahr aus letztem Zyklus
        last_cycle_name = existing_cycles[-1].name
        try:
            # Versuche Jahr zu extrahieren (z.B. "Jahr_2024" -> 2024)
            year_str = last_cycle_name.split("_")[-1]
            last_year = int(year_str)
            current_year = last_year + 1
        except:
            current_year = datetime.now().year
    
    # Neuen Zyklus-Namen generieren
    new_cycle_name = cycle_pattern.replace("{year}", str(current_year))
    
    # Prüfen ob Zyklus bereits existiert
    existing = db.query(ProjectCycle).filter(
        ProjectCycle.project_id == project_id,
        ProjectCycle.name == new_cycle_name
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Zyklus {new_cycle_name} existiert bereits")
    
    # Pfad generieren
    path = f"/{project.name}/{new_cycle_name}"
    
    db_cycle = ProjectCycle(
        project_id=project_id,
        name=new_cycle_name,
        path=path,
        cycle_metadata={"subfolders": project.cycle_config.get("subfolders", [])}
    )
    db.add(db_cycle)
    db.commit()
    db.refresh(db_cycle)
    return db_cycle

@router.delete("/{project_id}/cycles/{cycle_id}")
def delete_cycle(project_id: int, cycle_id: int, db: Session = Depends(get_db)):
    cycle = db.query(ProjectCycle).filter(
        ProjectCycle.id == cycle_id,
        ProjectCycle.project_id == project_id
    ).first()
    if not cycle:
        raise HTTPException(status_code=404, detail="Zyklus nicht gefunden")
    
    db.delete(cycle)
    db.commit()
    return {"message": "Zyklus gelöscht"}
