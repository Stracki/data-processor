"""
Erstellt ein Testprojekt und verschiebt bestehende Ressourcen dorthin
"""
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import SessionLocal
from models import Project

def main():
    print("=" * 60)
    print("Erstelle Testprojekt und verschiebe Ressourcen")
    print("=" * 60)
    print()
    
    db = SessionLocal()
    
    try:
        # Prüfe ob Testprojekt bereits existiert
        test_project = db.query(Project).filter(
            Project.name == "Testprojekt",
            Project.is_global == False
        ).first()
        
        if not test_project:
            print("Erstelle Testprojekt...")
            test_project = Project(
                name="Testprojekt",
                description="Test- und Entwicklungsprojekt",
                is_global=False,
                cycle_config={
                    "cycleType": "yearly",
                    "cyclePattern": "Jahr_{year}",
                    "subfolders": ["01_Eingangsdaten", "02_Verarbeitung", "03_Ausgabe", "04_Archiv"],
                    "autoCreateSubfolders": True
                },
                project_metadata={}
            )
            db.add(test_project)
            db.commit()
            db.refresh(test_project)
            print(f"✓ Testprojekt erstellt (ID={test_project.id})")
        else:
            print(f"✓ Testprojekt existiert bereits (ID={test_project.id})")
        
        print()
        
        # Verschiebe Prozeduren von Global zu Testprojekt
        result = db.execute(text(f"""
            UPDATE procedures 
            SET project_id = {test_project.id}, scope = 'project'
            WHERE scope = 'global'
        """))
        procedures_count = result.rowcount
        
        # Verschiebe Workflows von Global zu Testprojekt
        result = db.execute(text(f"""
            UPDATE workflows 
            SET project_id = {test_project.id}, scope = 'project'
            WHERE scope = 'global'
        """))
        workflows_count = result.rowcount
        
        # Verschiebe Datentabellen zu Testprojekt
        result = db.execute(text(f"""
            UPDATE data_tables 
            SET project_id = {test_project.id}
            WHERE project_id IS NULL OR project_id = (SELECT id FROM projects WHERE is_global = true LIMIT 1)
        """))
        tables_count = result.rowcount
        
        db.commit()
        
        print(f"✓ {procedures_count} Prozeduren ins Testprojekt verschoben")
        print(f"✓ {workflows_count} Workflows ins Testprojekt verschoben")
        print(f"✓ {tables_count} Datentabellen ins Testprojekt verschoben")
        print()
        print("=" * 60)
        print("✓ Verschiebung abgeschlossen!")
        print("=" * 60)
        print()
        print("Alle bestehenden Ressourcen sind jetzt im Testprojekt.")
        print("Das Global-Projekt ist leer und bereit für globale Ressourcen.")
        
    except Exception as e:
        print(f"\n✗ Fehler: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
