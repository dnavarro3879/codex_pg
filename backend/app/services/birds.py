import httpx
import os
import logging
from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.orm import Session
from dotenv import load_dotenv
from .. import models, schemas

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

EBIRD_API_URL = "https://api.ebird.org/v2/data/obs/geo/recent/notable"

class BirdService:
    """Service for handling bird data operations."""
    
    @staticmethod
    async def fetch_rare_birds(
        lat: float,
        lng: float,
        radius: int = 25
    ) -> List[schemas.ObservedBird]:
        """
        Fetch notable bird sightings from the eBird API.
        
        Args:
            lat: Latitude for the search center
            lng: Longitude for the search center
            radius: Search radius in kilometers (default: 25)
            
        Returns:
            List of ObservedBird objects containing sighting information
            
        Raises:
            HTTPException: If the API request fails
        """
        api_key = os.getenv("EBIRD_API_KEY", "")
        if not api_key:
            logger.error("EBIRD_API_KEY not found in environment variables")
            raise HTTPException(
                status_code=500,
                detail="eBird API key not configured"
            )
        
        headers = {"X-eBirdApiToken": api_key}
        params = {"lat": lat, "lng": lng, "dist": radius}
        
        logger.info(f"Making eBird API request to {EBIRD_API_URL} with params: {params}")
        
        async with httpx.AsyncClient(timeout=10) as client:
            try:
                response = await client.get(
                    EBIRD_API_URL,
                    params=params,
                    headers=headers
                )
                response.raise_for_status()
            except httpx.HTTPStatusError as e:
                logger.error(f"eBird API error: {e.response.status_code} - {e.response.text}")
                raise HTTPException(
                    status_code=e.response.status_code,
                    detail=f"Failed to fetch bird data: {e.response.text}"
                )
            except httpx.RequestError as e:
                logger.error(f"Request error: {str(e)}")
                raise HTTPException(
                    status_code=503,
                    detail="Service temporarily unavailable"
                )
            
            data = response.json()
        
        birds = []
        for item in data:
            birds.append(
                schemas.ObservedBird(
                    species=item.get("comName", "unknown"),
                    species_code=item.get("speciesCode", ""),
                    loc=item.get("locName", ""),
                    loc_id=item.get("locId", ""),
                    date=item.get("obsDt", ""),
                    lat=item.get("lat", 0.0),
                    lng=item.get("lng", 0.0),
                    how_many=item.get("howMany"),
                    user_display_name=item.get("userDisplayName"),
                )
            )
        
        return birds
    
    @staticmethod
    def save_user_search(
        db: Session,
        user: models.User,
        lat: float,
        lng: float,
        radius: int,
        bird_count: int
    ) -> models.UserSearch:
        """
        Save a user's search to the database.
        
        Args:
            db: Database session
            user: User model instance
            lat: Search latitude
            lng: Search longitude
            radius: Search radius
            bird_count: Number of birds found
            
        Returns:
            The created UserSearch record
        """
        search_record = models.UserSearch(
            user_id=user.id,
            lat=lat,
            lng=lng,
            radius=radius,
            bird_count=bird_count
        )
        db.add(search_record)
        db.commit()
        db.refresh(search_record)
        
        logger.info(f"Saved search for user {user.email}: {bird_count} birds found")
        return search_record