from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
from dotenv import load_dotenv
import logging


#TODO: Configure logging to console
logging.basicConfig(level=logging.INFO)
logging.getLogger().addHandler(logging.StreamHandler())

load_dotenv()

app = FastAPI(title="Rare Bird Finder")

EBIRD_API = "https://api.ebird.org/v2/data/obs/geo/recent/notable"
EBIRD_KEY = os.getenv("EBIRD_API_KEY", "")

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
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

class Bird(BaseModel):
    species: str
    loc: str
    date: str
    lat: float
    lng: float

@app.get("/birds/rare", response_model=list[Bird])
async def rare_birds(lat: float, lng: float, radius: int = 25):
    """Fetch notable sightings from the eBird API."""
    headers = {"X-eBirdApiToken": EBIRD_KEY}
    params = {"lat": lat, "lng": lng, "dist": radius}

    async with httpx.AsyncClient(timeout=10) as client:
        res = await client.get(EBIRD_API, params=params, headers=headers)
        if res.status_code != 200:
            raise HTTPException(res.status_code, res.text)
        data = res.json()

    birds: list[Bird] = []
    for item in data:
        birds.append(
            Bird(
                species=item.get("comName", "unknown"),
                loc=item.get("locName", ""),
                date=item.get("obsDt", ""),
                lat=item.get("lat", 0.0),
                lng=item.get("lng", 0.0),
            )
        )
    
    logging.info(f"Found {len(birds)} rare birds near ({lat}, {lng})")
    logging.info(f"Birds data (first 10): {birds[:10]}")
    return birds
