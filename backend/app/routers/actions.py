from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import CorrectiveAction, Mine, AuditLog
from ..schemas import CorrectiveActionResponse, ActionUpdateStatus, CorrectiveActionCreate

router = APIRouter(prefix="/api/actions", tags=["Corrective Actions"])

@router.get("", response_model=List[CorrectiveActionResponse])
def get_actions(
    district: Optional[str] = Query(None),
    mine_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(CorrectiveAction)
    if district and district.lower() != "all":
        query = query.filter(
            (CorrectiveAction.district.ilike(f"%{district}%")) |
            (CorrectiveAction.district_id.ilike(f"%{district}%"))
        )
    if mine_id and mine_id.lower() != "all":
        query = query.filter(CorrectiveAction.mine_id == mine_id)
    if status and status.lower() != "all":
        query = query.filter(CorrectiveAction.status.ilike(status))
    return query.order_by(CorrectiveAction.id.asc()).all()

@router.patch("/{action_id}/status", response_model=CorrectiveActionResponse)
def update_action_status(
    action_id: str,
    update: ActionUpdateStatus,
    db: Session = Depends(get_db)
):
    action = db.query(CorrectiveAction).filter(CorrectiveAction.id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Action not found")
    
    old_status = action.status
    action.status = update.status.upper()

    audit = AuditLog(
        action=f"Corrective Action Status Updated ({old_status} -> {action.status})",
        user="Officer Console",
        target=action.id,
        type="action",
        details=f"Status updated for {action.title}",
        timestamp=datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    )
    db.add(audit)
    db.commit()
    db.refresh(action)
    return action

@router.post("", response_model=CorrectiveActionResponse)
def create_action(
    req: CorrectiveActionCreate,
    db: Session = Depends(get_db)
):
    mine = db.query(Mine).filter(Mine.id == req.mine_id).first()
    mine_name = mine.name if mine else req.mine_id
    district_id = mine.district_id if mine else None
    district_name = mine.district.name if mine and mine.district else None

    count = db.query(CorrectiveAction).count()
    new_id = f"CA-{101 + count}"

    new_action = CorrectiveAction(
        id=new_id,
        mine_id=req.mine_id,
        mine_name=mine_name,
        violation_id=req.violation_id,
        district_id=district_id,
        district=district_name,
        title=req.title,
        assigned_to=req.assigned_to,
        deadline=req.deadline,
        status=req.status or "OPEN",
        priority=req.priority or "HIGH",
        days_remaining=15,
        notes=req.notes
    )
    db.add(new_action)
    db.commit()
    db.refresh(new_action)
    return new_action
