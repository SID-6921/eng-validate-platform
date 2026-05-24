"use client";

import { useEffect, useState } from "react";

type Severity = "critical" | "high" | "medium" | "low";

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

type DraftRow = {
  key: string;
  nominal_mm: number;
  tolerance_plus_mm: number;
  tolerance_minus_mm: number;
  measured_mm: number;
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
  const [compareLoading, setCompareLoading] = useState(false);
  const [casesLoading, setCasesLoading] = useState(false);
  const [comparison, setComparison] = useState<MeasurementComparisonResponse | null>(null);
  const [cases, setCases] = useState<ConstructionReferenceCase[]>([]);
  const [designName, setDesignName] = useState("G+12 Tower Draft - Block A");
  const [standardProfile, setStandardProfile] = useState("India-NBC-IS");
  const [manualRowsText, setManualRowsText] = useState(
    [
      "B1-depth,900,4,4,906.5",
      "B1-width,450,3,3,451.2",
      "C3-column-size,800,5,5,793.8",
      "SLAB-T1,180,2,2,177.4",
    ].join("\n")
  );

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

  const parseManualRows = (raw: string): DraftRow[] => {
    const lines = raw
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const rows: DraftRow[] = [];

    for (const line of lines) {
      const [key, nominal, tolPlus, tolMinus, measured] = line.split(",").map((item) => item.trim());
      if (!key || !nominal || !tolPlus || !tolMinus || !measured) {
        throw new Error(`Invalid row format: '${line}'`);
      }

      rows.push({
        key,
        nominal_mm: Number(nominal),
        tolerance_plus_mm: Number(tolPlus),
        tolerance_minus_mm: Number(tolMinus),
        measured_mm: Number(measured),
      });
    }

    if (rows.some((row) => Number.isNaN(row.nominal_mm) || Number.isNaN(row.tolerance_plus_mm) || Number.isNaN(row.tolerance_minus_mm) || Number.isNaN(row.measured_mm))) {
      throw new Error("All numeric fields must be valid numbers.");
    }

    return rows;
  };

  const runDraftComparison = async () => {
    setCompareLoading(true);
    setComparison(null);

    try {
      const rows = parseManualRows(manualRowsText);
      const payload = {
        design_name: designName,
        standard_profile: standardProfile,
        draft_dimensions: rows.map((row) => ({
          key: row.key,
          nominal_mm: row.nominal_mm,
          tolerance_plus_mm: row.tolerance_plus_mm,
          tolerance_minus_mm: row.tolerance_minus_mm,
        })),
        measured_dimensions: rows.map((row) => ({
          key: row.key,
          value_mm: row.measured_mm,
        })),
      };

      const res = await fetch(`${API_BASE}/api/v1/compare-measurements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as MeasurementComparisonResponse;
      setComparison(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not run draft vs measured comparison.";
      alert(message);
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
        <h1>Construction Design Standard Checker</h1>
        <p className="small">
          Load a construction draft, enter manual field dimensions, and check against IS/NBC-based tolerance and compliance triggers.
        </p>
      </section>

      <section className="panel grid" style={{ gap: 12 }}>
        <h2>Draft Input and Manual Measurements</h2>
        <p className="small">Enter each line as: key,nominal_mm,tol_plus_mm,tol_minus_mm,measured_mm</p>
        <div className="grid grid-two">
          <input value={designName} onChange={(event) => setDesignName(event.target.value)} placeholder="Draft design name" />
          <select value={standardProfile} onChange={(event) => setStandardProfile(event.target.value)}>
            <option value="India-NBC-IS">India-NBC-IS</option>
            <option value="India-IS456-RCC">India-IS456-RCC</option>
            <option value="India-IS800-Steel">India-IS800-Steel</option>
          </select>
        </div>
        <textarea
          value={manualRowsText}
          onChange={(event) => setManualRowsText(event.target.value)}
          rows={8}
          placeholder="B1-depth,900,4,4,906.5"
        />
        <button onClick={runDraftComparison} disabled={compareLoading}>
          {compareLoading ? "Checking Standards..." : "Check Draft Against Standards"}
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

      <section className="panel grid" style={{ gap: 8 }}>
        <h2>Construction Draft References</h2>
        <p className="small">Use these as baseline draft cases for manual input and standards checking.</p>
        <button onClick={loadIndiaConstructionCases} disabled={casesLoading}>
          {casesLoading ? "Loading..." : "Load Construction Cases"}
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
