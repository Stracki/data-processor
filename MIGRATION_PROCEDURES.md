# Datenbank-Migration für Prozeduren

## Automatische Migration

Die neuen Tabellen `procedures` und `procedure_executions` werden automatisch erstellt beim Start des Backends durch:

```python
Base.metadata.create_all(bind=engine)
```

## Manuelle Migration (falls nötig)

Falls die automatische Migration nicht funktioniert, kannst du die Tabellen manuell erstellen:

### SQL für PostgreSQL

```sql
-- Procedures Tabelle
CREATE TABLE procedures (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    version INTEGER NOT NULL,
    code TEXT NOT NULL,
    description VARCHAR,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_procedure_name_version UNIQUE (name, version)
);

CREATE INDEX ix_procedures_id ON procedures(id);
CREATE INDEX ix_procedures_name ON procedures(name);

-- Procedure Executions Tabelle
CREATE TABLE procedure_executions (
    id SERIAL PRIMARY KEY,
    procedure_id INTEGER NOT NULL REFERENCES procedures(id),
    project_id INTEGER REFERENCES projects(id),
    input_params JSON NOT NULL,
    output_table_id INTEGER REFERENCES data_tables(id),
    status VARCHAR NOT NULL,
    error_message TEXT,
    execution_time FLOAT,
    executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX ix_procedure_executions_id ON procedure_executions(id);
```

## Bestehende Daten

Die Migration fügt nur neue Tabellen hinzu und ändert keine bestehenden Daten.

## Rollback

Falls du die Prozeduren-Tabellen entfernen möchtest:

```sql
DROP TABLE IF EXISTS procedure_executions CASCADE;
DROP TABLE IF EXISTS procedures CASCADE;
```

## Verifizierung

Nach dem Start des Backends kannst du prüfen ob die Tabellen erstellt wurden:

```sql
-- Liste alle Tabellen
\dt

-- Prüfe Procedures Tabelle
SELECT * FROM procedures;

-- Prüfe Procedure Executions Tabelle
SELECT * FROM procedure_executions;
```

## Docker

Falls du Docker verwendest, werden die Tabellen automatisch beim ersten Start erstellt. Kein manueller Eingriff nötig.

```bash
docker-compose down
docker-compose up --build
```
