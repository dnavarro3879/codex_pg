import os
import time
import logging
from typing import Any, Dict, List, Optional, Tuple

import httpx
from fastapi import HTTPException

from .. import schemas

logger = logging.getLogger(__name__)

EBIRD_TAXONOMY_URL = "https://api.ebird.org/v2/ref/taxonomy/ebird"
EBIRD_SPECIES_GEO_URL = "https://api.ebird.org/v2/data/obs/geo/recent/{species_code}"


# Simple in-memory cache for taxonomy
_taxonomy_cache: List[Dict[str, Any]] | None = None
_taxonomy_cached_at: float | None = None
_taxonomy_ttl_seconds = 60 * 60 * 12  # 12 hours


async def _get_httpx_client() -> httpx.AsyncClient:
    return httpx.AsyncClient(timeout=15)


async def load_taxonomy(force_refresh: bool = False) -> List[Dict[str, Any]]:
    """Load eBird taxonomy with minimal fields and cache it in memory.

    Returns a list of dicts containing at least comName, sciName, speciesCode.
    """
    global _taxonomy_cache, _taxonomy_cached_at

    if (
        not force_refresh
        and _taxonomy_cache is not None
        and _taxonomy_cached_at is not None
        and (time.time() - _taxonomy_cached_at) < _taxonomy_ttl_seconds
    ):
        return _taxonomy_cache

    api_key = os.getenv("EBIRD_API_KEY", "")
    if not api_key:
        logger.error("EBIRD_API_KEY not configured")
        raise HTTPException(status_code=500, detail="eBird API key not configured")

    params = {
        "fmt": "json",
        "locale": "en",
    }

    headers = {"X-eBirdApiToken": api_key}

    async with await _get_httpx_client() as client:
        try:
            resp = await client.get(EBIRD_TAXONOMY_URL, params=params, headers=headers)
            resp.raise_for_status()
        except httpx.HTTPStatusError as e:
            logger.error("Taxonomy load failed: %s - %s", e.response.status_code, e.response.text)
            raise HTTPException(status_code=e.response.status_code, detail="Failed to load taxonomy")
        except httpx.RequestError as e:
            logger.error("Taxonomy request error: %s", str(e))
            raise HTTPException(status_code=503, detail="Service temporarily unavailable")

        data = resp.json()

    # Normalize fields we care about
    taxonomy: List[Dict[str, Any]] = []
    for item in data:
        com_name = item.get("comName")
        sci_name = item.get("sciName")
        species_code = item.get("speciesCode")
        if com_name and species_code:
            taxonomy.append(
                {
                    "comName": com_name,
                    "sciName": sci_name,
                    "speciesCode": species_code,
                }
            )

    _taxonomy_cache = taxonomy
    _taxonomy_cached_at = time.time()
    logger.info("Loaded taxonomy entries: %d", len(taxonomy))
    return taxonomy


async def search_species_suggestions(query: str, limit: int = 10) -> List[Dict[str, str]]:
    """Search taxonomy for species suggestions by common or scientific name."""
    if not query:
        return []
    taxonomy = await load_taxonomy()
    q = query.lower().strip()

    matches: List[Tuple[int, Dict[str, str]]] = []

    for item in taxonomy:
        com_name = item.get("comName", "")
        sci_name = item.get("sciName", "")
        species_code = item.get("speciesCode", "")
        text = f"{com_name} {sci_name}".lower()
        if q in text:
            # Simple ranking: prefix match is better
            rank = 0
            if com_name.lower().startswith(q) or sci_name.lower().startswith(q):
                rank -= 10
            # Shorter common name slightly preferred
            rank += len(com_name)
            matches.append(
                (
                    rank,
                    {
                        "species_name": com_name,
                        "species_code": species_code,
                        "scientific_name": sci_name or "",
                    },
                )
            )

    matches.sort(key=lambda x: x[0])
    return [m[1] for m in matches[: max(1, min(limit, 25))]]


async def fetch_species_observations(
    species_code: str,
    lat: float,
    lng: float,
    radius_km: int = 25,
    back_days: Optional[int] = None,
) -> List[schemas.ObservedBird]:
    """Fetch nearby observations for a given species code."""
    if radius_km < 1 or radius_km > 100:
        raise HTTPException(status_code=400, detail="radius_km must be between 1 and 100")

    api_key = os.getenv("EBIRD_API_KEY", "")
    if not api_key:
        logger.error("EBIRD_API_KEY not configured")
        raise HTTPException(status_code=500, detail="eBird API key not configured")

    url = EBIRD_SPECIES_GEO_URL.format(species_code=species_code)
    params: Dict[str, Any] = {"lat": lat, "lng": lng, "dist": radius_km}
    if back_days is not None and back_days > 0:
        params["back"] = back_days

    headers = {"X-eBirdApiToken": api_key}

    async with await _get_httpx_client() as client:
        try:
            resp = await client.get(url, params=params, headers=headers)
            resp.raise_for_status()
        except httpx.HTTPStatusError as e:
            logger.error("Species obs request failed: %s - %s", e.response.status_code, e.response.text)
            raise HTTPException(status_code=e.response.status_code, detail="Failed to fetch observations")
        except httpx.RequestError as e:
            logger.error("Species obs request error: %s", str(e))
            raise HTTPException(status_code=503, detail="Service temporarily unavailable")

        data = resp.json()

    results: List[schemas.ObservedBird] = []
    for item in data:
        results.append(
            schemas.ObservedBird(
                species=item.get("comName", "unknown"),
                species_code=item.get("speciesCode", species_code),
                loc=item.get("locName", ""),
                loc_id=item.get("locId", ""),
                date=item.get("obsDt", ""),
                lat=item.get("lat", 0.0),
                lng=item.get("lng", 0.0),
                how_many=item.get("howMany"),
                user_display_name=item.get("userDisplayName"),
            )
        )

    return results


