from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from .database import Base

class District(Base):
    __tablename__ = "districts"

    id = Column(String(50), primary_key=True)  # e.g. "TN-KARUR"
    name = Column(String(100), nullable=False, index=True)
    tamil_name = Column(String(100), nullable=True)
    headquarters = Column(String(100), nullable=True)
    verified_location_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    mines = relationship("Mine", back_populates="district", cascade="all, delete-orphan")


class Mine(Base):
    __tablename__ = "mines"

    id = Column(String(50), primary_key=True)  # e.g. "LOC-KAR-001"
    district_id = Column(String(50), ForeignKey("districts.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(200), nullable=False, index=True)
    taluk = Column(String(100), nullable=True)
    village_name = Column(String(100), nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    mine_type = Column(String(100), nullable=False)
    operational_status = Column(String(50), default="Active")
    compliance_score = Column(Integer, default=80)
    risk_level = Column(String(20), default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    ai_risk_score = Column(Integer, default=50)
    open_violations = Column(Integer, default=0)
    pending_actions = Column(Integer, default=0)
    last_inspection = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    district = relationship("District", back_populates="mines")
    violations = relationship("Violation", back_populates="mine", cascade="all, delete-orphan")
    inspections = relationship("Inspection", back_populates="mine", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    employee_id = Column(String(50), nullable=True)
    role = Column(String(50), nullable=False)  # admin, manager, officer, inspector
    district_id = Column(String(50), ForeignKey("districts.id", ondelete="SET NULL"), nullable=True)
    assigned_mine_id = Column(String(50), ForeignKey("mines.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Violation(Base):
    __tablename__ = "violations"

    id = Column(String(50), primary_key=True)  # e.g. "VL-101"
    mine_id = Column(String(50), ForeignKey("mines.id", ondelete="CASCADE"), nullable=False, index=True)
    mine_name = Column(String(200), nullable=True)
    district_id = Column(String(50), nullable=True, index=True)
    district = Column(String(100), nullable=True)
    category = Column(String(50), nullable=False)  # Safety, Environment, Labour, Equipment, Compliance
    source = Column(String(50), default="SATELLITE")  # SATELLITE, INSPECTION, AI DETECTION
    description = Column(Text, nullable=False)
    severity = Column(String(20), default="MEDIUM", index=True)  # CRITICAL, HIGH, MEDIUM, LOW
    status = Column(String(20), default="OPEN", index=True)  # OPEN, IN_PROGRESS, RESOLVED, OVERDUE
    date_issued = Column(String(50), nullable=False)
    deadline = Column(String(50), nullable=False)
    penalty = Column(Float, default=0.0)
    assigned_to = Column(String(150), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    evidence_type = Column(String(50), default="satellite")  # satellite, inspection_photo
    evidence_url = Column(String(500), nullable=True)
    related_action_id = Column(String(50), nullable=True)
    aging = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    mine = relationship("Mine", back_populates="violations")


class CorrectiveAction(Base):
    __tablename__ = "corrective_actions"

    id = Column(String(50), primary_key=True)  # e.g. "CA-101"
    mine_id = Column(String(50), ForeignKey("mines.id", ondelete="CASCADE"), nullable=False, index=True)
    mine_name = Column(String(200), nullable=True)
    violation_id = Column(String(50), nullable=True, index=True)
    district_id = Column(String(50), nullable=True)
    district = Column(String(100), nullable=True)
    title = Column(String(255), nullable=False)
    assigned_to = Column(String(150), nullable=False)
    deadline = Column(String(50), nullable=False)
    status = Column(String(30), default="OPEN", index=True)  # OPEN, IN_PROGRESS, COMPLETED, OVERDUE
    priority = Column(String(20), default="HIGH")  # CRITICAL, HIGH, MEDIUM, LOW
    days_remaining = Column(Integer, default=15)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


class Inspection(Base):
    __tablename__ = "inspections"

    id = Column(String(50), primary_key=True)  # e.g. "INS-101"
    mine_id = Column(String(50), ForeignKey("mines.id", ondelete="CASCADE"), nullable=False, index=True)
    mine_name = Column(String(200), nullable=True)
    district_id = Column(String(50), nullable=True, index=True)
    district = Column(String(100), nullable=True)
    inspector = Column(String(150), nullable=False)
    date = Column(String(50), nullable=False)
    type = Column(String(100), nullable=False)
    status = Column(String(30), default="COMPLETED")  # SCHEDULED, IN_PROGRESS, COMPLETED
    score = Column(Integer, default=80)
    findings = Column(Integer, default=0)
    critical = Column(Integer, default=0)
    remarks = Column(Text, nullable=True)
    photo_url = Column(String(500), nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    mine = relationship("Mine", back_populates="inspections")


class ComplianceRecord(Base):
    __tablename__ = "compliance_records"

    id = Column(String(50), primary_key=True)  # e.g. "CR-101"
    mine_id = Column(String(50), ForeignKey("mines.id", ondelete="CASCADE"), nullable=False, index=True)
    mine_name = Column(String(200), nullable=True)
    district_id = Column(String(50), nullable=True, index=True)
    district = Column(String(100), nullable=True)
    requirement = Column(String(255), nullable=False)
    category = Column(String(50), nullable=False)
    frequency = Column(String(50), default="Monthly")
    due_date = Column(String(50), nullable=False)
    status = Column(String(30), default="PENDING", index=True)  # COMPLIANT, PENDING, OVERDUE
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(50), primary_key=True)  # e.g. "DOC-101"
    mine_id = Column(String(50), ForeignKey("mines.id", ondelete="CASCADE"), nullable=True, index=True)
    mine_name = Column(String(200), nullable=True)
    district_id = Column(String(50), nullable=True)
    district = Column(String(100), nullable=True)
    name = Column(String(255), nullable=False)
    type = Column(String(100), nullable=False)
    authority = Column(String(150), nullable=False)
    issue_date = Column(String(50), nullable=True)
    expiry_date = Column(String(50), nullable=True)
    status = Column(String(50), default="Valid")
    ocr_confidence = Column(Integer, default=95)
    ocr_data = Column(Text, nullable=True)
    file_url = Column(String(500), nullable=True)
    file_name = Column(String(255), nullable=True)
    file_size = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Contractor(Base):
    __tablename__ = "contractors"

    id = Column(String(50), primary_key=True)  # e.g. "CON-101"
    mine_id = Column(String(50), ForeignKey("mines.id", ondelete="CASCADE"), nullable=True, index=True)
    mine_name = Column(String(200), nullable=True)
    district_id = Column(String(50), nullable=True)
    district = Column(String(100), nullable=True)
    name = Column(String(200), nullable=False)
    type = Column(String(100), nullable=True)
    workers = Column(Integer, default=20)
    license = Column(String(50), default="Valid")
    expiry = Column(String(50), nullable=True)
    safety_score = Column(Integer, default=80)
    compliance = Column(Integer, default=80)
    incidents = Column(Integer, default=0)
    status = Column(String(50), default="Active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    action = Column(String(100), nullable=False)
    user = Column(String(150), nullable=False)
    target = Column(String(100), nullable=True)
    type = Column(String(50), nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

