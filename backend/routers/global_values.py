from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import GlobalValue
from schemas import GlobalValue as GlobalValueSchema, GlobalValueCreate, GlobalValueUpdate

router = APIRouter(prefix="/global-values", tags=["global-values"])

@router.get("/", response_model=List[GlobalValueSchema])
def get_global_values(category: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(GlobalValue)
    if category:
        query = query.filter(GlobalValue.category == category)
    return query.all()

@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    """Gibt alle verfügbaren Kategorien zurück"""
    categories = db.query(GlobalValue.category).distinct().all()
    return [cat[0] for cat in categories if cat[0]]

@router.get("/{key}", response_model=GlobalValueSchema)
def get_global_value(key: str, db: Session = Depends(get_db)):
    value = db.query(GlobalValue).filter(GlobalValue.key == key).first()
    if not value:
        raise HTTPException(status_code=404, detail=f"Global value '{key}' nicht gefunden")
    return value

@router.post("/", response_model=GlobalValueSchema)
def create_global_value(value: GlobalValueCreate, db: Session = Depends(get_db)):
    # Prüfen ob Key bereits existiert
    existing = db.query(GlobalValue).filter(GlobalValue.key == value.key).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Global value '{value.key}' existiert bereits")
    
    db_value = GlobalValue(**value.dict())
    db.add(db_value)
    db.commit()
    db.refresh(db_value)
    return db_value

@router.put("/{key}", response_model=GlobalValueSchema)
def update_global_value(key: str, value: GlobalValueUpdate, db: Session = Depends(get_db)):
    db_value = db.query(GlobalValue).filter(GlobalValue.key == key).first()
    if not db_value:
        raise HTTPException(status_code=404, detail=f"Global value '{key}' nicht gefunden")
    
    update_data = value.dict(exclude_unset=True)
    for field, val in update_data.items():
        setattr(db_value, field, val)
    
    db.commit()
    db.refresh(db_value)
    return db_value

@router.delete("/{key}")
def delete_global_value(key: str, db: Session = Depends(get_db)):
    db_value = db.query(GlobalValue).filter(GlobalValue.key == key).first()
    if not db_value:
        raise HTTPException(status_code=404, detail=f"Global value '{key}' nicht gefunden")
    
    db.delete(db_value)
    db.commit()
    return {"message": f"Global value '{key}' gelöscht"}
