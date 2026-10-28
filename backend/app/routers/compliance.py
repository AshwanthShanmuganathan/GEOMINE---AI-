from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import ComplianceRecord, Mine, AuditLog
from ..schemas import ComplianceResponse, ComplianceUpdateStatus, ComplianceCreate

router = APIRouter(prefix="/api/compliance", tags=["Compliance Register"])

@router.get("", response_model=List[ComplianceResponse])
def get_compliance_items(
    district: Optional[str] = Query(None),
    mine_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(ComplianceRecord)
    if district and district.lower() != "all":
        query = query.filter(
            (ComplianceRecord.district.ilike(f"%{district}%")) |
            (ComplianceRecord.district_id.ilike(f"%{district}%"))
        )
    if mine_id and mine_id.lower() != "all":
        query = query.filter(ComplianceRecord.mine_id == mine_id)
    if status and status.lower() != "all":
        query = query.filter(ComplianceRecord.status.ilike(status))
    return query.order_by(ComplianceRecord.due_date.asc()).all()

@router.patch("/{compliance_id}/status", response_model=ComplianceResponse)
def update_compliance_status(
    compliance_id: str,
    update: ComplianceUpdateStatus,
    db: Session = Depends(get_db)
):
    item = db.query(ComplianceRecord).filter(ComplianceRecord.id == compliance_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Compliance record not found")

    old_status = item.status
    item.status = update.status.upper()

    audit = AuditLog(
        action=f"Compliance Status Updated ({old_status} -> {item.status})",
        user="Officer Console",
        target=item.id,
        type="compliance",
        details=f"Statutory requirement '{item.requirement}' updated to {item.status}",
        timestamp=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    )
    db.add(audit)
    db.commit()
    db.refresh(item)
    return item

@router.post("", response_model=ComplianceResponse)
def create_compliance_item(
    req: ComplianceCreate,
    db: Session = Depends(get_db)
):
    mine = db.query(Mine).filter(Mine.id == req.mine_id).first()
    mine_name = mine.name if mine else req.mine_id
    district_id = mine.district_id if mine else None
    district_name = mine.district.name if mine and mine.district else None

    count = db.query(ComplianceRecord).count()
    new_id = f"CR-{101 + count}"

    new_item = ComplianceRecord(
        id=new_id,
        mine_id=req.mine_id,
        mine_name=mine_name,
        district_id=district_id,
        district=district_name,
        requirement=req.requirement,
        category=req.category,
        frequency=req.frequency or "Monthly",
        due_date=req.due_date,
        status=req.status or "PENDING"
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item
