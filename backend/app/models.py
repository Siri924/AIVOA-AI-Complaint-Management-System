from sqlalchemy import Column, String, DateTime, Text
from datetime import datetime, timezone

from app.database import Base


class ComplaintRecord(Base):
    __tablename__ = "complaints"

    # Complaint identification
    ticket_id = Column(String, primary_key=True, index=True)

    # Customer information
    customer_id = Column(String, nullable=False)
    customer_name = Column(String, nullable=False)
    email = Column(String, nullable=False)

    # Original complaint
    complaint_text = Column(Text, nullable=False)

    # AI extracted pharmaceutical information
    product = Column(String, nullable=True)
    strength_grade = Column(String, nullable=True)
    batch_lot = Column(String, nullable=True)
    affected_quantity = Column(String, nullable=True)
    manufacturing_date = Column(String, nullable=True)
    expiry_date = Column(String, nullable=True)

    # Complaint analysis
    complaint_details = Column(Text, nullable=True)
    facility_material_impact = Column(Text, nullable=True)

    # AI classification
    category = Column(String, nullable=False)
    priority = Column(String, nullable=False)

    # AI output
    summary = Column(Text, nullable=False)
    suggested_resolution = Column(Text, nullable=False)

    # AI Copilot risk assessment
    risk_level = Column(String, nullable=True)
    severity = Column(String, nullable=True)

    # QMS status
    status = Column(String, default="Processed")

    # Timestamp
    created_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc)
    )