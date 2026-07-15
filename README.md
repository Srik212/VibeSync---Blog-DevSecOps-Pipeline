VibeSync --- Blog-DevSecOps-Pipeline

## Running with Docker

Requires `backend/.env` to exist (see `PORT`, `JWT_SECRET`, `DB_PATH`).

**Production-style stack** (nginx serves the built frontend and proxies `/api/` to the backend):

```
docker compose up --build
```

App is served at `http://localhost`. The SQLite database persists in a named Docker volume (`backend_data`) across rebuilts.

**Development stack** (hot reload, source bind-mounted):

```
docker compose -f docker-compose.dev.yml up --build
```

Frontend (Vite) at `http://localhost:5173`, backend at `http://localhost:5000`.
