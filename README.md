# AIVOA – AI-Powered Customer Complaint Management System

## Overview

AIVOA is an AI-powered customer complaint management system designed for pharmaceutical manufacturing.

The system converts customer complaints into structured complaint records using AI-based information extraction and risk assessment.

## Technology Stack

- Frontend: React + Redux
- Backend: Python FastAPI
- AI Agent Framework: LangGraph
- LLM: Groq
- Database: SQLite (development)
- PDF Processing: pypdf
- Styling: Google Inter

## Key Features

### 1. Complaint Intake
Users can enter customer/source information and complaint details manually.

### 2. AI Complaint Processing
The AI extracts important complaint information such as:
- Product
- Strength / Grade
- Batch / Lot
- Affected Quantity
- Manufacturing Date
- Expiry Date
- Complaint Details
- Category
- Priority
- Summary
- Suggested Resolution

### 3. AI Risk Assessment
The system evaluates:
- Risk Level
- Severity
- Category
- Priority

### 4. PDF Complaint Upload
Users can upload a text-based complaint PDF. The backend extracts the PDF text and sends it through the same AI processing workflow.

### 5. QMS Ledger
Committed complaints are stored and displayed through the Complaint History / QMS Ledger.

### 6. Ticket Generation
Each committed complaint receives a unique complaint ticket ID.

## Workflow

```text
Customer Complaint / PDF
          ↓
      React + Redux
          ↓
       FastAPI API
          ↓
      LangGraph Agent
          ↓
     Groq LLM Analysis
          ↓
   Complaint Information
          ↓
     AI Risk Assessment
          ↓
     Review / Commit
          ↓
       QMS Ledger