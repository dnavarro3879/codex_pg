from datetime import datetime, timezone
from typing import List, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException, Query

from .. import schemas
from ..services.locations import LocationService
from ..services import species as species_service


router = APIRouter(prefix="/species", tags=["species"])


@router.get("/suggest", response_model=List[schemas.SpeciesSuggestion])
async def suggest_species(q: str = Query(..., min_length=1), limit: int = Query(10, ge=1, le=25)):
    """Return species suggestions for autocomplete."""
    suggestions = await species_service.search_species_suggestions(q, limit)
    # Map into schema list
    return [
        schemas.SpeciesSuggestion(
            species_name=item.get("species_name", ""),
            species_code=item.get("species_code", ""),
            scientific_name=item.get("scientific_name") or None,
        )
        for item in suggestions
    ]


def _parse_cutoff_to_back_days(cutoff_date: Optional[str]) -> Optional[int]:
    if not cutoff_date:
        return None
    try:
        # Expecting YYYY-MM-DD
        dt = datetime.strptime(cutoff_date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        now = datetime.now(timezone.utc)
        delta_days = (now - dt).days
        return max(0, min(delta_days, 30))  # eBird back param supports up to 30 days for many endpoints
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid cutoff_date format. Use YYYY-MM-DD")


@router.get("/observations", response_model=List[schemas.ObservedBird])
async def species_observations(
    species_code: str = Query(..., min_length=2),
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    location_type: Optional[str] = Query(None, pattern="^(zip|city)$"),
    location_value: Optional[str] = None,
    radius_km: int = Query(25, ge=1, le=100),
    cutoff_date: Optional[str] = Query(None, description="YYYY-MM-DD inclusive start date"),
):
    """Get nearby observations for a species by code. Provide lat/lng or a location (zip or city)."""
    # Resolve location
    coords: Optional[Tuple[float, float]] = None
    if lat is not None and lng is not None:
        coords = (lat, lng)
    elif location_type and location_value:
        resolved_lat, resolved_lng = await LocationService.geocode_location(location_type, location_value)
        coords = (resolved_lat, resolved_lng)
    else:
        raise HTTPException(status_code=400, detail="Provide lat/lng or location_type and location_value")

    back_days = _parse_cutoff_to_back_days(cutoff_date)

    observations = await species_service.fetch_species_observations(
        species_code=species_code,
        lat=coords[0],
        lng=coords[1],
        radius_km=radius_km,
        back_days=back_days,
    )
    return observations


