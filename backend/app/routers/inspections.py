from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Inspection, Mine, AuditLog
from ..schemas import InspectionResponse, InspectionCreate

router = APIRouter(prefix="/api/inspections", tags=["Inspections"])

@router.get("", response_model=List[InspectionResponse])
def get_inspections(
    district: Optional[str] = Query(None),
    mine_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Retrieve field inspection logs."""
    query = db.query(Inspection)

    if district and district.lower() != "all":
        query = query.filter(
            (Inspection.district.ilike(f"%{district}%")) |
            (Inspection.district_id.ilike(f"%{district}%"))
        )

    if mine_id and mine_id.lower() != "all":
        query = query.filter(Inspection.mine_id == mine_id)

    return query.order_by(Inspection.id.desc()).all()

@router.post("", response_model=InspectionResponse)
def submit_inspection(
    req: InspectionCreate,
    db: Session = Depends(get_db)
):
    """Submit a newly completed field inspection with photographic evidence."""
    mine = db.query(Mine).filter(Mine.id == req.mine_id).first()
    if not mine:
        raise HTTPException(status_code=404, detail="Mine site not found")

    count = db.query(Inspection).count()
    new_id = f"INS-{101 + count}"
    today_str = datetime.utcnow().strftime("%Y-%m-%d")

    new_ins = Inspection(
        id=new_id,
        mine_id=mine.id,
        mine_name=mine.name,
        district_id=mine.district_id,
        district=mine.district.name if mine.district else None,
        inspector="Senior Safety Inspector",
        date=today_str,
        type=req.inspection_type,
        status="COMPLETED",
        score=req.score or 85,
        findings=req.findings or 0,
        critical=req.critical or 0,
        remarks=req.remarks or "Routine inspection conducted according to standard operating checklist.",
        photo_url=req.photo_url or "/mine1.jpg",
        latitude=mine.latitude,
        longitude=mine.longitude
    )
    db.add(new_ins)

    # Update mine last inspection and compliance score
    mine.last_inspection = today_str
    if req.score:
        mine.compliance_score = req.score

    # Audit log
    audit = AuditLog(
        action=f"Field Inspection Submitted ({new_id})",
        user="Senior Safety Inspector",
        target=new_id,
        type="inspection",
        details=f"Site inspection at {mine.name} with score {req.score}%",
        timestamp=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    )
    db.add(audit)

    db.commit()
    db.refresh(new_ins)
    return new_ins

