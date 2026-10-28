import json
import os
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database import engine, SessionLocal, Base
from app.models import (
    District, Mine, User, Violation, CorrectiveAction,
    Inspection, ComplianceRecord, Document, Contractor, AuditLog
)
from app.services.auth_service import hash_password

def seed_database():
    print("--- [GeoMine AI Database Seeder] ---")
    
    # 1. Create tables if they do not exist
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)

    # Ensure all table schema columns exist (incremental schema migrations)
    try:
        from sqlalchemy import text
        with engine.connect() as conn:
            conn.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_url VARCHAR(500);"))
            conn.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);"))
            conn.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size INTEGER;"))
            conn.execute(text("ALTER TABLE documents ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);"))
            conn.commit()
    except Exception as me:
        print(f"[Schema Migration Warning] {me}")

    db = SessionLocal()
    try:
        # Check if already seeded
        district_count = db.query(District).count()
        mine_count = db.query(Mine).count()
        if district_count >= 38 and mine_count >= 140:
            print(f"Database already populated ({district_count} districts, {mine_count} mines).")
            # Ensure contractors and documents are seeded even if base tables already exist
            if db.query(Contractor).count() == 0:
                print("Seeding contractor records...")
                contractor_names = [
                    "Deccan Mining Services", "Tamil Nadu Drillers Ltd", "Cauvery Heavy Logistics",
                    "Kongu Minerals Handling", "Pandian Earthmovers", "Apex Blasting & Safety",
                    "Chola Stone Works", "Marutham Haulage Fleet", "Salem Heavy Equipment", "Nellai Logistics"
                ]
                all_mines = db.query(Mine).limit(20).all()
                for idx, m in enumerate(all_mines):
                    con = Contractor(
                        id=f"CON-{101 + idx}",
                        mine_id=m.id,
                        mine_name=m.name,
                        district_id=m.district_id,
                        district=m.district.name if m.district else "Regional",
                        name=contractor_names[idx % len(contractor_names)],
                        type="Heavy Extraction & Haulage" if idx % 2 == 0 else "Drilling & Logistics",
                        workers=25 + (idx * 5) % 35,
                        license="Valid",
                        expiry="2027-06-30",
                        safety_score=85 if idx % 3 != 0 else 72,
                        compliance=88 if idx % 3 != 0 else 75,
                        incidents=1 if idx % 3 == 0 else 0,
                        status="Active" if idx % 4 != 0 else "Under Review"
                    )
                    db.add(con)
                db.commit()

            if db.query(Document).count() == 0:
                print("Seeding initial statutory documents...")
                all_mines = db.query(Mine).limit(10).all()
                for idx, m in enumerate(all_mines):
                    d = Document(
                        id=f"DOC-{101 + idx}",
                        mine_id=m.id,
                        mine_name=m.name,
                        district_id=m.district_id,
                        district=m.district.name if m.district else "Regional",
                        name=f"EC/2024/TN/0{idx+10} Environmental Clearance",
                        type="Environmental Clearance",
                        authority="Tamil Nadu Pollution Control Board",
                        issue_date="2024-06-20",
                        expiry_date="2028-09-26",
                        status="Valid",
                        ocr_confidence=97
                    )
                    db.add(d)
                db.commit()
            return

        # 2. Locate map.json
        candidate_paths = [
            Path(__file__).resolve().parent / "map.json",
            Path(__file__).resolve().parent.parent / "data" / "map.json",
            Path(__file__).resolve().parent.parent.parent / "src" / "data" / "map.json"
        ]
        map_json_path = next((p for p in candidate_paths if p.exists()), None)
        if not map_json_path:
            print(f"Error: map.json not found in any candidate paths: {[str(p) for p in candidate_paths]}")
            return

        with open(map_json_path, "r", encoding="utf-8") as f:
            map_data = json.load(f)

        # 3. Seed Districts
        print(f"Seeding {len(map_data.get('districts', []))} Tamil Nadu districts...")
        for d in map_data.get("districts", []):
            existing = db.query(District).filter(District.id == d["id"]).first()
            if not existing:
                dist_obj = District(
                    id=d["id"],
                    name=d["name"],
                    headquarters=d.get("headquarters"),
                    verified_location_count=d.get("verifiedLocationCount", 0)
                )
                db.add(dist_obj)
        db.commit()

        # 4. Seed Mines
        mining_locs = map_data.get("miningLocations", [])
        print(f"Seeding {len(mining_locs)} authentic mining locations...")
        for m in mining_locs:
            existing = db.query(Mine).filter(Mine.id == m["id"]).first()
            if not existing:
                mine_obj = Mine(
                    id=m["id"],
                    district_id=m["districtId"],
                    name=m["villageName"],
                    taluk=m.get("taluk"),
                    village_name=m["villageName"],
                    latitude=float(m["latitude"]),
                    longitude=float(m["longitude"]),
                    mine_type=m.get("mineType", "Open Cast Extraction"),
                    operational_status=m.get("operationalStatus", "Active"),
                    compliance_score=int(m.get("compliance", 80)),
                    risk_level=m.get("riskLevel", "MEDIUM"),
                    ai_risk_score=int(m.get("aiRiskScore", 55)),
                    open_violations=int(m.get("openViolations", 1)),
                    pending_actions=int(m.get("pendingActions", 1)),
                    last_inspection=m.get("lastInspection", "2026-10-01")
                )
                db.add(mine_obj)
        db.commit()

        # 5. Seed Users (Demo Accounts)
        print("Seeding authenticated demo users...")
        users_data = [
            ("admin@gmail.com", "admin123", "R. Senthil Kumar", "admin", "EMP-ADM-01", "TN-KARUR"),
            ("manager@gmail.com", "manager123", "K. Raman", "manager", "EMP-MGR-02", "TN-SALEM"),
            ("officer@gmail.com", "officer123", "S. Ramanathan", "officer", "EMP-OFC-03", "TN-COIMBATORE"),
            ("inspector@gmail.com", "inspector123", "P. Murugan", "inspector", "EMP-INS-04", "TN-KARUR"),
        ]

        for email, pwd, name, role, emp_id, dist_id in users_data:
            existing_user = db.query(User).filter(User.email == email).first()
            if not existing_user:
                u = User(
                    email=email,
                    hashed_password=hash_password(pwd),
                    full_name=name,
                    role=role,
                    employee_id=emp_id,
                    district_id=dist_id,
                    is_active=True
                )
                db.add(u)
        db.commit()

        # 6. Seed Relational Data: Violations, Actions, Inspections, Compliance
        print("Generating relational records (Violations, Actions, Inspections)...")
        categories = ['Safety', 'Environment', 'Labour', 'Equipment', 'Compliance']
        inspectors = ['S. Ramaswamy', 'K. Venkatesh', 'P. Murugan', 'R. Selvam', 'A. Kumar']
        descriptions = [
            'Unauthorized excavation depth exceeded by 2 meters',
            'Dust suppression water sprinkler system non-operational',
            'Safety barrier missing at southern excavation boundary',
            'Quarterly ground water monitoring test overdue by 30 days',
            'Blasting operations conducted without prior siren alert',
            'Worker protective equipment compliance below 70% threshold',
            'Boundary pillar marker removed or obscured',
            'Noise emission exceeding statutory industrial limit'
        ]

        seq_v = 100
        seq_a = 100
        seq_ins = 100
        seq_cr = 100

        all_mines = db.query(Mine).all()
        for idx, mine in enumerate(all_mines):
            dist = db.query(District).filter(District.id == mine.district_id).first()
            dist_name = dist.name if dist else "Tamil Nadu"

            # Violations (1-2 per high/medium risk mine)
            if mine.risk_level in ["HIGH", "CRITICAL"] or idx % 2 == 0:
                seq_v += 1
                v_id = f"VL-{seq_v}"
                is_crit = mine.risk_level in ["HIGH", "CRITICAL"]
                sev = "CRITICAL" if is_crit else ("HIGH" if idx % 3 == 0 else "MEDIUM")
                stat = "OVERDUE" if is_crit and idx % 2 == 0 else ("OPEN" if idx % 2 == 0 else "RESOLVED")
                
                v = Violation(
                    id=v_id,
                    mine_id=mine.id,
                    mine_name=mine.name,
                    district_id=mine.district_id,
                    district=dist_name,
                    category=categories[idx % len(categories)],
                    source="INSPECTION" if idx % 3 == 0 else "SATELLITE",
                    description=descriptions[idx % len(descriptions)],
                    severity=sev,
                    status=stat,
                    date_issued=f"2026-09-{10 + (idx % 18):02d}",
                    deadline=f"2026-10-{15 + (idx % 15):02d}",
                    penalty=25000.0 * ((idx % 4) + 1),
                    assigned_to=inspectors[idx % len(inspectors)],
                    latitude=mine.latitude,
                    longitude=mine.longitude,
                    evidence_type="inspection_photo" if idx % 3 == 0 else "satellite",
                    evidence_url="/mine1.jpg" if idx % 3 == 0 else "/violation.jpg",
                    aging=15 + (idx % 20)
                )
                db.add(v)

                # Corrective Action linked to this violation
                seq_a += 1
                ca = CorrectiveAction(
                    id=f"CA-{seq_a}",
                    mine_id=mine.id,
                    mine_name=mine.name,
                    violation_id=v_id,
                    district_id=mine.district_id,
                    district=dist_name,
                    title=f"Remediate {categories[idx % len(categories)].lower()} condition at {mine.name}",
                    assigned_to=inspectors[idx % len(inspectors)],
                    deadline=f"2026-10-{20 + (idx % 10):02d}",
                    status="OPEN" if stat != "RESOLVED" else "COMPLETED",
                    priority="CRITICAL" if is_crit else "HIGH",
                    days_remaining=12 - (idx % 10)
                )
                db.add(ca)

            # Inspections (1 per mine)
            seq_ins += 1
            ins = Inspection(
                id=f"INS-{seq_ins}",
                mine_id=mine.id,
                mine_name=mine.name,
                district_id=mine.district_id,
                district=dist_name,
                inspector=inspectors[idx % len(inspectors)],
                date=mine.last_inspection or "2026-10-01",
                type=categories[(idx + 1) % len(categories)],
                status="COMPLETED",
                score=mine.compliance_score,
                findings=1 if mine.risk_level == "HIGH" else 0,
                critical=1 if mine.risk_level == "CRITICAL" else 0,
                remarks=f"Standard environmental and safety audit executed at {mine.name}.",
                photo_url="/mine1.jpg",
                latitude=mine.latitude,
                longitude=mine.longitude
            )
            db.add(ins)

            # Compliance Items
            seq_cr += 1
            cr = ComplianceRecord(
                id=f"CR-{seq_cr}",
                mine_id=mine.id,
                mine_name=mine.name,
                district_id=mine.district_id,
                district=dist_name,
                requirement="Quarterly Ground Water & Air Quality Analysis",
                category="Environment",
                frequency="Quarterly",
                due_date="2026-11-15",
                status="COMPLIANT" if mine.compliance_score >= 80 else "PENDING"
            )
            db.add(cr)

        db.commit()
        print("Database successfully seeded with authentic Tamil Nadu mining data!")

    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()

