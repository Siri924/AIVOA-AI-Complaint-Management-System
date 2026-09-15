import json
import os
from typing import TypedDict

from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langgraph.graph import StateGraph, START, END

load_dotenv()


# ============================================================
# COMPLAINT STATE
# ============================================================

class ComplaintState(TypedDict, total=False):

    customer_name: str
    complaint_text: str

    product: str
    strength_grade: str
    batch_lot: str
    affected_quantity: str
    manufacturing_date: str
    expiry_date: str
    complaint_details: str
    facility_material_impact: str

    category: str
    priority: str
    summary: str
    suggested_resolution: str

    risk_level: str
    severity: str


# ============================================================
# GROQ LLM
# ============================================================

def get_llm():

    api_key = os.getenv("GROQ_API_KEY")

    if not api_key:
        raise ValueError(
            "GROQ_API_KEY is missing from environment variables."
        )

    model = os.getenv(
        "GROQ_MODEL",
        "openai/gpt-oss-20b"
    )

    return ChatGroq(
        model=model,
        temperature=0.1,
        groq_api_key=api_key,
        max_retries=2
    )


# ============================================================
# AI COMPLAINT ANALYSIS NODE
# ============================================================

def analyze_complaint(state: ComplaintState):

    llm = get_llm()

    complaint = state.get("complaint_text", "")
    customer = state.get("customer_name", "")

    prompt = f"""
You are an AI Complaint Management Agent for a
pharmaceutical manufacturing company.

Analyze the customer complaint carefully.

CUSTOMER / SOURCE:
{customer}

CUSTOMER COMPLAINT:
{complaint}

Extract all available information.

Return ONLY valid JSON.
Do not use markdown.
Do not use code blocks.

Use EXACTLY these fields:

{{
    "product": "",
    "strength_grade": "",
    "batch_lot": "",
    "affected_quantity": "",
    "manufacturing_date": "",
    "expiry_date": "",
    "complaint_details": "",
    "facility_material_impact": "",
    "category": "",
    "priority": "",
    "summary": "",
    "suggested_resolution": ""
}}

IMPORTANT RULES:

1. Extract information only when it is present.
2. Never invent product names, batch numbers, dates,
   quantities or other factual information.
3. If a factual field is not available, use:
   "Not provided".

CATEGORY MUST BE ONE OF:

Product Quality
Packaging
Delivery
Documentation
Safety
Manufacturing
Other

PRIORITY MUST ALWAYS BE ONE OF:

Low
Medium
High
Critical

NEVER return "Not provided" for priority.

PRIORITY GUIDELINES:

- Low:
  minor issue with little or no product impact.

- Medium:
  moderate complaint requiring investigation.

- High:
  defective product, damaged packaging, unreadable
  labels, incorrect information, batch problems,
  significant quantity affected, or quality concerns.

- Critical:
  serious safety concern, contamination,
  serious adverse event, potentially dangerous product,
  or major regulatory risk.

For example:
Damaged labels + unreadable batch number
should normally be High priority.

complaint_details:
Clearly describe the reported defect/problem.

facility_material_impact:
Describe impact on manufacturing facility,
materials, inventory or production if mentioned.
Otherwise use "Not provided".

summary:
Create a short professional complaint summary.

suggested_resolution:
Give an appropriate immediate quality action.

Now analyze the complaint.
"""

    response = llm.invoke(prompt)

    content = str(response.content).strip()

    # Remove accidental markdown code fences
    content = content.replace("```json", "")
    content = content.replace("```", "")
    content = content.strip()

    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        raise ValueError(
            "AI returned invalid JSON. Response was: "
            + content
        )

    # --------------------------------------------------------
    # Store extracted fields
    # --------------------------------------------------------

    fields = [
        "product",
        "strength_grade",
        "batch_lot",
        "affected_quantity",
        "manufacturing_date",
        "expiry_date",
        "complaint_details",
        "facility_material_impact",
        "category",
        "priority",
        "summary",
        "suggested_resolution"
    ]

    for field in fields:

        value = data.get(field)

        if value is None or str(value).strip() == "":
            value = "Not provided"

        state[field] = str(value)


    # --------------------------------------------------------
    # Safety fallback for priority
    # --------------------------------------------------------

    priority = state.get("priority", "").strip()

    valid_priorities = {
        "Low",
        "Medium",
        "High",
        "Critical"
    }

    if priority not in valid_priorities:

        complaint_lower = complaint.lower()

        high_keywords = [
            "damaged",
            "defective",
            "unreadable",
            "incorrect",
            "broken",
            "leaking",
            "label",
            "batch",
            "quality",
            "contamination"
        ]

        critical_keywords = [
            "contaminated",
            "adverse event",
            "serious injury",
            "death",
            "dangerous",
            "patient safety"
        ]

        if any(
            keyword in complaint_lower
            for keyword in critical_keywords
        ):
            state["priority"] = "Critical"

        elif any(
            keyword in complaint_lower
            for keyword in high_keywords
        ):
            state["priority"] = "High"

        else:
            state["priority"] = "Medium"


    return state


