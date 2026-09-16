import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  startProcessing,
  processingSuccess,
  processingFailure,
} from "./complaintSlice";

import "./App.css";

function App() {
  const [customerName, setCustomerName] = useState("");
  const [complaintText, setComplaintText] = useState("");
  const [showLedger, setShowLedger] = useState(false);
  const [ledger, setLedger] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const dispatch = useDispatch();

  const { loading, result, error } = useSelector(
    (state) => state.complaint
  );

  const processComplaint = async () => {
    if (!customerName.trim() || !complaintText.trim()) {
      dispatch(
        processingFailure(
          "Please enter customer name and complaint details."
        )
      );
      return;
    }

    dispatch(startProcessing());

    try {
      const response = await fetch(
         `${import.meta.env.VITE_API_URL}/api/complaints/commit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer_name: customerName,
            complaint_text: complaintText,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to process complaint"
        );
      }

      dispatch(processingSuccess(data));
    } catch (err) {
      dispatch(
        processingFailure(
          err.message || "Unable to connect to backend."
        )
      );
    }
  };

  const processPdfComplaint = async () => {
    if (!selectedPdf) {
      alert("Please choose a PDF complaint first.");
      return;
    }

    if (!customerName.trim()) {
      dispatch(
        processingFailure("Please enter customer / source before uploading the PDF.")
      );
      return;
    }

    dispatch(startProcessing());
    setPdfLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", selectedPdf);
      formData.append("customer_name", customerName);

      const response = await fetch(
        "http://127.0.0.1:8000/api/complaints/process-pdf",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to process PDF complaint"
        );
      }

      setComplaintText(data.complaint_text || data.extracted_text || "");
      dispatch(processingSuccess(data));
    } catch (err) {
      dispatch(
        processingFailure(
          err.message || "Unable to process PDF complaint."
        )
      );
    } finally {
      setPdfLoading(false);
    }
  };

  const loadLedger = async () => {
    setLedgerLoading(true);
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/complaints"
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to load complaint history");
      }

      setLedger(data);
      setShowLedger(true);
    } catch (err) {
      alert(err.message || "Unable to load QMS ledger.");
    } finally {
      setLedgerLoading(false);
    }
  };

  const commitComplaint = async () => {
    if (!result) return;

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/complaints/commit",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer_id: "CUST-001",
            customer_name: result.customer_name || customerName,
            email: "not-provided@example.com",
            complaint_text: complaintText,
            product: result.product || "Not provided",
            strength_grade: result.strength_grade || "Not provided",
            batch_lot: result.batch_lot || "Not provided",
            affected_quantity: result.affected_quantity || "Not provided",
            manufacturing_date: result.manufacturing_date || "Not provided",
            expiry_date: result.expiry_date || "Not provided",
            complaint_details: result.complaint_details || "Not provided",
            facility_material_impact: result.facility_material_impact || "Not provided",
            category: result.category || "Other",
            priority: result.priority || "Medium",
            summary: result.summary || "Not provided",
            suggested_resolution: result.suggested_resolution || "Not provided",
            risk_level: result.risk_level || "Medium",
            severity: result.severity || "Moderate",
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to commit complaint");
      }

      alert(`Complaint committed successfully!\nTicket ID: ${data.ticket_id}`);
      await loadLedger();
    } catch (err) {
      alert(err.message || "Unable to commit complaint.");
    }
  };

  return (
    <div className="app">

      {/* HEADER */}
      <header className="header">
        <div className="brand">
          <div className="logo">A</div>

          <div>
            <h1>AIVOA</h1>
            <p>AI Complaint Management System</p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
          <button
            onClick={loadLedger}
            disabled={ledgerLoading}
            style={{
              background: "transparent",
              border: "1px solid #7c3aed",
              color: "#d8b4fe",
              padding: "10px 16px",
              borderRadius: "10px",
              cursor: ledgerLoading ? "wait" : "pointer",
              fontWeight: 700
            }}
          >
            {ledgerLoading ? "LOADING..." : "QMS LEDGER"}
          </button>

          <div className="system-status">
            <span className="status-dot"></span>
            AI SYSTEM ONLINE
          </div>
        </div>
      </header>

      <main className="main">

        {/* HERO */}
        <section className="hero">
          <div>
            <p className="eyebrow">
              PHARMACEUTICAL QUALITY INTELLIGENCE
            </p>

            <h2>
              Customer Complaint
              <span> Management</span>
            </h2>

            <p className="hero-text">
              Transform customer complaints into structured quality
              records using AI-powered extraction and risk assessment.
            </p>
          </div>
        </section>

        {/* COMPLAINT INPUT */}
        <section className="input-card">

          <div className="section-heading">
            <div>
              <span className="step">01</span>

              <div>
                <h3>Complaint Intake</h3>
                <p>
                  Enter a complaint manually or upload a complaint PDF
                  for AI processing.
                </p>
              </div>
            </div>
          </div>

          <label>Customer / Source</label>

          <input
            type="text"
            placeholder="e.g. ABC Pharma Customer"
            value={customerName}
            onChange={(e) =>
              setCustomerName(e.target.value)
            }
          />

          <label>Customer Complaint</label>

          <textarea
            placeholder="Paste the complaint, email or complaint description here..."
            value={complaintText}
            onChange={(e) =>
              setComplaintText(e.target.value)
            }
          />

          <div
            style={{
              marginTop: "18px",
              padding: "16px",
              border: "1px dashed #4c3b61",
              borderRadius: "12px",
              background: "#11101a"
            }}
          >
            <label style={{ display: "block", marginBottom: "10px" }}>
              Complaint PDF Upload
            </label>

            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => setSelectedPdf(e.target.files?.[0] || null)}
            />

            <p style={{ color: "#8b8ba3", margin: "8px 0 12px", fontSize: "13px" }}>
              {selectedPdf
                ? `Selected: ${selectedPdf.name}`
                : "Choose a text-based complaint PDF."}
            </p>

            <button
              type="button"
              onClick={processPdfComplaint}
              disabled={pdfLoading || loading || !selectedPdf}
              style={{
                padding: "10px 16px",
                borderRadius: "10px",
                border: "1px solid #7c3aed",
                background: pdfLoading ? "#2a2140" : "#171222",
                color: "#e9d5ff",
                cursor:
                  pdfLoading || loading || !selectedPdf
                    ? "not-allowed"
                    : "pointer",
                fontWeight: 700
              }}
            >
              {pdfLoading ? "PROCESSING PDF..." : "UPLOAD & PROCESS PDF"}
            </button>
          </div>

          {error && (
            <div className="error">
              {error}
            </div>
          )}

          <button
            className="process-btn"
            onClick={processComplaint}
            disabled={loading || pdfLoading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                AI IS ANALYZING...
              </>
            ) : (
              <>✦ PROCESS WITH AI</>
            )}
          </button>

        </section>

        {/* RESULTS */}
        {result && (
          <>

            {/* LOG CUSTOMER COMPLAINT */}
            <section className="result-section">

              <div className="section-title">

                <span className="step">02</span>

                <div>
                  <h3>Log Customer Complaint</h3>
                  <p>
                    AI-extracted complaint information
                    {result.source_type === "PDF"
                      ? " • Source: PDF"
                      : ""}
                  </p>
                </div>

              </div>

              <div className="form-grid">

                <Field
                  label="Customer / Source"
                  value={result.customer_name}
                />

                <Field
                  label="Product"
                  value={result.product}
                />

                <Field
                  label="Strength / Grade"
                  value={result.strength_grade}
                />

                <Field
                  label="Batch / Lot"
                  value={result.batch_lot}
                />

                <Field
                  label="Affected Quantity"
                  value={result.affected_quantity}
                />

                <Field
                  label="Manufacturing Date"
                  value={result.manufacturing_date}
                />

                <Field
                  label="Expiry Date"
                  value={result.expiry_date}
                />

                <Field
                  label="Category"
                  value={result.category}
                />

                <Field
                  label="Priority"
                  value={result.priority}
                />

                <div className="field full">
                  <label>
                    Complaint / Defect Details
                  </label>

                  <textarea
                    value={
                      result.complaint_details ||
                      "Not provided"
                    }
                    readOnly
                  />
                </div>

                <div className="field full">
                  <label>
                    Facility / Material Impact
                  </label>

                  <textarea
                    value={
                      result.facility_material_impact ||
                      "Not provided"
                    }
                    readOnly
                  />
                </div>

                <div className="field full">
                  <label>
                    AI Summary
                  </label>

                  <textarea
                    value={
                      result.summary ||
                      "Not provided"
                    }
                    readOnly
                  />
                </div>

              </div>
            </section>

            {/* AI COPILOT */}
            <section className="copilot">

              <div className="copilot-header">

                <div className="copilot-icon">
                  ✦
                </div>

                <div>
                  <p className="copilot-label">
                    AI COPILOT
                  </p>

                  <h3>
                    Risk Assessment
                  </h3>
                </div>

                <div
                  className={`risk-badge ${
                    (result.risk_level || "Medium").toLowerCase()
                  }`}
                >
                  {result.risk_level || "Medium"} RISK
                </div>

              </div>

              <div className="risk-grid">

                <div className="risk-item">
                  <span>Risk Level</span>
                  <strong>
                    {result.risk_level || "Medium"}
                  </strong>
                </div>

                <div className="risk-item">
                  <span>Severity</span>
                  <strong>
                    {result.severity || "Moderate"}
                  </strong>
                </div>

                <div className="risk-item">
                  <span>Category</span>
                  <strong>
                    {result.category || "Other"}
                  </strong>
                </div>

                <div className="risk-item">
                  <span>Priority</span>
                  <strong>
                    {result.priority || "Medium"}
                  </strong>
                </div>

              </div>

              <div className="recommendation">
                <span>
                  AI RECOMMENDATION
                </span>

                <p>
                  {result.suggested_resolution ||
                    "Review complaint and initiate appropriate quality investigation."}
                </p>
              </div>

            </section>

            {/* COMMIT */}
            <section className="commit-card">

              <div>
                <span className="ready-dot"></span>

                <div>
                  <h3>
                    Complaint Ready for Review
                  </h3>

                  <p>
                    AI processing completed. Review the
                    generated complaint record before
                    committing it to the QMS ledger.
                  </p>
                </div>
              </div>

              <button className="commit-btn" onClick={commitComplaint}>
                READY TO COMMIT →
              </button>

            </section>

          </>
        )}

      </main>

      {showLedger && (
        <section
          style={{
            maxWidth: "1260px",
            margin: "28px auto 40px",
            padding: "24px",
            background: "#0d0d16",
            border: "1px solid #30233f",
            borderRadius: "18px",
            overflowX: "auto"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <div>
              <p style={{ margin: 0, color: "#a78bfa", fontWeight: 800, fontSize: "12px", letterSpacing: "1.5px" }}>QMS</p>
              <h2 style={{ margin: "5px 0", color: "white" }}>Complaint History / QMS Ledger</h2>
              <p style={{ margin: 0, color: "#8b8ba3" }}>Committed complaints retrieved from the backend database.</p>
            </div>

            <button
              onClick={() => setShowLedger(false)}
              style={{ background: "transparent", border: "1px solid #3b3447", color: "#aaa", padding: "8px 12px", borderRadius: "8px", cursor: "pointer" }}
            >
              CLOSE
            </button>
          </div>

          {ledger.length === 0 ? (
            <p style={{ color: "#aaa" }}>No committed complaints found.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", color: "#eee", minWidth: "900px" }}>
              <thead>
                <tr>
                  {["Ticket ID", "Customer", "Product", "Category", "Priority", "Risk", "Severity", "Status"].map((heading) => (
                    <th key={heading} style={{ textAlign: "left", padding: "12px", borderBottom: "1px solid #332941", color: "#a78bfa", fontSize: "12px" }}>{heading}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {ledger.map((item) => (
                  <tr key={item.ticket_id}>
                    <td style={{ padding: "13px 12px", borderBottom: "1px solid #211c29", fontWeight: 800 }}>{item.ticket_id}</td>
                    <td style={{ padding: "13px 12px", borderBottom: "1px solid #211c29" }}>{item.customer_name}</td>
                    <td style={{ padding: "13px 12px", borderBottom: "1px solid #211c29" }}>{item.product || "Not provided"}</td>
                    <td style={{ padding: "13px 12px", borderBottom: "1px solid #211c29" }}>{item.category}</td>
                    <td style={{ padding: "13px 12px", borderBottom: "1px solid #211c29" }}>{item.priority}</td>
                    <td style={{ padding: "13px 12px", borderBottom: "1px solid #211c29" }}>{item.risk_level}</td>
                    <td style={{ padding: "13px 12px", borderBottom: "1px solid #211c29" }}>{item.severity}</td>
                    <td style={{ padding: "13px 12px", borderBottom: "1px solid #211c29" }}>{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}

      <footer>
        AIVOA • AI-Powered Customer Complaint Management System
      </footer>

    </div>
  );
}

function Field({ label, value }) {
  return (
    <div className="field">
      <label>{label}</label>
      <input
        value={value || "Not provided"}
        readOnly
      />
    </div>
  );
}

export default App;
