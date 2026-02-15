"""
Migrations-Script für das neue Projekt-System
Macht bestehende Daten kompatibel mit der neuen Struktur
"""
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import SessionLocal, engine
from models import Project, Procedure, Workflow
import sys

def check_columns_exist(db: Session):
    """Prüft ob die neuen Spalten bereits existieren"""
    try:
        # Versuche neue Spalten abzufragen
        result = db.execute(text("SELECT is_global FROM projects LIMIT 1"))
        return True
    except Exception as e:
        return False

def add_missing_columns(db: Session):
    """Fügt fehlende Spalten hinzu wenn sie nicht existieren"""
    print("Prüfe und füge fehlende Spalten hinzu...")
    
    try:
        # Projects Tabelle
        try:
            db.execute(text("ALTER TABLE projects ADD COLUMN is_global BOOLEAN DEFAULT FALSE"))
            print("  ✓ Spalte 'is_global' hinzugefügt")
        except:
            print("  - Spalte 'is_global' existiert bereits")
        
        try:
            db.execute(text("ALTER TABLE projects ADD COLUMN cycle_config JSON"))
            print("  ✓ Spalte 'cycle_config' hinzugefügt")
        except:
            print("  - Spalte 'cycle_config' existiert bereits")
        
        try:
            db.execute(text("ALTER TABLE projects ADD COLUMN project_metadata JSON"))
            print("  ✓ Spalte 'project_metadata' hinzugefügt")
        except:
            print("  - Spalte 'project_metadata' existiert bereits")
        
        # Procedures Tabelle
        try:
            db.execute(text("ALTER TABLE procedures ADD COLUMN scope VARCHAR DEFAULT 'project'"))
            print("  ✓ Spalte 'scope' in procedures hinzugefügt")
        except:
            print("  - Spalte 'scope' in procedures existiert bereits")
        
        try:
            db.execute(text("ALTER TABLE procedures ADD COLUMN project_id INTEGER"))
            print("  ✓ Spalte 'project_id' in procedures hinzugefügt")
        except:
            print("  - Spalte 'project_id' in procedures existiert bereits")
        
        try:
            db.execute(text("ALTER TABLE procedures ADD COLUMN cycle_id INTEGER"))
            print("  ✓ Spalte 'cycle_id' in procedures hinzugefügt")
        except:
            print("  - Spalte 'cycle_id' in procedures existiert bereits")
        
        try:
            db.execute(text("ALTER TABLE procedures ADD COLUMN copied_from_id INTEGER"))
            print("  ✓ Spalte 'copied_from_id' in procedures hinzugefügt")
        except:
            print("  - Spalte 'copied_from_id' in procedures existiert bereits")
        
        # Workflows Tabelle
        try:
            db.execute(text("ALTER TABLE workflows ADD COLUMN scope VARCHAR DEFAULT 'project'"))
            print("  ✓ Spalte 'scope' in workflows hinzugefügt")
        except:
            print("  - Spalte 'scope' in workflows existiert bereits")
        
        try:
            db.execute(text("ALTER TABLE workflows ADD COLUMN project_id INTEGER"))
            print("  ✓ Spalte 'project_id' in workflows hinzugefügt")
        except:
            print("  - Spalte 'project_id' in workflows existiert bereits")
        
        try:
            db.execute(text("ALTER TABLE workflows ADD COLUMN cycle_id INTEGER"))
            print("  ✓ Spalte 'cycle_id' in workflows hinzugefügt")
        except:
            print("  - Spalte 'cycle_id' in workflows existiert bereits")
        
        try:
            db.execute(text("ALTER TABLE workflows ADD COLUMN copied_from_id INTEGER"))
            print("  ✓ Spalte 'copied_from_id' in workflows hinzugefügt")
        except:
            print("  - Spalte 'copied_from_id' in workflows existiert bereits")
        
        db.commit()
        print("✓ Spalten-Migration abgeschlossen\n")
        
    except Exception as e:
        print(f"✗ Fehler bei Spalten-Migration: {e}")
        db.rollback()
        return False
    
    return True

