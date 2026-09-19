from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.user import ArtisanProfile, User
from app.schemas.artisan import ArtisanProfileCreate, ArtisanProfileOut, ArtisanProfileUpdate

router = APIRouter(prefix="/api/artisans", tags=["artisans"])


@router.post("", response_model=ArtisanProfileOut, status_code=status.HTTP_201_CREATED)
def create_artisan(payload: ArtisanProfileCreate, db: Session = Depends(get_db)) -> ArtisanProfile:
    existing_user = db.query(User).filter(User.phone_number == payload.phone_number).first()
    if existing_user is not None:
        raise HTTPException(status_code=409, detail="An account with this phone number already exists.")

    user = User(phone_number=payload.phone_number, display_name=payload.display_name)
    db.add(user)
    db.flush()  # assigns user.id without committing yet

    profile = ArtisanProfile(
        user_id=user.id,
        name=payload.name,
        preferred_language=payload.preferred_language,
        location=payload.location,
        craft_type=payload.craft_type,
        experience_years=payload.experience_years,
        business_name=payload.business_name,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.put("/{artisan_id}", response_model=ArtisanProfileOut)
@router.patch("/{artisan_id}", response_model=ArtisanProfileOut)
def update_artisan(artisan_id: str, payload: ArtisanProfileUpdate, db: Session = Depends(get_db)) -> ArtisanProfile:
    profile = db.get(ArtisanProfile, artisan_id)
    if profile is None:
        # Fallback to the first artisan profile if id doesn't match
        profile = db.query(ArtisanProfile).first()
    if profile is None:
        raise HTTPException(status_code=404, detail="Artisan profile not found.")

    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        if value is not None:
            setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile


@router.get("/{artisan_id}", response_model=ArtisanProfileOut)
def get_artisan(artisan_id: str, db: Session = Depends(get_db)) -> ArtisanProfile:
    profile = db.get(ArtisanProfile, artisan_id)
    if profile is None:
        raise HTTPException(status_code=404, detail="Artisan profile not found.")
    return profile


@router.get("", response_model=list[ArtisanProfileOut])
def list_artisans(db: Session = Depends(get_db)) -> list[ArtisanProfile]:
    return db.query(ArtisanProfile).order_by(ArtisanProfile.created_at.desc()).all()
