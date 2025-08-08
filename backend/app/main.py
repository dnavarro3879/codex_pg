from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv
import logging
from typing import Optional

from .database import engine, get_db
from . import models, schemas, auth
from .routers import auth as auth_router
from .services import BirdService


#TODO: Configure logging to console
logging.basicConfig(level=logging.INFO)
logging.getLogger().addHandler(logging.StreamHandler())

load_dotenv()

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Rare Bird Finder")

# CORS configuration: allow the frontend to call this API
FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN")
allowed_origins = [
    # Prefer explicit env var if provided
    FRONTEND_ORIGIN,
    # Common local dev origins
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
# Filter out any Nones and duplicates while preserving order
allowed_origins = [o for i, o in enumerate(allowed_origins) if o and o not in allowed_origins[:i]]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins or ["*"],  # fall back to * if nothing set
    allow_credentials=True,  # Changed to True for auth cookies
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],  # Allow frontend to read all headers
)

# Include routers
app.include_router(auth_router.router)

@app.get("/birds/rare", response_model=list[schemas.ObservedBird])
async def rare_birds(
    lat: float, 
    lng: float, 
    radius: int = 25,
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
    db: Session = Depends(get_db)
):
    """Fetch notable sightings from the eBird API."""
    # Fetch bird data using the service
    birds = await BirdService.fetch_rare_birds(lat, lng, radius)
    
    # Save search to user's history if authenticated
    if current_user:
        BirdService.save_user_search(
            db=db,
            user=current_user,
            lat=lat,
            lng=lng,
            radius=radius,
            bird_count=len(birds)
        )
        
    return birds
