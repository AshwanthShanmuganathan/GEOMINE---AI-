from typing import Optional, List
from pydantic import BaseModel

# Auth Schemas
class LoginRequest(BaseModel):
    email: str
    password: str
    district_id: Optional[str] = None
    mine_id: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    employee_id: Optional[str] = None
    district_id: Optional[str] = None
    assigned_mine_id: Optional[str] = None

    class Config:
        from_attributes = True


# District Schemas
class DistrictResponse(BaseModel):
    id: str
    name: str
    tamil_name: Optional[str] = None
    headquarters: Optional[str] = None
    verified_location_count: int = 0

    class Config:
        from_attributes = True


# Mine Schemas
class MineResponse(BaseModel):
    id: str
    district_id: str
    name: str
    taluk: Optional[str] = None
    village_name: Optional[str] = None
    latitude: float
    longitude: float
    mine_type: str
    operational_status: str
    compliance_score: int
    risk_level: str
    ai_risk_score: int
    open_violations: int
    pending_actions: int
    last_inspection: Optional[str] = None

    class Config:
        from_attributes = True

class MineCreate(BaseModel):
    id: str
    district_id: str
    name: str
    taluk: Optional[str] = None
    village_name: Optional[str] = None
    latitude: float
    longitude: float
    mine_type: str
    compliance_score: Optional[int] = 80
    risk_level: Optional[str] = "MEDIUM"


# Violation Schemas
class ViolationResponse(BaseModel):
    id: str
    mine_id: str
    mine_name: Optional[str] = None
    district_id: Optional[str] = None
    district: Optional[str] = None
    category: str
    source: str
    description: str
    severity: str
    status: str
    date_issued: str
    deadline: str
    penalty: float
    assigned_to: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    evidence_type: str
    evidence_url: Optional[str] = None
    related_action_id: Optional[str] = None
    aging: int = 0

    class Config:
        from_attributes = True

class ViolationCreate(BaseModel):
    mine_id: str
    category: str
    source: Optional[str] = "INSPECTION"
    description: str
    severity: str
    status: Optional[str] = "OPEN"
    date_issued: str
    deadline: str
    penalty: Optional[float] = 25000.0
    assigned_to: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    evidence_type: Optional[str] = "inspection_photo"
    evidence_url: Optional[str] = None

class ViolationUpdateStatus(BaseModel):
    status: str


# Inspection Schemas
class InspectionResponse(BaseModel):
    id: str
    mine_id: str
    mine_name: Optional[str] = None
    district_id: Optional[str] = None
    district: Optional[str] = None
    inspector: str
    date: str
    type: str
    status: str
    score: int
    findings: int
    critical: int
    remarks: Optional[str] = None
    photo_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    class Config:
        from_attributes = True

class InspectionCreate(BaseModel):
    mine_id: str
    inspection_type: str
    score: Optional[int] = 85
    findings: Optional[int] = 0
    critical: Optional[int] = 0
    remarks: Optional[str] = None
    photo_url: Optional[str] = None


# Corrective Action Schemas
class CorrectiveActionResponse(BaseModel):
    id: str
    mine_id: str
    mine_name: Optional[str] = None
    violation_id: Optional[str] = None
    district_id: Optional[str] = None
    district: Optional[str] = None
    title: str
    assigned_to: str
    deadline: str
    status: str
    priority: str
    days_remaining: int
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class ActionUpdateStatus(BaseModel):
    status: str

class CorrectiveActionCreate(BaseModel):
    mine_id: str
    title: str
    assigned_to: str
    deadline: str
    priority: Optional[str] = "HIGH"
    status: Optional[str] = "OPEN"
    violation_id: Optional[str] = None
    notes: Optional[str] = None


# Compliance Schemas
class ComplianceResponse(BaseModel):
    id: str
    mine_id: str
    mine_name: Optional[str] = None
    district_id: Optional[str] = None
    district: Optional[str] = None
    requirement: str
    category: str
    frequency: str
    due_date: str
    status: str

    class Config:
        from_attributes = True

class ComplianceUpdateStatus(BaseModel):
    status: str

class ComplianceCreate(BaseModel):
    mine_id: str
    requirement: str
    category: str
    frequency: Optional[str] = "Monthly"
    due_date: str
    status: Optional[str] = "PENDING"


# Document Schemas
class DocumentResponse(BaseModel):
    id: str
    mine_id: Optional[str] = None
    mine_name: Optional[str] = None
    district_id: Optional[str] = None
    district: Optional[str] = None
    name: str
    type: str
    authority: str
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    status: str
    ocr_confidence: int
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None

    class Config:
        from_attributes = True

class DocumentCreate(BaseModel):
    name: str
    type: str
    authority: str
    mine_id: Optional[str] = None
    mine_name: Optional[str] = None
    district: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    ocr_confidence: Optional[int] = 95
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None


# Contractor Schemas
class ContractorResponse(BaseModel):
    id: str
    mine_id: Optional[str] = None
    mine_name: Optional[str] = None
    district_id: Optional[str] = None
    district: Optional[str] = None
    name: str
    type: Optional[str] = None
    workers: int
    license: str
    expiry: Optional[str] = None
    safety_score: int
    compliance: int
    incidents: int
    status: str

    class Config:
        from_attributes = True

class ContractorCreate(BaseModel):
    name: str
    type: Optional[str] = "Logistics & Transport"
    mine_id: Optional[str] = None
    district: Optional[str] = None
    workers: Optional[int] = 20
    license: Optional[str] = "Valid"
    expiry: Optional[str] = "2026-12-31"
    safety_score: Optional[int] = 85
    compliance: Optional[int] = 85
    status: Optional[str] = "Active"


# Audit Log Schemas
class AuditLogResponse(BaseModel):
    id: int
    action: str
    user: str
    target: Optional[str] = None
    type: Optional[str] = None
    details: Optional[str] = None
    timestamp: str

    class Config:
        from_attributes = True
