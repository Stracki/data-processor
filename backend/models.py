from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, LargeBinary, JSON, Text, Boolean, Float, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    is_global = Column(Boolean, default=False)  # Markiert das globale Projekt
    
    # Zyklen-Konfiguration (JSON)
    cycle_config = Column(JSON, nullable=True)
    # Format: {
    #   "cycleType": "yearly",
    #   "cyclePattern": "Jahr_{year}",
    #   "subfolders": ["01_Eingangsdaten", "02_Verarbeitung", "03_Ausgabe"],
    #   "autoCreateSubfolders": true
    # }
    
    # Projekt-Metadaten (JSON)
    project_metadata = Column(JSON, nullable=True)
    # Format: {
    #   "contacts": {"responsible": "...", "contact": "..."},
    #   "addresses": {"shipping": {...}, "billing": {...}},
    #   "custom": {"key": "value"}
    # }
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    excel_files = relationship("ExcelFile", back_populates="project")
    data_tables = relationship("DataTable", back_populates="project")
    cycles = relationship("ProjectCycle", back_populates="project", cascade="all, delete-orphan")


class ProjectCycle(Base):
    __tablename__ = "project_cycles"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    name = Column(String, nullable=False)  # z.B. "Jahr_2024"
    path = Column(String, nullable=False)  # Virtueller Pfad
    
    # Metadaten für den Zyklus
    cycle_metadata = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    project = relationship("Project", back_populates="cycles")
    
    __table_args__ = (UniqueConstraint('project_id', 'name', name='uq_project_cycle'),)


class ExcelFile(Base):
    __tablename__ = "excel_files"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    
    # Original-Name (ohne Timestamp)
    base_name = Column(String, nullable=False, index=True)
    display_name = Column(String, nullable=False)
    
    # Dateiname (mit Timestamp für Eindeutigkeit)
    filename = Column(String, nullable=False, unique=True)
    
    # BLOB-Speicherung für Cloud-Kompatibilität
    file_data = Column(LargeBinary, nullable=False)
    
    # Metadaten
    file_size = Column(Integer)
    version = Column(Integer, default=1)
    content_type = Column(String, default="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship
    project = relationship("Project", back_populates="excel_files")



class DataTable(Base):
    __tablename__ = "data_tables"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    
    # Tabellenname
    name = Column(String, nullable=False, index=True)
    
    # Spalten-Definition (JSON)
    # Format: [{"id": 1, "name": "Spalte 1", "type": "string"}, ...]
    columns = Column(JSON, nullable=False)
    
    # Daten (JSON)
    # Format: [{"id": 1, "col_1": "Wert", "col_2": "..."}, ...]
    data = Column(JSON, nullable=False)
    
    # Metadaten
    row_count = Column(Integer, default=0)
    column_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationship
    project = relationship("Project", back_populates="data_tables")


class Procedure(Base):
    __tablename__ = "procedures"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    version = Column(Integer, nullable=False)
    code = Column(Text, nullable=False)
    description = Column(String)
    is_active = Column(Boolean, default=True)
    
    # Scope: 'global', 'project', 'cycle'
    scope = Column(String, default='project')
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    cycle_id = Column(Integer, ForeignKey("project_cycles.id"), nullable=True)
    
    # Wenn aus Global kopiert, Referenz zum Original
    copied_from_id = Column(Integer, ForeignKey("procedures.id"), nullable=True)
    
    # Parameter-Types (JSON)
    # Format: {"param_name": "Table", "wert1": "int", "wert2": "float"}
    parameter_types = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    project = relationship("Project", foreign_keys=[project_id])
    cycle = relationship("ProjectCycle", foreign_keys=[cycle_id])
    copied_from = relationship("Procedure", remote_side=[id], foreign_keys=[copied_from_id])
    
    __table_args__ = (UniqueConstraint('name', 'version', 'scope', 'project_id', 'cycle_id', name='uq_procedure_scope'),)


class ProcedureExecution(Base):
    __tablename__ = "procedure_executions"

    id = Column(Integer, primary_key=True, index=True)
    procedure_id = Column(Integer, ForeignKey("procedures.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    
    input_params = Column(JSON, nullable=False)
    output_table_id = Column(Integer, ForeignKey("data_tables.id"), nullable=True)
    
    status = Column(String, nullable=False)
    error_message = Column(Text, nullable=True)
    execution_time = Column(Float, nullable=True)
    
    executed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    procedure = relationship("Procedure")
    project = relationship("Project")
    output_table = relationship("DataTable")


class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(String)
    
    # Scope: 'global', 'project', 'cycle'
    scope = Column(String, default='project')
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    cycle_id = Column(Integer, ForeignKey("project_cycles.id"), nullable=True)
    
    # Wenn aus Global kopiert, Referenz zum Original
    copied_from_id = Column(Integer, ForeignKey("workflows.id"), nullable=True)
    
    # Graph-Definition (JSON)
    # Format: {"nodes": [...], "edges": [...]}
    graph = Column(JSON, nullable=False)
    
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    project = relationship("Project", foreign_keys=[project_id])
    cycle = relationship("ProjectCycle", foreign_keys=[cycle_id])
    copied_from = relationship("Workflow", remote_side=[id], foreign_keys=[copied_from_id])


class WorkflowExecution(Base):
    __tablename__ = "workflow_executions"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    cycle_id = Column(Integer, ForeignKey("project_cycles.id"), nullable=True)
    
    input_params = Column(JSON, nullable=False)
    output_data = Column(JSON, nullable=True)
    
    status = Column(String, nullable=False)  # pending, running, completed, failed
    error_message = Column(Text, nullable=True)
    execution_time = Column(Float, nullable=True)
    
    # Execution Log für jeden Node
    execution_log = Column(JSON, nullable=True)
    
    executed_at = Column(DateTime(timezone=True), server_default=func.now())
    
    workflow = relationship("Workflow")
    project = relationship("Project")
    cycle = relationship("ProjectCycle")


class WorkflowInstance(Base):
    """
    Workflow-Instanz: Verknüpfung eines Workflows mit einem Zyklus
    Speichert zyklus-spezifische Konfiguration und Parameter
    """
    __tablename__ = "workflow_instances"

    id = Column(Integer, primary_key=True, index=True)
    workflow_id = Column(Integer, ForeignKey("workflows.id"), nullable=False)
    cycle_id = Column(Integer, ForeignKey("project_cycles.id"), nullable=False)
    
    # Zyklus-spezifische Parameter und Konfiguration
    parameters = Column(JSON, nullable=True)
    # Format: {"schwellwert": 1000, "faktor": 1.2, ...}
    
    # Input-Mapping (welche Tabellen als Input)
    input_mapping = Column(JSON, nullable=True)
    # Format: {"tabelle_a": table_id, "tabelle_b": table_id}
    
    # Metadaten
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    workflow = relationship("Workflow")
    cycle = relationship("ProjectCycle")
    
    __table_args__ = (UniqueConstraint('workflow_id', 'cycle_id', name='uq_workflow_cycle'),)


class GlobalValue(Base):
    __tablename__ = "global_values"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String, nullable=False, unique=True, index=True)  # z.B. "MWST_SATZ"
    value = Column(JSON, nullable=False)  # Kann String, Number, Object sein
    value_type = Column(String, nullable=False)  # 'string', 'number', 'boolean', 'object'
    category = Column(String, nullable=True)  # z.B. "Finanzen", "Adressen"
    description = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
