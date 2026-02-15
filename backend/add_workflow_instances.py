"""
Migration: Fügt workflow_instances Tabelle hinzu
"""
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import SessionLocal

def main():
    print("=" * 60)
    print("Füge workflow_instances Tabelle hinzu")
    print("=" * 60)
    print()
    
    db = SessionLocal()
    
    try:
        # Erstelle workflow_instances Tabelle
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS workflow_instances (
                id SERIAL PRIMARY KEY,
                workflow_id INTEGER NOT NULL REFERENCES workflows(id),
                cycle_id INTEGER NOT NULL REFERENCES project_cycles(id),
                parameters JSON,
                input_mapping JSON,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE,
                UNIQUE(workflow_id, cycle_id)
            )
        """))
        
        # Füge cycle_id zu workflow_executions hinzu falls nicht vorhanden
        try:
            db.execute(text("""
                ALTER TABLE workflow_executions 
                ADD COLUMN IF NOT EXISTS cycle_id INTEGER REFERENCES project_cycles(id)
            """))
            print("  ✓ cycle_id zu workflow_executions hinzugefügt")
        except:
            print("  - cycle_id existiert bereits in workflow_executions")
        
        db.commit()
        
        print("✓ workflow_instances Tabelle erstellt")
        print()
        print("=" * 60)
        print("✓ Migration abgeschlossen!")
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
