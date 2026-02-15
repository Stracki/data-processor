"""
Ordnet bestehende Prozeduren und Workflows dem Global-Projekt zu
"""
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import SessionLocal
from models import Project

def main():
    print("=" * 60)
    print("Ordne bestehende Ressourcen dem Global-Projekt zu")
    print("=" * 60)
    print()
    
    db = SessionLocal()
    
    try:
        # Hole Global-Projekt
        global_project = db.query(Project).filter(Project.is_global == True).first()
        
        if not global_project:
            print("✗ Global-Projekt nicht gefunden!")
            print("Bitte führe zuerst 'python init_global.py' aus")
            return
        
        print(f"Global-Projekt gefunden: ID={global_project.id}")
        print()
        
        # Ordne Prozeduren ohne project_id dem Global-Projekt zu
        result = db.execute(text(f"""
            UPDATE procedures 
            SET project_id = {global_project.id}, scope = 'global'
            WHERE project_id IS NULL
        """))
        procedures_count = result.rowcount
        
        # Ordne Workflows ohne project_id dem Global-Projekt zu
        result = db.execute(text(f"""
            UPDATE workflows 
            SET project_id = {global_project.id}, scope = 'global'
            WHERE project_id IS NULL
        """))
        workflows_count = result.rowcount
        
        db.commit()
        
        print(f"✓ {procedures_count} Prozeduren dem Global-Projekt zugeordnet")
        print(f"✓ {workflows_count} Workflows dem Global-Projekt zugeordnet")
        print()
        print("=" * 60)
        print("✓ Zuordnung abgeschlossen!")
        print("=" * 60)
        print()
        print("Diese Ressourcen sind jetzt global verfügbar.")
        print("Du kannst sie in anderen Projekten kopieren und anpassen.")
        
    except Exception as e:
        print(f"\n✗ Fehler: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    main()
