from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List

# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    email: Optional[EmailStr] = None

# Token schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    email: Optional[str] = None

# Search history schemas
class SearchHistoryBase(BaseModel):
    lat: float
    lng: float
    radius: int = 25

class SearchHistoryCreate(SearchHistoryBase):
    bird_count: int = 0

class SearchHistoryResponse(SearchHistoryBase):
    id: int
    user_id: int
    bird_count: int
    search_date: datetime

    class Config:
        from_attributes = True

# Favorite bird schemas
class FavoriteBirdBase(BaseModel):
    species_name: str
    species_code: str
    scientific_name: Optional[str] = None
    notes: Optional[str] = None

class FavoriteBirdCreate(FavoriteBirdBase):
    pass

class FavoriteBirdResponse(FavoriteBirdBase):
    id: int
    user_id: int
    added_date: datetime

    class Config:
        from_attributes = True

# User with relations
class UserWithRelations(UserResponse):
    recent_searches: List[SearchHistoryResponse] = []
    favorites: List[FavoriteBirdResponse] = []

# Bird observation schemas
class ObservedBird(BaseModel):
    species: str
    species_code: str
    loc: str
    loc_id: str
    date: str
    lat: float
    lng: float
    how_many: Optional[int] = None
    user_display_name: Optional[str] = None

# Location schemas
class LocationBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    location_type: str = Field(..., pattern="^(zip|city)$")
    location_value: str = Field(..., min_length=1, max_length=100)

class LocationCreate(LocationBase):
    is_default: bool = False

class LocationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    is_default: Optional[bool] = None

class LocationResponse(LocationBase):
    id: int
    user_id: int
    lat: float
    lng: float
    is_default: bool
    created_at: datetime

    class Config:
        from_attributes = True