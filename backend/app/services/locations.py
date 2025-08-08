import httpx
import logging
from typing import Optional, Tuple
from fastapi import HTTPException

logger = logging.getLogger(__name__)

class LocationService:
    """Service for handling location geocoding and management."""
    
    @staticmethod
    async def geocode_zip(zip_code: str) -> Tuple[float, float]:
        """
        Get coordinates for a US ZIP code using Zippopotam API.
        
        Args:
            zip_code: US ZIP code
            
        Returns:
            Tuple of (latitude, longitude)
            
        Raises:
            HTTPException: If geocoding fails
        """
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get(f"https://api.zippopotam.us/us/{zip_code}")
                
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid ZIP code: {zip_code}"
                    )
                
                data = response.json()
                if not data.get("places"):
                    raise HTTPException(
                        status_code=400,
                        detail=f"No location found for ZIP: {zip_code}"
                    )
                
                place = data["places"][0]
                lat = float(place["latitude"])
                lng = float(place["longitude"])
                
                logger.info(f"Geocoded ZIP {zip_code} to ({lat}, {lng})")
                return lat, lng
                
        except httpx.RequestError as e:
            logger.error(f"Error geocoding ZIP {zip_code}: {str(e)}")
            raise HTTPException(
                status_code=503,
                detail="Geocoding service temporarily unavailable"
            )
    
    @staticmethod
    async def geocode_city(city_name: str, state: Optional[str] = None, country: str = "USA") -> Tuple[float, float]:
        """
        Get coordinates for a city using Nominatim API.
        
        Args:
            city_name: City name
            state: Optional state/province
            country: Country (default: USA)
            
        Returns:
            Tuple of (latitude, longitude)
            
        Raises:
            HTTPException: If geocoding fails
        """
        try:
            # Build query
            query_parts = [city_name]
            if state:
                query_parts.append(state)
            query_parts.append(country)
            query = ", ".join(query_parts)
            
            async with httpx.AsyncClient(timeout=10) as client:
                # Use Nominatim (OpenStreetMap) for city geocoding
                params = {
                    "q": query,
                    "format": "json",
                    "limit": 1,
                    "countrycodes": "us"  # Limit to US for now
                }
                
                # Add User-Agent header as required by Nominatim
                headers = {
                    "User-Agent": "BirdSpotter/1.0"
                }
                
                response = await client.get(
                    "https://nominatim.openstreetmap.org/search",
                    params=params,
                    headers=headers
                )
                
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=503,
                        detail="Geocoding service error"
                    )
                
                data = response.json()
                if not data:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Location not found: {query}"
                    )
                
                result = data[0]
                lat = float(result["lat"])
                lng = float(result["lon"])
                
                logger.info(f"Geocoded city '{query}' to ({lat}, {lng})")
                return lat, lng
                
        except httpx.RequestError as e:
            logger.error(f"Error geocoding city {city_name}: {str(e)}")
            raise HTTPException(
                status_code=503,
                detail="Geocoding service temporarily unavailable"
            )
    
    @staticmethod
    async def geocode_location(location_type: str, location_value: str) -> Tuple[float, float]:
        """
        Geocode a location based on its type.
        
        Args:
            location_type: Either "zip" or "city"
            location_value: The ZIP code or city name
            
        Returns:
            Tuple of (latitude, longitude)
        """
        if location_type == "zip":
            return await LocationService.geocode_zip(location_value)
        elif location_type == "city":
            # Parse city input (could be "Denver, CO" or just "Denver")
            parts = location_value.split(",")
            city = parts[0].strip()
            state = parts[1].strip() if len(parts) > 1 else None
            return await LocationService.geocode_city(city, state)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid location type: {location_type}"
            )