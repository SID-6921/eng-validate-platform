"use client";

import { useEffect, useState } from "react";

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

type ComparisonResult = {
  key: string;
  nominal_mm: number;
  measured_mm: number;
  deviation_mm: number;
  min_allowed_mm: number;
  max_allowed_mm: number;
  pass_check: boolean;
};

type StandardsTrigger = {
  trigger_id: string;
  severity: Severity;
  title: string;
  standard_ref: string;
  detail: string;
  recommended_action: string;
};

type MeasurementComparisonResponse = {
  design_name: string;
  compared_count: number;
  pass_count: number;
  fail_count: number;
  overall_status: string;
  results: ComparisonResult[];
  standards_triggers: StandardsTrigger[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export default function HomePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResponsePayload | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [casesLoading, setCasesLoading] = useState(false);
  const [comparison, setComparison] = useState<MeasurementComparisonResponse | null>(null);
  const [sources, setSources] = useState<DesignSource[]>([]);
  const [cases, setCases] = useState<ConstructionReferenceCase[]>([]);

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

  const runDraftComparison = async () => {
    setCompareLoading(true);
    setComparison(null);

    const payload = {
      design_name: "Airport Concourse Beam Grid Draft-A",
      standard_profile: "India-NBC-IS",
      draft_dimensions: [
        { key: "B1-depth", nominal_mm: 900, tolerance_plus_mm: 4, tolerance_minus_mm: 4 },
        { key: "B1-width", nominal_mm: 450, tolerance_plus_mm: 3, tolerance_minus_mm: 3 },
        { key: "C3-column-size", nominal_mm: 800, tolerance_plus_mm: 5, tolerance_minus_mm: 5 },
        { key: "SLAB-T1", nominal_mm: 180, tolerance_plus_mm: 2, tolerance_minus_mm: 2 },
      ],
      measured_dimensions: [
        { key: "B1-depth", value_mm: 906.5 },
        { key: "B1-width", value_mm: 451.2 },
        { key: "C3-column-size", value_mm: 793.8 },
      ],
    };

    try {
      const res = await fetch(`${API_BASE}/api/v1/compare-measurements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as MeasurementComparisonResponse;
      setComparison(data);
    } catch {
      alert("Could not run draft vs measured comparison.");
    } finally {
      setCompareLoading(false);
    }
  };

  useEffect(() => {
    loadIndiaConstructionCases();
  }, []);

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

      <section className="panel grid" style={{ gap: 12 }}>
        <h2>Draft Design vs Measured Comparison</h2>
        <p className="small">Runs full measurement comparison and pops up standards triggers when tolerance or completeness fails.</p>
        <button onClick={runDraftComparison} disabled={compareLoading}>
          {compareLoading ? "Comparing..." : "Compare Draft vs Measured"}
        </button>
      </section>

      {comparison && (
        <section className="panel grid" style={{ gap: 10 }}>
          <h2>Comparison Outcome</h2>
          <p className="small">
            Design: {comparison.design_name} | Status: <strong>{comparison.overall_status}</strong> | Pass: {comparison.pass_count} | Fail: {comparison.fail_count}
          </p>

          {comparison.standards_triggers.length > 0 && (
            <>
              <h3>Standards Triggers (Pop-up Alerts)</h3>
              {comparison.standards_triggers.map((trigger) => (
                <article key={trigger.trigger_id} className="panel" style={{ border: "1px solid #f7b4b4", background: "#fff5f5" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <strong>{trigger.title}</strong>
                    <span className={`badge ${trigger.severity}`}>{trigger.severity}</span>
                  </div>
                  <p className="small"><strong>Standard:</strong> {trigger.standard_ref}</p>
                  <p className="small">{trigger.detail}</p>
                  <p className="small"><strong>Action:</strong> {trigger.recommended_action}</p>
                </article>
              ))}
            </>
          )}

          <h3>Dimension-by-Dimension Check</h3>
          {comparison.results.map((row) => (
            <article key={row.key} className="panel" style={{ borderStyle: "dashed" }}>
              <p>
                <strong>{row.key}</strong> | nominal {row.nominal_mm} mm | measured {row.measured_mm} mm | deviation {row.deviation_mm} mm
              </p>
              <p className="small">Allowed range: {row.min_allowed_mm} to {row.max_allowed_mm} mm</p>
              <p className="small">Result: {row.pass_check ? "PASS" : "FAIL"}</p>
            </article>
          ))}
        </section>
      )}

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
        <p className="small">Preloaded construction-only demo cases for airport, buildings, bridges, metro, warehouse, and utilities.</p>
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
