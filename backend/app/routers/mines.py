from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Mine, District
from ..schemas import MineResponse, MineCreate

router = APIRouter(prefix="/api/mines", tags=["Mines"])

@router.get("", response_model=List[MineResponse])
def get_mines(
    district: Optional[str] = Query(None, description="Filter by district name or district ID"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level (LOW, MEDIUM, HIGH, CRITICAL)"),
    status: Optional[str] = Query(None, description="Filter by operational status"),
    db: Session = Depends(get_db)
):
    """Retrieve mining locations with optional filters."""
    query = db.query(Mine)

    if district and district.lower() != "all":
        # Match by district_id (e.g. TN-KARUR) or district name via join
        dist_record = db.query(District).filter(
            (District.id == district) | (District.name.ilike(district))
        ).first()
        if dist_record:
            query = query.filter(Mine.district_id == dist_record.id)
        else:
            query = query.filter(Mine.district_id.ilike(f"%{district}%"))

    if risk_level and risk_level.lower() != "all":
        query = query.filter(Mine.risk_level.ilike(risk_level))

    if status and status.lower() != "all":
        query = query.filter(Mine.operational_status.ilike(status))

    return query.order_by(Mine.name.asc()).all()

@router.get("/{mine_id}", response_model=MineResponse)
def get_mine(mine_id: str, db: Session = Depends(get_db)):
    """Retrieve detailed information for a specific mine site."""
    mine = db.query(Mine).filter(Mine.id == mine_id).first()
    if not mine:
        raise HTTPException(status_code=404, detail="Mine site not found")
    return mine

@router.post("", response_model=MineResponse)
def create_mine(mine_in: MineCreate, db: Session = Depends(get_db)):
    """Register a new verified mining lease or quarry."""
    existing = db.query(Mine).filter(Mine.id == mine_in.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Mine ID already exists")

    new_mine = Mine(**mine_in.dict())
    db.add(new_mine)
    db.commit()
    db.refresh(new_mine)
    return new_mine

