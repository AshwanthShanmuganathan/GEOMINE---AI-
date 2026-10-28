from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import LoginRequest, TokenResponse, UserResponse
from ..services.auth_service import verify_password, create_access_token, require_auth

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is inactive")

    # Update context if provided
    if req.district_id:
        user.district_id = req.district_id
    if req.mine_id:
        user.assigned_mine_id = req.mine_id
    db.commit()

    token = create_access_token(data={"sub": user.email, "role": user.role, "id": user.id})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role,
            "employee_id": user.employee_id,
            "district_id": user.district_id,
            "assigned_mine_id": user.assigned_mine_id
        }
    }

@router.get("/me", response_model=UserResponse)
def get_profile(current_user: User = Depends(require_auth)):
    return current_user

