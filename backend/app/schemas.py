from pydantic import BaseModel, EmailStr
from typing import Optional

class ComplaintRequest(BaseModel):
    customer_id: str
    customer_name: str
    email: EmailStr
    complaint_text: str

class ComplaintStatusUpdate(BaseModel):
    status: str  # Options: 'Processed', 'In Progress', 'Resolved', 'Closed'

class ComplaintResponse(BaseModel):
    id: int
    ticket_id: str
    customer_id: str
    customer_name: str
    email: str
    complaint_text: str
    category: str
    priority: str
    summary: str
    suggested_resolution: str
    status: str

    class Config:
        from_attributes = True