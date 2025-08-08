from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List

from .. import models, schemas, auth
from ..database import get_db

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