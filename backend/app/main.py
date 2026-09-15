from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from uuid import uuid4
from io import BytesIO

from app.agent import process_with_llm
from app.database import SessionLocal, Base, engine
from app.models import ComplaintRecord

try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None


app = FastAPI(title="AIVOA AI-Powered Customer Complaint Management System")

# Create all SQLAlchemy tables in PostgreSQL
Base.metadata.create_all(bind=engine)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ComplaintRequest(BaseModel):
    customer_name: str
    complaint_text: str


class CommitRequest(BaseModel):
    customer_id: str = "CUST-001"
    customer_name: str
    email: str = "not-provided@example.com"
    complaint_text: str
    product: str = "Not provided"
    strength_grade: str = "Not provided"
    batch_lot: str = "Not provided"
    affected_quantity: str = "Not provided"
    manufacturing_date: str = "Not provided"
    expiry_date: str = "Not provided"
    complaint_details: str = "Not provided"
    facility_material_impact: str = "Not provided"
    category: str
    priority: str
    summary: str
    suggested_resolution: str
    risk_level: str = "Medium"
    severity: str = "Moderate"


@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "AIVOA Complaint Management System API"
    }


@app.post("/api/complaints/process")
def process_complaint(payload: ComplaintRequest):
    try:
        initial_state = {
            "customer_name": payload.customer_name,
            "complaint_text": payload.complaint_text,
        }
        result = process_with_llm(initial_state)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/complaints/process-pdf")
async def process_complaint_pdf(
    file: UploadFile = File(...),
    customer_name: str = Form("PDF Complaint Source"),
):
    """Extract text from a complaint PDF and run the same LangGraph workflow."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="Please select a PDF file.")

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    if PdfReader is None:
        raise HTTPException(
            status_code=500,
            detail="PDF support is not installed. Run: python -m pip install pypdf"
        )

    try:
        pdf_bytes = await file.read()

        if not pdf_bytes:
            raise HTTPException(
                status_code=400,
                detail="The uploaded PDF is empty."
            )

        reader = PdfReader(BytesIO(pdf_bytes))
        pages = []

        for page in reader.pages:
            pages.append(page.extract_text() or "")

        complaint_text = "\n".join(pages).strip()

        if not complaint_text:
            raise HTTPException(
                status_code=400,
                detail="No readable text was found in the PDF."
            )

        result = process_with_llm({
            "customer_name": customer_name,
            "complaint_text": complaint_text,
        })

        result["source_type"] = "PDF"
        result["source_filename"] = file.filename
        result["extracted_text"] = complaint_text

        return result

    except HTTPException:
        raise

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"PDF processing failed: {str(e)}"
        )


@app.post("/api/complaints/commit")
def commit_complaint(payload: CommitRequest):
    db = SessionLocal()

    try:
        ticket_id = "CMP-" + uuid4().hex[:8].upper()

        complaint = ComplaintRecord(
            ticket_id=ticket_id,
            customer_id=payload.customer_id,
            customer_name=payload.customer_name,
            email=payload.email,
            complaint_text=payload.complaint_text,
            product=payload.product,
            strength_grade=payload.strength_grade,
            batch_lot=payload.batch_lot,
            affected_quantity=payload.affected_quantity,
            manufacturing_date=payload.manufacturing_date,
            expiry_date=payload.expiry_date,
            complaint_details=payload.complaint_details,
            facility_material_impact=payload.facility_material_impact,
            category=payload.category,
            priority=payload.priority,
            summary=payload.summary,
            suggested_resolution=payload.suggested_resolution,
            risk_level=payload.risk_level,
            severity=payload.severity,
            status="Committed",
        )

        db.add(complaint)
        db.commit()
        db.refresh(complaint)

        return {
            "success": True,
            "message": "Complaint committed successfully.",
            "ticket_id": complaint.ticket_id,
            "status": complaint.status,
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        db.close()


@app.get("/api/complaints")
def get_complaints():
    db = SessionLocal()

    try:
        complaints = (
            db.query(ComplaintRecord)
            .order_by(ComplaintRecord.created_at.desc())
            .all()
        )
        return complaints

    finally:
        db.close()


@app.get("/api/complaints/{ticket_id}")
def get_complaint(ticket_id: str):
    db = SessionLocal()

    try:
        complaint = (
            db.query(ComplaintRecord)
            .filter(ComplaintRecord.ticket_id == ticket_id)
            .first()
        )

        if not complaint:
            raise HTTPException(
                status_code=404,
                detail="Complaint not found."
            )

        return complaint

    finally:
        db.close()