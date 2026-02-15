"""
Aktualisiert die Subfolder-Konfiguration in bestehenden Projekten
"""
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import SessionLocal

def main():
    print("=" * 60)
    print("Aktualisiere Subfolder-Konfiguration")
    print("=" * 60)
    print()
    
    db = SessionLocal()
    
    try:
        # Hole alle Projekte
        from models import Project
        projects = db.query(Project).filter(Project.is_global == False).all()
        
        updated_count = 0
        for project in projects:
            if project.cycle_config:
                project.cycle_config['subfolders'] = ["Input", "Konfiguration", "Output"]
                updated_count += 1
        
        db.commit()
        
        print(f"✓ {updated_count} Projekte aktualisiert")
        
        db.commit()
        
        print()
        print("=" * 60)
        print("✓ Aktualisierung abgeschlossen!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ Fehler: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
