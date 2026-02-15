from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    is_global: Optional[bool] = False
    cycle_config: Optional[dict] = None
    project_metadata: Optional[dict] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    cycle_config: Optional[dict] = None
    project_metadata: Optional[dict] = None

class Project(ProjectBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class ProjectCycleBase(BaseModel):
    name: str
    path: str
    cycle_metadata: Optional[dict] = None

class ProjectCycleCreate(ProjectCycleBase):
    project_id: int

class ProjectCycle(ProjectCycleBase):
    id: int
    project_id: int
    created_at: datetime

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
    scope: Optional[str] = 'project'
    project_id: Optional[int] = None
    cycle_id: Optional[int] = None

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
    copied_from_id: Optional[int] = None
    parameter_types: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True

class ProcedureCopyRequest(BaseModel):
    target_scope: str  # 'project' or 'cycle'
    target_project_id: Optional[int] = None
    target_cycle_id: Optional[int] = None

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


# Workflow Schemas
class WorkflowNode(BaseModel):
    id: str
    type: str  # 'table', 'procedure', 'value', 'api', 'output'
    position: dict  # {"x": 100, "y": 200}
    data: dict  # Node-spezifische Daten

class WorkflowEdge(BaseModel):
    id: str
    source: str
    target: str
    sourceHandle: Optional[str] = None
    targetHandle: Optional[str] = None

class WorkflowGraph(BaseModel):
    nodes: List[WorkflowNode]
    edges: List[WorkflowEdge]

class WorkflowBase(BaseModel):
    name: str
    description: Optional[str] = None
    scope: Optional[str] = 'project'
    project_id: Optional[int] = None
    cycle_id: Optional[int] = None

class WorkflowCreate(WorkflowBase):
    graph: WorkflowGraph

class WorkflowUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    graph: Optional[WorkflowGraph] = None
    is_active: Optional[bool] = None

class Workflow(WorkflowBase):
    id: int
    graph: dict
    is_active: bool
    copied_from_id: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class WorkflowCopyRequest(BaseModel):
    target_scope: str  # 'project' or 'cycle'
    target_project_id: Optional[int] = None
    target_cycle_id: Optional[int] = None

class WorkflowExecuteRequest(BaseModel):
    input_params: dict  # Initiale Parameter für den Workflow
    project_id: Optional[int] = None

class WorkflowExecutionResult(BaseModel):
    id: int
    workflow_id: int
    status: str
    output_data: Optional[dict]
    error_message: Optional[str]
    execution_time: Optional[float]
    execution_log: Optional[dict]
    executed_at: datetime

    class Config:
        from_attributes = True


# Workflow Instance Schemas
class WorkflowInstanceBase(BaseModel):
    workflow_id: int
    cycle_id: int
    parameters: Optional[dict] = None
    input_mapping: Optional[dict] = None

class WorkflowInstanceCreate(WorkflowInstanceBase):
    pass

class WorkflowInstanceUpdate(BaseModel):
    parameters: Optional[dict] = None
    input_mapping: Optional[dict] = None
    is_active: Optional[bool] = None

class WorkflowInstance(WorkflowInstanceBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# Global Value Schemas
class GlobalValueBase(BaseModel):
    key: str
    value: dict  # JSON value
    value_type: str  # 'string', 'number', 'boolean', 'object'
    category: Optional[str] = None
    description: Optional[str] = None

class GlobalValueCreate(GlobalValueBase):
    pass

class GlobalValueUpdate(BaseModel):
    value: Optional[dict] = None
    value_type: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None

class GlobalValue(GlobalValueBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
