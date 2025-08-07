from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import httpx
import os

app = FastAPI(title="Rare Bird Finder")

EBIRD_API = "https://api.ebird.org/v2/data/obs/geo/recent/notable"
EBIRD_KEY = os.getenv("EBIRD_API_KEY", "")

class Bird(BaseModel):
    species: str
    loc: str
    date: str

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
            )
        )
    return birds
