from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, auth
from ..database import get_db
from ..services.locations import LocationService

router = APIRouter(
    prefix="/auth",
    tags=["authentication"]
)

@router.post("/register", response_model=schemas.UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    """Register a new user."""
    db_user = auth.create_user(db, user_data)
    return db_user

@router.post("/login", response_model=schemas.Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Login with email and password to get JWT tokens."""
    user = auth.authenticate_user(db, form_data.username, form_data.password)  # username field contains email
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = auth.create_access_token(data={"sub": user.email})
    refresh_token = auth.create_refresh_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=schemas.Token)
async def refresh_token(
    refresh_token: str,
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token."""
    token_data = auth.verify_token(refresh_token, token_type="refresh")
    
    # Get user to ensure they still exist and are active
    user = db.query(models.User).filter(models.User.email == token_data.email).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    access_token = auth.create_access_token(data={"sub": user.email})
    new_refresh_token = auth.create_refresh_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=schemas.UserWithRelations)
async def get_current_user(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get current user information."""
    # Load recent searches (last 10)
    recent_searches = db.query(models.UserSearch)\
        .filter(models.UserSearch.user_id == current_user.id)\
        .order_by(models.UserSearch.search_date.desc())\
        .limit(10)\
        .all()
    
    # Load favorites
    favorites = db.query(models.UserFavoriteBird)\
        .filter(models.UserFavoriteBird.user_id == current_user.id)\
        .order_by(models.UserFavoriteBird.added_date.desc())\
        .all()
    
    # Create response with relations
    user_dict = {
        "id": current_user.id,
        "email": current_user.email,
        "username": current_user.username,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at,
        "recent_searches": recent_searches,
        "favorites": favorites
    }
    
    return user_dict

@router.post("/favorites", response_model=schemas.FavoriteBirdResponse, status_code=status.HTTP_201_CREATED)
async def add_favorite(
    favorite_data: schemas.FavoriteBirdCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add a bird to user's favorites."""
    # Check if already favorited
    existing = db.query(models.UserFavoriteBird).filter(
        models.UserFavoriteBird.user_id == current_user.id,
        models.UserFavoriteBird.species_name == favorite_data.species_name
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bird already in favorites"
        )
    
    # Create new favorite
    db_favorite = models.UserFavoriteBird(
        user_id=current_user.id,
        **favorite_data.dict()
    )
    db.add(db_favorite)
    db.commit()
    db.refresh(db_favorite)
    
    return db_favorite

@router.get("/favorites", response_model=List[schemas.FavoriteBirdResponse])
async def get_favorites(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's favorite birds."""
    favorites = db.query(models.UserFavoriteBird)\
        .filter(models.UserFavoriteBird.user_id == current_user.id)\
        .order_by(models.UserFavoriteBird.added_date.desc())\
        .all()
    return favorites

@router.get("/favorites/check/{species_code}")
async def check_favorite(
    species_code: str,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Check if a bird is in user's favorites."""
    favorite = db.query(models.UserFavoriteBird).filter(
        models.UserFavoriteBird.user_id == current_user.id,
        models.UserFavoriteBird.species_code == species_code
    ).first()
    
    return {"is_favorited": favorite is not None, "favorite_id": favorite.id if favorite else None}

@router.delete("/favorites/{favorite_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_favorite(
    favorite_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Remove a bird from user's favorites."""
    favorite = db.query(models.UserFavoriteBird).filter(
        models.UserFavoriteBird.id == favorite_id,
        models.UserFavoriteBird.user_id == current_user.id
    ).first()
    
    if not favorite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Favorite not found"
        )
    
    db.delete(favorite)
    db.commit()
    return None

@router.get("/searches", response_model=List[schemas.SearchHistoryResponse])
async def get_search_history(
    limit: int = 20,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's search history."""
    searches = db.query(models.UserSearch)\
        .filter(models.UserSearch.user_id == current_user.id)\
        .order_by(models.UserSearch.search_date.desc())\
        .limit(limit)\
        .all()
    return searches

@router.get("/locations", response_model=List[schemas.LocationResponse])
async def get_locations(
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's saved locations."""
    locations = db.query(models.UserLocation)\
        .filter(models.UserLocation.user_id == current_user.id)\
        .order_by(models.UserLocation.is_default.desc(), models.UserLocation.created_at.desc())\
        .all()
    return locations

@router.post("/locations", response_model=schemas.LocationResponse, status_code=status.HTTP_201_CREATED)
async def add_location(
    location_data: schemas.LocationCreate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Add a new saved location."""
    # Check if location name already exists for this user
    existing = db.query(models.UserLocation).filter(
        models.UserLocation.user_id == current_user.id,
        models.UserLocation.name == location_data.name
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Location with this name already exists"
        )
    
    # Geocode the location
    try:
        lat, lng = await LocationService.geocode_location(
            location_data.location_type,
            location_data.location_value
        )
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to geocode location: {str(e)}"
        )
    
    # If this is set as default, unset other defaults
    if location_data.is_default:
        db.query(models.UserLocation).filter(
            models.UserLocation.user_id == current_user.id
        ).update({"is_default": False})
    
    # Create new location
    db_location = models.UserLocation(
        user_id=current_user.id,
        name=location_data.name,
        location_type=location_data.location_type,
        location_value=location_data.location_value,
        lat=lat,
        lng=lng,
        is_default=location_data.is_default
    )
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    
    return db_location

@router.put("/locations/{location_id}", response_model=schemas.LocationResponse)
async def update_location(
    location_id: int,
    location_update: schemas.LocationUpdate,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a saved location."""
    location = db.query(models.UserLocation).filter(
        models.UserLocation.id == location_id,
        models.UserLocation.user_id == current_user.id
    ).first()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    # Update fields if provided
    if location_update.name is not None:
        # Check if new name already exists
        existing = db.query(models.UserLocation).filter(
            models.UserLocation.user_id == current_user.id,
            models.UserLocation.name == location_update.name,
            models.UserLocation.id != location_id
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Location with this name already exists"
            )
        
        location.name = location_update.name
    
    if location_update.is_default is not None:
        if location_update.is_default:
            # Unset other defaults
            db.query(models.UserLocation).filter(
                models.UserLocation.user_id == current_user.id,
                models.UserLocation.id != location_id
            ).update({"is_default": False})
        location.is_default = location_update.is_default
    
    db.commit()
    db.refresh(location)
    
    return location

@router.delete("/locations/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(
    location_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a saved location."""
    location = db.query(models.UserLocation).filter(
        models.UserLocation.id == location_id,
        models.UserLocation.user_id == current_user.id
    ).first()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    db.delete(location)
    db.commit()
    
    return None

@router.post("/locations/{location_id}/set-default", response_model=schemas.LocationResponse)
async def set_default_location(
    location_id: int,
    current_user: models.User = Depends(auth.get_current_active_user),
    db: Session = Depends(get_db)
):
    """Set a location as the default."""
    location = db.query(models.UserLocation).filter(
        models.UserLocation.id == location_id,
        models.UserLocation.user_id == current_user.id
    ).first()
    
    if not location:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Location not found"
        )
    
    # Unset other defaults
    db.query(models.UserLocation).filter(
        models.UserLocation.user_id == current_user.id,
        models.UserLocation.id != location_id
    ).update({"is_default": False})
    
    # Set this as default
    location.is_default = True
    db.commit()
    db.refresh(location)
    
    return location