# ============================================================
# AI RISK ASSESSMENT NODE
# ============================================================

def assess_risk(state: ComplaintState):

    llm = get_llm()

    complaint_details = state.get(
        "complaint_details",
        state.get("complaint_text", "")
    )

    prompt = f"""
You are an AI Risk Assessment Agent for a
pharmaceutical customer complaint management system.

Evaluate the complaint using the information below.

COMPLAINT:
{complaint_details}

CATEGORY:
{state.get("category", "Other")}

PRIORITY:
{state.get("priority", "Medium")}

AFFECTED QUANTITY:
{state.get("affected_quantity", "Not provided")}

FACILITY / MATERIAL IMPACT:
{state.get("facility_material_impact", "Not provided")}

Return ONLY valid JSON.

Do not use markdown.
Do not use code blocks.

Return exactly:

{{
    "risk_level": "",
    "severity": ""
}}

risk_level MUST be one of:

Low
Medium
High
Critical

severity MUST be one of:

Minor
Moderate
Major
Critical

Use the complaint severity and pharmaceutical
quality/safety implications to determine the result.
"""

    response = llm.invoke(prompt)

    content = str(response.content).strip()

    content = content.replace("```json", "")
    content = content.replace("```", "")
    content = content.strip()

    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        raise ValueError(
            "Risk assessment returned invalid JSON."
        )

    valid_risks = {
        "Low",
        "Medium",
        "High",
        "Critical"
    }

    valid_severity = {
        "Minor",
        "Moderate",
        "Major",
        "Critical"
    }

    risk = str(
        data.get("risk_level", "")
    ).strip()

    severity = str(
        data.get("severity", "")
    ).strip()

    if risk not in valid_risks:
        risk = state.get("priority", "Medium")

        if risk not in valid_risks:
            risk = "Medium"

    if severity not in valid_severity:
        severity = "Moderate"

    state["risk_level"] = risk
    state["severity"] = severity

    return state


# ============================================================
# LANGGRAPH
# ============================================================

def build_complaint_graph():

    graph = StateGraph(ComplaintState)

    graph.add_node(
        "analyze_complaint",
        analyze_complaint
    )

    graph.add_node(
        "assess_risk",
        assess_risk
    )

    # Workflow:
    #
    # START
    #   ↓
    # Complaint Analysis
    #   ↓
    # Risk Assessment
    #   ↓
    # END

    graph.add_edge(
        START,
        "analyze_complaint"
    )

    graph.add_edge(
        "analyze_complaint",
        "assess_risk"
    )

    graph.add_edge(
        "assess_risk",
        END
    )

    return graph.compile()


# ============================================================
# MAIN PROCESSING FUNCTION
# ============================================================

def process_with_llm(state):

    complaint_graph = build_complaint_graph()

    result = complaint_graph.invoke(state)

    return result