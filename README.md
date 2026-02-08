# WebApp

Eine WebApp mit Vite Frontend, FastAPI Backend und PostgreSQL Datenbank.

## Setup

1. Docker starten:
```bash
docker-compose up --build
```

2. Die Anwendung ist erreichbar unter:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Dokumentation: http://localhost:8000/docs

## Struktur

- `frontend/` - Vite + React Frontend
- `backend/` - FastAPI Backend
- `docker-compose.yml` - Docker Konfiguration

## Entwicklung

Die Container nutzen Volume Mounts, sodass Änderungen automatisch übernommen werden.
