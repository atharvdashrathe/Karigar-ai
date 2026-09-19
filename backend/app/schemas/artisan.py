from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ArtisanProfileCreate(BaseModel):
    phone_number: str
    display_name: str | None = None
    name: str
    preferred_language: str = "hi"
    location: str | None = None
    craft_type: str | None = None
    experience_years: int | None = None
    business_name: str | None = None


class ArtisanProfileUpdate(BaseModel):
    name: str | None = None
    preferred_language: str | None = None
    location: str | None = None
    craft_type: str | None = None
    experience_years: int | None = None
    business_name: str | None = None


class ArtisanProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    name: str
    preferred_language: str
    location: str | None
    craft_type: str | None
    experience_years: int | None
    business_name: str | None
    created_at: datetime
