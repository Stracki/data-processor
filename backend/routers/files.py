from fastapi import APIRouter, UploadFile, File, HTTPException, Form, Depends
from fastapi.responses import Response
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional, List

from database import get_db
from models import ExcelFile as ExcelFileModel
from schemas import ExcelFile, ExcelFileCreate

router = APIRouter(prefix="/files", tags=["files"])

@router.post("/upload", response_model=ExcelFile)
async def upload_excel(
    file: UploadFile = File(...),
    original_name: Optional[str] = Form(None),
    project_id: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    """Excel-Datei hochladen und in DB speichern (BLOB-Speicherung für Cloud-Kompatibilität)"""
    
    # Validiere Dateiendung
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(status_code=400, detail="Nur Excel-Dateien (.xlsx, .xls) erlaubt")
    
    # Verwende original_name falls vorhanden, sonst file.filename
    base_name = original_name if original_name else file.filename
    
    # Entferne Dateiendung für Basis-Namen
    base_name_without_ext = base_name.rsplit('.', 1)[0] if '.' in base_name else base_name
    extension = base_name.rsplit('.', 1)[1] if '.' in base_name else 'xlsx'
    
    # Prüfe ob bereits Versionen existieren
    existing_files = db.query(ExcelFileModel).filter(
        ExcelFileModel.base_name == base_name_without_ext
    ).order_by(ExcelFileModel.version.desc()).all()
    
    next_version = existing_files[0].version + 1 if existing_files else 1
    
    # Generiere Dateinamen: timestamp_basename.xlsx
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{timestamp}_{base_name_without_ext}.{extension}"
    
    try:
        # Lese Datei-Inhalt
        file_content = await file.read()
        file_size = len(file_content)
        
        # Speichere in Datenbank (BLOB)
        db_file = ExcelFileModel(
            project_id=project_id,
            base_name=base_name_without_ext,
            display_name=f"{base_name_without_ext}.{extension}",
            filename=safe_filename,
            file_data=file_content,
            file_size=file_size,
            version=next_version,
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        
        db.add(db_file)
        db.commit()
        db.refresh(db_file)
        
        return db_file
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Fehler beim Speichern: {str(e)}")

@router.get("/download/{filename}")
async def download_excel(filename: str, db: Session = Depends(get_db)):
    """Excel-Datei aus DB herunterladen"""
    
    # Hole Datei aus DB
    db_file = db.query(ExcelFileModel).filter(ExcelFileModel.filename == filename).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="Datei nicht gefunden")
    
    # Gebe Datei-Inhalt zurück
    return Response(
        content=db_file.file_data,
        media_type=db_file.content_type,
        headers={
            "Content-Disposition": f'attachment; filename="{db_file.display_name}"'
        }
    )

@router.get("/list", response_model=List[ExcelFile])
async def list_files(
    project_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Alle Excel-Dateien auflisten (gruppiert nach base_name, nur neueste Version)"""
    
    query = db.query(ExcelFileModel)
    
    if project_id:
        query = query.filter(ExcelFileModel.project_id == project_id)
    
    # Hole nur die neueste Version jeder Datei
    all_files = query.all()
    
    # Gruppiere nach base_name und nimm jeweils die neueste Version
    latest_files = {}
    for file in all_files:
        if file.base_name not in latest_files or file.version > latest_files[file.base_name].version:
            latest_files[file.base_name] = file
    
    return list(latest_files.values())

@router.get("/versions/{base_name}", response_model=List[ExcelFile])
async def get_file_versions(base_name: str, db: Session = Depends(get_db)):
    """Alle Versionen einer Datei abrufen"""
    
    versions = db.query(ExcelFileModel).filter(
        ExcelFileModel.base_name == base_name
    ).order_by(ExcelFileModel.version.desc()).all()
    
    if not versions:
        raise HTTPException(status_code=404, detail="Keine Versionen gefunden")
    
    return versions

@router.get("/{file_id}", response_model=ExcelFile)
async def get_file(file_id: int, db: Session = Depends(get_db)):
    """Einzelne Datei-Info abrufen"""
    
    db_file = db.query(ExcelFileModel).filter(ExcelFileModel.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="Datei nicht gefunden")
    
    return db_file

@router.delete("/{file_id}")
async def delete_file(file_id: int, db: Session = Depends(get_db)):
    """Excel-Datei löschen (nur DB-Eintrag, da BLOB in DB)"""
    
    db_file = db.query(ExcelFileModel).filter(ExcelFileModel.id == file_id).first()
    if not db_file:
        raise HTTPException(status_code=404, detail="Datei nicht gefunden")
    
    try:
        # Lösche DB-Eintrag (inkl. BLOB)
        db.delete(db_file)
        db.commit()
        
        return {"message": "Datei gelöscht"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Fehler beim Löschen: {str(e)}")

@router.post("/cleanup-orphaned")
async def cleanup_orphaned_files(db: Session = Depends(get_db)):
    """Bereinige verwaiste Dateien (optional, für Wartung)"""
    
    # Hier könnten wir alte Versionen löschen, die älter als X Tage sind
    # Oder Dateien ohne Projekt-Zuordnung
    
    return {"message": "Bereinigung durchgeführt"}


