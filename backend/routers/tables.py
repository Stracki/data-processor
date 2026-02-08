from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import DataTable
from schemas import DataTable as DataTableSchema, DataTableCreate, DataTableUpdate

router = APIRouter(prefix="/tables", tags=["tables"])


@router.get("/", response_model=List[DataTableSchema])
def get_all_tables(db: Session = Depends(get_db)):
    """Alle Datentabellen abrufen"""
    tables = db.query(DataTable).order_by(DataTable.updated_at.desc()).all()
    return tables


@router.get("/{table_id}", response_model=DataTableSchema)
def get_table(table_id: int, db: Session = Depends(get_db)):
    """Eine spezifische Datentabelle abrufen"""
    table = db.query(DataTable).filter(DataTable.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Tabelle nicht gefunden")
    return table


@router.post("/", response_model=DataTableSchema)
def create_table(table_data: DataTableCreate, db: Session = Depends(get_db)):
    """Neue Datentabelle erstellen"""
    
    # Berechne Zeilen- und Spaltenanzahl
    row_count = len(table_data.data)
    column_count = len(table_data.columns)
    
    # Erstelle neue Tabelle
    new_table = DataTable(
        name=table_data.name,
        project_id=table_data.project_id,
        columns=table_data.columns,
        data=table_data.data,
        row_count=row_count,
        column_count=column_count
    )
    
    db.add(new_table)
    db.commit()
    db.refresh(new_table)
    
    return new_table


@router.put("/{table_id}", response_model=DataTableSchema)
def update_table(table_id: int, table_update: DataTableUpdate, db: Session = Depends(get_db)):
    """Datentabelle aktualisieren"""
    
    table = db.query(DataTable).filter(DataTable.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Tabelle nicht gefunden")
    
    # Aktualisiere Felder
    if table_update.name is not None:
        table.name = table_update.name
    
    if table_update.columns is not None:
        table.columns = table_update.columns
        table.column_count = len(table_update.columns)
    
    if table_update.data is not None:
        table.data = table_update.data
        table.row_count = len(table_update.data)
    
    db.commit()
    db.refresh(table)
    
    return table


@router.delete("/{table_id}")
def delete_table(table_id: int, db: Session = Depends(get_db)):
    """Datentabelle löschen"""
    
    table = db.query(DataTable).filter(DataTable.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Tabelle nicht gefunden")
    
    db.delete(table)
    db.commit()
    
    return {"message": f"Tabelle '{table.name}' wurde gelöscht"}


@router.get("/project/{project_id}", response_model=List[DataTableSchema])
def get_tables_by_project(project_id: int, db: Session = Depends(get_db)):
    """Alle Datentabellen eines Projekts abrufen"""
    tables = db.query(DataTable).filter(DataTable.project_id == project_id).order_by(DataTable.updated_at.desc()).all()
    return tables
