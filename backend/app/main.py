import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .config import settings
from .database import engine, Base
from .seed import seed_database

# Import routers
from .routers import (
    auth, districts, mines, violations,
    inspections, actions, compliance,
    documents, contractors, audit, uploads
)

app = FastAPI(
    title="GeoMine AI — Smart Mining Governance API",
    description="Backend API for GeoMine AI compliance, satellite evidence monitoring, and field inspection workflows.",
    version="1.0.0"
)

# Secure CORS: specify authorized local development & production origins
allowed_origins = list(set([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000"
] + settings.cors_origin_list))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount local uploads directory for document & evidence storage
uploads_dir = "/app/uploads" if os.path.exists("/app/uploads") else os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads"
)
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Register routers
app.include_router(auth.router)
app.include_router(districts.router)
app.include_router(mines.router)
app.include_router(violations.router)
app.include_router(inspections.router)
app.include_router(actions.router)
app.include_router(compliance.router)
app.include_router(documents.router)
app.include_router(contractors.router)
app.include_router(audit.router)
app.include_router(uploads.router)

@app.on_event("startup")
def on_startup():
    print("[GeoMine AI] Starting up API server...")
    import time
    for attempt in range(12):
        try:
            seed_database()
            print("[GeoMine AI] Database connection & tables initialized successfully.")
            break
        except Exception as e:
            print(f"[GeoMine AI DB wait] Attempt {attempt+1}/12: {e}")
            time.sleep(2)

@app.get("/")
def root():
    return {
        "system": "GeoMine AI Backend API",
        "version": "1.0.0",
        "status": "ONLINE",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "database": "connected",
        "environment": settings.ENVIRONMENT
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