def create_project_cycles_table(db: Session):
    """Erstellt die project_cycles Tabelle wenn sie nicht existiert"""
    try:
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS project_cycles (
                id SERIAL PRIMARY KEY,
                project_id INTEGER NOT NULL REFERENCES projects(id),
                name VARCHAR NOT NULL,
                path VARCHAR NOT NULL,
                cycle_metadata JSON,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(project_id, name)
            )
        """))
        db.commit()
        print("✓ Tabelle 'project_cycles' erstellt/geprüft")
    except Exception as e:
        print(f"✗ Fehler bei project_cycles: {e}")
        db.rollback()

def create_global_values_table(db: Session):
    """Erstellt die global_values Tabelle wenn sie nicht existiert"""
    try:
        db.execute(text("""
            CREATE TABLE IF NOT EXISTS global_values (
                id SERIAL PRIMARY KEY,
                key VARCHAR NOT NULL UNIQUE,
                value JSON NOT NULL,
                value_type VARCHAR NOT NULL,
                category VARCHAR,
                description VARCHAR,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE
            )
        """))
        db.commit()
        print("✓ Tabelle 'global_values' erstellt/geprüft")
    except Exception as e:
        print(f"✗ Fehler bei global_values: {e}")
        db.rollback()

def migrate_existing_data(db: Session):
    """Migriert bestehende Daten"""
    print("\nMigriere bestehende Daten...")
    
    try:
        # Setze scope für bestehende Procedures ohne scope
        result = db.execute(text("""
            UPDATE procedures 
            SET scope = 'project' 
            WHERE scope IS NULL
        """))
        if result.rowcount > 0:
            print(f"  ✓ {result.rowcount} Prozeduren auf scope='project' gesetzt")
        
        # Setze scope für bestehende Workflows ohne scope
        result = db.execute(text("""
            UPDATE workflows 
            SET scope = 'project' 
            WHERE scope IS NULL
        """))
        if result.rowcount > 0:
            print(f"  ✓ {result.rowcount} Workflows auf scope='project' gesetzt")
        
        db.commit()
        print("✓ Daten-Migration abgeschlossen\n")
        
    except Exception as e:
        print(f"✗ Fehler bei Daten-Migration: {e}")
        db.rollback()
        return False
    
    return True

def drop_old_constraints(db: Session):
    """Entfernt alte Constraints die Probleme machen könnten"""
    print("Entferne alte Constraints...")
    
    try:
        # Entferne alten unique constraint von procedures
        try:
            db.execute(text("ALTER TABLE procedures DROP CONSTRAINT IF EXISTS uq_procedure_name_version"))
            print("  ✓ Alter constraint 'uq_procedure_name_version' entfernt")
        except:
            print("  - Constraint existiert nicht")
        
        db.commit()
        print("✓ Constraints bereinigt\n")
        
    except Exception as e:
        print(f"✗ Fehler beim Entfernen von Constraints: {e}")
        db.rollback()

def main():
    """Hauptfunktion"""
    print("=" * 60)
    print("Migration zum Projekt-System")
    print("=" * 60)
    print()
    
    db = SessionLocal()
    
    try:
        # 1. Füge fehlende Spalten hinzu
        if not add_missing_columns(db):
            print("\n✗ Migration fehlgeschlagen bei Spalten")
            sys.exit(1)
        
        # 2. Erstelle neue Tabellen
        create_project_cycles_table(db)
        create_global_values_table(db)
        
        # 3. Entferne alte Constraints
        drop_old_constraints(db)
        
        # 4. Migriere bestehende Daten
        if not migrate_existing_data(db):
            print("\n✗ Migration fehlgeschlagen bei Daten")
            sys.exit(1)
        
        print("=" * 60)
        print("✓ Migration erfolgreich abgeschlossen!")
        print("=" * 60)
        print()
        print("Nächste Schritte:")
        print("1. Starte das Backend neu")
        print("2. Führe 'python init_global.py' aus")
        print("3. Öffne die Anwendung im Browser")
        
    except Exception as e:
        print(f"\n✗ Unerwarteter Fehler: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
