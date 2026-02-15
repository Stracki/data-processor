from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import projects, files, tables, procedures, workflows, global_values

Base.metadata.create_all(bind=engine)

app = FastAPI(title="WebApp API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router, prefix="/api")
app.include_router(files.router, prefix="/api")
app.include_router(tables.router, prefix="/api")
app.include_router(procedures.router)
app.include_router(workflows.router)
app.include_router(global_values.router, prefix="/api")

@app.get("/")
def read_root():
    return {"message": "WebApp API läuft"}
