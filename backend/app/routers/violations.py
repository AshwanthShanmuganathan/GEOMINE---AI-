from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Violation, Mine, AuditLog
from ..schemas import ViolationResponse, ViolationCreate, ViolationUpdateStatus

router = APIRouter(prefix="/api/violations", tags=["Violations"])

@router.get("", response_model=List[ViolationResponse])
def get_violations(
    district: Optional[str] = Query(None),
    mine_id: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Query violation records with dynamic filtering and search."""
    query = db.query(Violation)

    if district and district.lower() != "all":
        query = query.filter(
            (Violation.district.ilike(f"%{district}%")) | 
            (Violation.district_id.ilike(f"%{district}%"))
        )

    if mine_id and mine_id.lower() != "all":
        query = query.filter(Violation.mine_id == mine_id)

    if severity and severity.lower() != "all":
        query = query.filter(Violation.severity.ilike(severity))

    if status and status.lower() != "all":
        query = query.filter(Violation.status.ilike(status))

    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (Violation.id.ilike(s)) |
            (Violation.description.ilike(s)) |
            (Violation.mine_name.ilike(s)) |
            (Violation.assigned_to.ilike(s))
        )

    return query.order_by(Violation.id.asc()).all()

@router.get("/{violation_id}", response_model=ViolationResponse)
def get_violation(violation_id: str, db: Session = Depends(get_db)):
    """Retrieve full details for a single violation."""
    v = db.query(Violation).filter(Violation.id == violation_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Violation record not found")
    return v

@router.patch("/{violation_id}/status", response_model=ViolationResponse)
def update_violation_status(
    violation_id: str,
    update: ViolationUpdateStatus,
    db: Session = Depends(get_db)
):
    """Update violation status and record an immutable audit log."""
    v = db.query(Violation).filter(Violation.id == violation_id).first()
    if not v:
        raise HTTPException(status_code=404, detail="Violation record not found")

    old_status = v.status
    v.status = update.status.upper()
    
    # Audit log
    audit = AuditLog(
        action=f"Violation Status Changed ({old_status} -> {v.status})",
        user="Officer Console",
        target=v.id,
        type="violation",
        details=f"Status updated for {v.id} at {v.mine_name}",
        timestamp=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    )
    db.add(audit)
    db.commit()
    db.refresh(v)
    return v

@router.post("", response_model=ViolationResponse)
def create_violation(
    req: ViolationCreate,
    db: Session = Depends(get_db)
):
    """Log a newly detected violation with geographic coordinates and evidence."""
    # Find mine metadata
    mine = db.query(Mine).filter(Mine.id == req.mine_id).first()
    mine_name = mine.name if mine else req.mine_id
    district_id = mine.district_id if mine else None

    # Auto-generate next ID
    count = db.query(Violation).count()
    new_id = f"VL-{101 + count}"

    new_v = Violation(
        id=new_id,
        mine_id=req.mine_id,
        mine_name=mine_name,
        district_id=district_id,
        district=mine.district.name if mine and mine.district else None,
        category=req.category,
        source=req.source,
        description=req.description,
        severity=req.severity.upper(),
        status=req.status.upper() if req.status else "OPEN",
        date_issued=req.date_issued,
        deadline=req.deadline,
        penalty=req.penalty or 25000.0,
        assigned_to=req.assigned_to or "S. Ramaswamy",
        latitude=req.latitude or (mine.latitude if mine else None),
        longitude=req.longitude or (mine.longitude if mine else None),
        evidence_type=req.evidence_type or "inspection_photo",
        evidence_url=req.evidence_url or "/violation.jpg",
        aging=1
    )
    db.add(new_v)
    db.commit()
    db.refresh(new_v)
    return new_v

