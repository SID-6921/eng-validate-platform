"use client";

import { useState } from "react";

type Severity = "critical" | "high" | "medium" | "low";

type Finding = {
  id: string;
  category: string;
  message: string;
  why: string;
  severity: Severity;
  recommended_fix: string;
  cost_risk_impact: string;
  violated_standard?: string;
};

type ResponsePayload = {
  design_name: string;
  readiness_score: number;
  status: string;
  findings: Finding[];
  recommendations: string[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResponsePayload | null>(null);

  const runValidation = async () => {
    setLoading(true);
    setResult(null);

    const payload = {
      design_name: "Hydraulic Mount Bracket v3",
      dimensions_complete: false,
      tolerance_mm: 0.65,
      allowed_tolerance_mm: 0.4,
      material: "AL-2024",
      approved_materials: ["SS-316", "AL-6061", "HSLA-50"],
      max_load_kn: 75,
      expected_load_kn: 82,
      has_safety_annotations: false,
      selected_standards: ["ISO", "ASTM", "OSHA", "Internal-SOP"],
    };

    try {
      const res = await fetch(`${API_BASE}/api/v1/validate-design`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as ResponsePayload;
      setResult(data);
    } catch {
      setResult(null);
      alert("Could not connect to backend API. Ensure backend is running on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid" style={{ gap: 20 }}>
      <section className="panel grid" style={{ gap: 8 }}>
        <h1>Engineering Compliance & Manufacturing Validation</h1>
        <p className="small">
          Automated pre-production review for dimensions, tolerances, standards, structural limits, and manufacturing readiness.
        </p>
      </section>

      <section className="panel grid" style={{ gap: 12 }}>
        <h2>Run Sample Validation</h2>
        <p className="small">Click to simulate analysis of a design package with intentional compliance and structural issues.</p>
        <button onClick={runValidation} disabled={loading}>
          {loading ? "Analyzing..." : "Analyze Design"}
        </button>
      </section>

      {result && (
        <>
          <section className="grid grid-two">
            <div className="panel">
              <h3>Design</h3>
              <p>{result.design_name}</p>
              <p className="small">Status: {result.status}</p>
            </div>
            <div className="panel">
              <h3>Readiness Score</h3>
              <p style={{ fontSize: 28, fontWeight: 700 }}>{result.readiness_score} / 100</p>
            </div>
          </section>

          <section className="panel grid" style={{ gap: 12 }}>
            <h2>Findings</h2>
            {result.findings.map((finding) => (
              <article key={finding.id} className="panel" style={{ borderStyle: "dashed" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <strong>{finding.message}</strong>
                  <span className={`badge ${finding.severity}`}>{finding.severity}</span>
                </div>
                <p className="small">{finding.why}</p>
                <p className="small"><strong>Recommended fix:</strong> {finding.recommended_fix}</p>
                <p className="small"><strong>Cost/Risk impact:</strong> {finding.cost_risk_impact}</p>
                {finding.violated_standard && <p className="small"><strong>Violated standard:</strong> {finding.violated_standard}</p>}
              </article>
            ))}
          </section>

          <section className="panel grid" style={{ gap: 8 }}>
            <h2>Smart Recommendations</h2>
            {result.recommendations.map((item) => (
              <p key={item} className="small">- {item}</p>
            ))}
          </section>
        </>
      )}
    </main>
  );
}
