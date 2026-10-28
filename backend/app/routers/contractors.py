from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Contractor, Mine
from ..schemas import ContractorResponse, ContractorCreate

router = APIRouter(prefix="/api/contractors", tags=["Contractors"])

@router.get("", response_model=List[ContractorResponse])
def get_contractors(
    district: Optional[str] = Query(None),
    mine_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Contractor)
    if district and district.lower() != "all":
        query = query.filter(
            (Contractor.district.ilike(f"%{district}%")) |
            (Contractor.district_id.ilike(f"%{district}%"))
        )
    if mine_id and mine_id.lower() != "all":
        query = query.filter(Contractor.mine_id == mine_id)
    return query.order_by(Contractor.safety_score.desc()).all()

@router.post("", response_model=ContractorResponse)
def create_contractor(
    req: ContractorCreate,
    db: Session = Depends(get_db)
):
    mine = db.query(Mine).filter(Mine.id == req.mine_id).first() if req.mine_id else None
    mine_name = mine.name if mine else None
    district_id = mine.district_id if mine else None
    district_name = mine.district.name if mine and mine.district else req.district

    count = db.query(Contractor).count()
    new_id = f"CON-{101 + count}"

    new_con = Contractor(
        id=new_id,
        mine_id=req.mine_id,
        mine_name=mine_name,
        district_id=district_id,
        district=district_name,
        name=req.name,
        type=req.type or "Logistics & Transport",
        workers=req.workers or 20,
        license=req.license or "Valid",
        expiry=req.expiry or "2026-12-31",
        safety_score=req.safety_score or 85,
        compliance=req.compliance or 85,
        incidents=0,
        status=req.status or "Active"
    )
    db.add(new_con)
    db.commit()
    db.refresh(new_con)
    return new_con
