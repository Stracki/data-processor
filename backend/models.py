from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, LargeBinary, JSON, Text, Boolean, Float, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    excel_files = relationship("ExcelFile", back_populates="project")
    data_tables = relationship("DataTable", back_populates="project")


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
    
    # Parameter-Types (JSON)
    # Format: {"param_name": "Table", "wert1": "int", "wert2": "float"}
    parameter_types = Column(JSON, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    __table_args__ = (UniqueConstraint('name', 'version', name='uq_procedure_name_version'),)


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
