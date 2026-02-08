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
