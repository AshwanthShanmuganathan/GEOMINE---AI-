from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Document, Mine
from ..schemas import DocumentResponse, DocumentCreate

router = APIRouter(prefix="/api/documents", tags=["Documents & OCR"])

@router.get("", response_model=List[DocumentResponse])
def get_documents(
    district: Optional[str] = Query(None),
    mine_id: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Document)
    if district and district.lower() != "all":
        query = query.filter(
            (Document.district.ilike(f"%{district}%")) |
            (Document.district_id.ilike(f"%{district}%"))
        )
    if mine_id and mine_id.lower() != "all":
        query = query.filter(Document.mine_id == mine_id)
    return query.order_by(Document.id.desc()).all()

@router.post("", response_model=DocumentResponse)
def create_document(req: DocumentCreate, db: Session = Depends(get_db)):
    # Auto-resolve mine and district details if mine_id provided
    district_name = req.district
    mine_name = req.mine_name
    district_id = None
    valid_mine_id = None

    if req.mine_id:
        mine = db.query(Mine).filter(Mine.id == req.mine_id).first()
        if mine:
            valid_mine_id = mine.id
            mine_name = mine.name
            district_id = mine.district_id
            district_name = mine.district.name if mine.district else req.district

    count = db.query(Document).count()
    new_id = f"DOC-{101 + count}"
    new_doc = Document(
        id=new_id,
        name=req.name,
        type=req.type,
        authority=req.authority,
        mine_id=valid_mine_id,
        mine_name=mine_name,
        district_id=district_id,
        district=district_name,
        issue_date=req.issue_date or "2024-06-20",
        expiry_date=req.expiry_date or "2028-09-26",
        status="Valid",
        ocr_confidence=req.ocr_confidence or 95,
        file_url=req.file_url,
        file_name=req.file_name,
        file_size=req.file_size,
        mime_type=req.mime_type
    )
    db.add(new_doc)
    db.commit()
    db.refresh(new_doc)
    return new_doc
