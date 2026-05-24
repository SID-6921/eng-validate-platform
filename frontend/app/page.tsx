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

type ProcessSuggestionResponse = {
  design_name: string;
  recommended_process: string;
  reasoning: string[];
  suggested_tolerance_band_mm: string;
  standards_to_check: string[];
  production_risks: string[];
};

type DesignSource = {
  name: string;
  url: string;
  category: string;
  notes: string;
};

type ConstructionReferenceCase = {
  case_id: string;
  sector: string;
  design_name: string;
  target_status: string;
  summary: string;
  key_inputs: Record<string, string | number>;
  expected_issues: string[];
  standards: string[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResponsePayload | null>(null);
  const [processLoading, setProcessLoading] = useState(false);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [casesLoading, setCasesLoading] = useState(false);
  const [processResult, setProcessResult] = useState<ProcessSuggestionResponse | null>(null);
  const [sources, setSources] = useState<DesignSource[]>([]);
  const [cases, setCases] = useState<ConstructionReferenceCase[]>([]);

  const [form, setForm] = useState({
    design_name: "Motor Mount Plate",
    process_family: "metal",
    part_length_mm: 220,
    part_width_mm: 130,
    part_height_mm: 18,
    min_feature_mm: 1.2,
    tolerance_mm: 0.05,
    annual_volume: 3200,
    material: "AL-6061",
  });

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

  const runProcessSuggestion = async () => {
    setProcessLoading(true);
    setProcessResult(null);

    try {
      const res = await fetch(`${API_BASE}/api/v1/suggest-process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await res.json()) as ProcessSuggestionResponse;
      setProcessResult(data);
    } catch {
      alert("Could not connect to process suggestion API.");
    } finally {
      setProcessLoading(false);
    }
  };

  const loadDesignSources = async () => {
    setSourcesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/design-sources`);
      const data = (await res.json()) as DesignSource[];
      setSources(data);
    } catch {
      alert("Could not load online design sources.");
    } finally {
      setSourcesLoading(false);
    }
  };

  const loadIndiaConstructionCases = async () => {
    setCasesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/india-construction-cases`);
      const data = (await res.json()) as ConstructionReferenceCase[];
      setCases(data);
    } catch {
      alert("Could not load India construction reference cases.");
    } finally {
      setCasesLoading(false);
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

      <section className="panel grid" style={{ gap: 12 }}>
        <h2>Manufacturing Process Suggestion From Measurements</h2>
        <p className="small">Enter core dimensions and tolerance to get a standards-aware process recommendation.</p>
        <div className="grid grid-two">
          <input value={form.design_name} onChange={(e) => setForm({ ...form, design_name: e.target.value })} placeholder="Design name" />
          <input value={form.process_family} onChange={(e) => setForm({ ...form, process_family: e.target.value })} placeholder="Process family" />
          <input type="number" value={form.part_length_mm} onChange={(e) => setForm({ ...form, part_length_mm: Number(e.target.value) })} placeholder="Length (mm)" />
          <input type="number" value={form.part_width_mm} onChange={(e) => setForm({ ...form, part_width_mm: Number(e.target.value) })} placeholder="Width (mm)" />
          <input type="number" value={form.part_height_mm} onChange={(e) => setForm({ ...form, part_height_mm: Number(e.target.value) })} placeholder="Height (mm)" />
          <input type="number" value={form.min_feature_mm} onChange={(e) => setForm({ ...form, min_feature_mm: Number(e.target.value) })} placeholder="Min feature (mm)" />
          <input type="number" value={form.tolerance_mm} onChange={(e) => setForm({ ...form, tolerance_mm: Number(e.target.value) })} placeholder="Tolerance (mm)" />
          <input type="number" value={form.annual_volume} onChange={(e) => setForm({ ...form, annual_volume: Number(e.target.value) })} placeholder="Annual volume" />
          <input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} placeholder="Material" />
        </div>
        <button onClick={runProcessSuggestion} disabled={processLoading}>
          {processLoading ? "Evaluating..." : "Suggest Manufacturing Process"}
        </button>
      </section>

      {processResult && (
        <section className="panel grid" style={{ gap: 8 }}>
          <h2>Process Recommendation</h2>
          <p><strong>Recommended process:</strong> {processResult.recommended_process}</p>
          <p className="small"><strong>Suggested tolerance band:</strong> {processResult.suggested_tolerance_band_mm}</p>
          <h3>Reasoning</h3>
          {processResult.reasoning.map((item) => (
            <p key={item} className="small">- {item}</p>
          ))}
          <h3>Standards To Check</h3>
          {processResult.standards_to_check.map((item) => (
            <p key={item} className="small">- {item}</p>
          ))}
          <h3>Production Risks</h3>
          {processResult.production_risks.map((item) => (
            <p key={item} className="small">- {item}</p>
          ))}
        </section>
      )}

      <section className="panel grid" style={{ gap: 8 }}>
        <h2>Online Design Libraries</h2>
        <button onClick={loadDesignSources} disabled={sourcesLoading}>
          {sourcesLoading ? "Loading..." : "Load Online Design Sources"}
        </button>
        {sources.map((source) => (
          <article key={source.name} className="panel" style={{ borderStyle: "dashed" }}>
            <p><strong>{source.name}</strong> ({source.category})</p>
            <p className="small">{source.notes}</p>
            <a href={source.url} target="_blank" rel="noreferrer">{source.url}</a>
          </article>
        ))}
      </section>

      <section className="panel grid" style={{ gap: 8 }}>
        <h2>India Construction Reference Cases</h2>
        <p className="small">Ready-to-test cases for airport, customs cargo, and high-rise checks.</p>
        <button onClick={loadIndiaConstructionCases} disabled={casesLoading}>
          {casesLoading ? "Loading..." : "Load India Construction Cases"}
        </button>
        {cases.map((item) => (
          <article key={item.case_id} className="panel" style={{ borderStyle: "dashed" }}>
            <p>
              <strong>{item.case_id}</strong> - {item.design_name}
            </p>
            <p className="small">Sector: {item.sector}</p>
            <p className="small">Target status: {item.target_status}</p>
            <p className="small">{item.summary}</p>
            <p className="small"><strong>Expected issues:</strong> {item.expected_issues.length ? item.expected_issues.join("; ") : "None"}</p>
            <p className="small"><strong>Standards:</strong> {item.standards.join(", ")}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
