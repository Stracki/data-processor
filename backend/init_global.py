"""
Initialisierungs-Script für das Global-Projekt und Standard-Werte
"""
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from models import Project, GlobalValue

def init_global_project(db: Session):
    """Erstellt das Global-Projekt wenn es nicht existiert"""
    
    # Prüfe ob Global-Projekt existiert
    global_project = db.query(Project).filter(Project.is_global == True).first()
    
    if not global_project:
        print("Erstelle Global-Projekt...")
        global_project = Project(
            name="Global",
            description="Globale Ressourcen für alle Projekte",
            is_global=True,
            cycle_config=None,
            project_metadata={}
        )
        db.add(global_project)
        db.commit()
        print("✓ Global-Projekt erstellt")
    else:
        print("✓ Global-Projekt existiert bereits")
    
    return global_project


def init_default_global_values(db: Session):
    """Erstellt Standard globale Werte"""
    
    default_values = [
        {
            "key": "MWST_SATZ",
            "value": 0.19,
            "value_type": "number",
            "category": "Finanzen",
            "description": "Standard Mehrwertsteuersatz in Deutschland"
        },
        {
            "key": "MWST_REDUZIERT",
            "value": 0.07,
            "value_type": "number",
            "category": "Finanzen",
            "description": "Reduzierter Mehrwertsteuersatz"
        },
        {
            "key": "WAEHRUNG",
            "value": "EUR",
            "value_type": "string",
            "category": "Finanzen",
            "description": "Standard-Währung"
        },
        {
            "key": "DATUM_FORMAT",
            "value": "DD.MM.YYYY",
            "value_type": "string",
            "category": "Formatierung",
            "description": "Standard Datumsformat"
        },
        {
            "key": "DEZIMAL_TRENNZEICHEN",
            "value": ",",
            "value_type": "string",
            "category": "Formatierung",
            "description": "Dezimaltrennzeichen für deutsche Zahlenformate"
        }
    ]
    
    created_count = 0
    for value_data in default_values:
        # Prüfe ob Wert bereits existiert
        existing = db.query(GlobalValue).filter(GlobalValue.key == value_data["key"]).first()
        
        if not existing:
            global_value = GlobalValue(**value_data)
            db.add(global_value)
            created_count += 1
            print(f"  ✓ Erstellt: {value_data['key']}")
    
    if created_count > 0:
        db.commit()
        print(f"✓ {created_count} globale Werte erstellt")
    else:
        print("✓ Alle Standard-Werte existieren bereits")


def main():
    """Hauptfunktion"""
    print("=" * 50)
    print("Initialisiere Global-Projekt und Standard-Werte")
    print("=" * 50)
    
    # Erstelle Tabellen
    Base.metadata.create_all(bind=engine)
    
    # Erstelle Session
    db = SessionLocal()
    
    try:
        # Initialisiere Global-Projekt
        init_global_project(db)
        
        # Initialisiere Standard-Werte
        print("\nErstelle Standard globale Werte...")
        init_default_global_values(db)
        
        print("\n" + "=" * 50)
        print("✓ Initialisierung abgeschlossen!")
        print("=" * 50)
        
    except Exception as e:
        print(f"\n✗ Fehler bei Initialisierung: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
