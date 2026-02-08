from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProjectCreate(ProjectBase):
    pass

class Project(ProjectBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ExcelFileBase(BaseModel):
    base_name: str
    display_name: str
    project_id: Optional[int] = None

class ExcelFileCreate(ExcelFileBase):
    filename: str
    file_size: int

class ExcelFile(ExcelFileBase):
    id: int
    filename: str
    file_size: int
    version: int
    content_type: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ExcelFileWithVersions(ExcelFile):
    versions: List['ExcelFile'] = []



# DataTable Schemas
class DataTableBase(BaseModel):
    name: str
    project_id: Optional[int] = None

class DataTableCreate(DataTableBase):
    columns: List[dict]
    data: List[dict]

class DataTableUpdate(BaseModel):
    name: Optional[str] = None
    columns: Optional[List[dict]] = None
    data: Optional[List[dict]] = None

class DataTable(DataTableBase):
    id: int
    columns: List[dict]
    data: List[dict]
    row_count: int
    column_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True



# Procedure Schemas
class ProcedureBase(BaseModel):
    description: Optional[str] = None

class ProcedureCreate(ProcedureBase):
    code: str
    parameter_types: Optional[dict] = None  # {"param_name": "Table", "wert1": "int"}

class ProcedureUpdate(BaseModel):
    code: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    parameter_types: Optional[dict] = None

class Procedure(ProcedureBase):
    id: int
    name: str
    version: int
    code: str
    is_active: bool
    parameter_types: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ProcedureSchema(BaseModel):
    """Schema für UI-Generierung"""
    name: str
    version: int
    description: Optional[str]
    parameters: dict  # {"param_name": {"type": "Table", "required": True, "default": None}}

class ProcedureParametersPreview(BaseModel):
    """Preview der Parameter vor dem Speichern"""
    function_name: str
    parameters: dict  # {"param_name": {"type": "Any", "required": True, "default": None}}
    missing_types: List[str]  # Liste der Parameter ohne Type Hint

class ProcedureExecuteRequest(BaseModel):
    parameters: dict  # {"tabelle": 5, "wert1": 10, "wert2": 2}
    project_id: Optional[int] = None

class ProcedureExecutionResult(BaseModel):
    id: int
    procedure_id: int
    status: str
    output_table_id: Optional[int]
    error_message: Optional[str]
    execution_time: Optional[float]
    executed_at: datetime

    class Config:
        from_attributes = True
