from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import District
from ..schemas import DistrictResponse

router = APIRouter(prefix="/api/districts", tags=["Districts"])

@router.get("", response_model=List[DistrictResponse])
def get_districts(db: Session = Depends(get_db)):
    """Fetch all 38 registered districts in Tamil Nadu."""
    return db.query(District).order_by(District.name.asc()).all()

@router.get("/{district_id}", response_model=DistrictResponse)
def get_district(district_id: str, db: Session = Depends(get_db)):
    """Fetch specific district metadata."""
    district = db.query(District).filter(
        (District.id == district_id) | (District.name.ilike(district_id))
    ).first()
    if not district:
        raise HTTPException(status_code=404, detail="District not found")
    return district

