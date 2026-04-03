from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import init_db
from app.routers import auth, teacher, student
import logging
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

app = FastAPI(title="Adaptive Learning System API")

# Ensure static directories exist
os.makedirs("static/images", exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# CORS configuration
import os
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")

# Build allowed origins list - support both single URL and comma-separated URLs
allowed_origins = [FRONTEND_URL]
if "," in FRONTEND_URL:
    # If multiple URLs are provided (comma-separated)
    allowed_origins = [url.strip() for url in FRONTEND_URL.split(",")]
else:
    allowed_origins = [FRONTEND_URL]

# Always include localhost for development
if "http://localhost:3000" not in allowed_origins:
    allowed_origins.append("http://localhost:3000")
if "http://localhost:3001" not in allowed_origins:
    allowed_origins.append("http://localhost:3001")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(teacher.router)
app.include_router(student.router)

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    init_db()

@app.get("/")
async def root():
    return {"message": "Adaptive Learning System API"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

