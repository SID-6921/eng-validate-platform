"use client";

import { useState } from "react";

type Severity = "critical" | "high" | "medium" | "low";

type DraftRow = {
  key: string;
  nominal_mm: number;
  tolerance_plus_mm: number;
  tolerance_minus_mm: number;
  measured_mm: number;
};

type DraftSample = {
  id: string;
  designName: string;
  standardProfile: string;
  notes: string;
  lines: string[];
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
  drawing_reference: string;
  compared_count: number;
  pass_count: number;
  fail_count: number;
  overall_status: string;
  results: ComparisonResult[];
  standards_triggers: StandardsTrigger[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const DRAFT_SAMPLES: DraftSample[] = [
  {
    id: "sample-airport-concourse",
    designName: "Airport Concourse Beam Grid - Sample",
    standardProfile: "India-NBC-IS",
    notes: "Airport concourse structural elements with one intentional out-of-tolerance measurement.",
    lines: [
      "B1-depth,900,4,4,906.5",
      "B1-width,450,3,3,451.2",
      "C3-column-size,800,5,5,803.1",
      "SLAB-T1,180,2,2,177.4",
    ],
  },
  {
    id: "sample-residential-tower",
    designName: "G+12 Residential Tower Core - Sample",
    standardProfile: "India-IS456-RCC",
    notes: "Core wall and slab checks for RCC building dimensions.",
    lines: [
      "CORE-WALL-W,300,3,3,299.8",
      "STAIR-TREAD,300,2,2,303.4",
      "STAIR-RISER,150,2,2,149.6",
      "SLAB-F2,150,2,2,146.9",
    ],
  },
  {
    id: "sample-steel-warehouse",
    designName: "Steel Warehouse Frame - Sample",
    standardProfile: "India-IS800-Steel",
    notes: "Steel frame and canopy member checks with one major violation.",
    lines: [
      "COL-A1,500,4,4,499.2",
      "RAFTER-R3,650,4,4,656.8",
      "PURLIN-P7,220,2,2,220.7",
      "CANOPY-C1,300,3,3,301.1",
    ],
  },
];

export default function HomePage() {
  const [compareLoading, setCompareLoading] = useState(false);
  const [comparison, setComparison] = useState<MeasurementComparisonResponse | null>(null);
  const [designName, setDesignName] = useState("G+12 Tower Draft - Block A");
  const [standardProfile, setStandardProfile] = useState("India-NBC-IS");
  const [drawingReference, setDrawingReference] = useState("ARCH-A-101 Rev 02");
  const [drawingType, setDrawingType] = useState("PDF/DWG");
  const [manualRowsText, setManualRowsText] = useState(
    [
      "B1-depth,900,4,4,906.5",
      "B1-width,450,3,3,451.2",
      "C3-column-size,800,5,5,793.8",
      "SLAB-T1,180,2,2,177.4",
    ].join("\n")
  );

  const loadSampleIntoEditor = (sample: DraftSample) => {
    setDesignName(sample.designName);
    setStandardProfile(sample.standardProfile);
    setDrawingReference(`${sample.designName} / Rev 01`);
    setManualRowsText(sample.lines.join("\n"));
    setComparison(null);
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
        drawing_reference: drawingReference,
        drawing_type: drawingType,
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

  let previewRows: DraftRow[] = [];
  let previewError = "";
  try {
    previewRows = parseManualRows(manualRowsText);
  } catch (error) {
    previewError = error instanceof Error ? error.message : "Invalid draft input";
  }

  return (
    <main className="grid" style={{ gap: 20 }}>
      <section className="panel grid" style={{ gap: 8 }}>
        <h1>Construction Design Standard Checker</h1>
        <p className="small">
          Load a construction draft, enter manual field dimensions, and check against IS/NBC-based tolerance and compliance triggers.
        </p>
      </section>

      <section className="panel grid" style={{ gap: 12 }}>
        <h2>Sample Construction Designs</h2>
        <p className="small">Pick a sample, edit measured values, then run standards check.</p>
        {DRAFT_SAMPLES.map((sample) => (
          <article key={sample.id} className="panel" style={{ borderStyle: "dashed" }}>
            <p><strong>{sample.designName}</strong></p>
            <p className="small">{sample.notes}</p>
            <button onClick={() => loadSampleIntoEditor(sample)}>
              Use This Sample
            </button>
          </article>
        ))}
      </section>

      <section className="panel grid" style={{ gap: 12 }}>
        <h2>Draft Input and Manual Measurements</h2>
        <p className="small">1) Add drawing reference, 2) enter manual measurements, 3) run standards check.</p>
        <div className="grid grid-two">
          <input value={designName} onChange={(event) => setDesignName(event.target.value)} placeholder="Draft design name" />
          <select value={standardProfile} onChange={(event) => setStandardProfile(event.target.value)}>
            <option value="India-NBC-IS">India-NBC-IS</option>
            <option value="India-IS456-RCC">India-IS456-RCC</option>
            <option value="India-IS800-Steel">India-IS800-Steel</option>
          </select>
        </div>
        <div className="grid grid-two">
          <input
            value={drawingReference}
            onChange={(event) => setDrawingReference(event.target.value)}
            placeholder="Drawing ref (example: ARCH-A-101 Rev 02)"
          />
          <select value={drawingType} onChange={(event) => setDrawingType(event.target.value)}>
            <option value="PDF/DWG">PDF/DWG</option>
            <option value="BIM/IFC">BIM/IFC</option>
            <option value="Image/Scan">Image/Scan</option>
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

      <section className="panel grid" style={{ gap: 12 }}>
        <h2>Architect Draft View</h2>
        <p className="small">Preview of what a designer/architect typically reviews before issuing for check.</p>
        {previewError ? (
          <p className="small" style={{ color: "#b42318" }}>
            {previewError}
          </p>
        ) : (
          <div className="grid grid-two">
            <article className="draft-sheet">
              <p className="small"><strong>Design:</strong> {designName}</p>
              <p className="small"><strong>Profile:</strong> {standardProfile}</p>
              {previewRows.slice(0, 6).map((row) => (
                <div key={row.key} className="draft-line">
                  <strong>{row.key}</strong>
                  <span>{row.nominal_mm} mm</span>
                  <span>+/- {Math.max(row.tolerance_plus_mm, row.tolerance_minus_mm)} mm</span>
                </div>
              ))}
            </article>

            <article className="panel" style={{ borderStyle: "dashed" }}>
              <h3>Measurement Sheet</h3>
              {previewRows.map((row) => (
                <p key={`${row.key}-m`} className="small">
                  {row.key}: design {row.nominal_mm} mm, measured {row.measured_mm} mm
                </p>
              ))}
            </article>
          </div>
        )}
      </section>

      {comparison && (
        <section className="panel grid" style={{ gap: 10 }}>
          <h2>Comparison Outcome</h2>
          <p className="small">
            Design: {comparison.design_name} | Drawing: {comparison.drawing_reference} | Status: <strong>{comparison.overall_status}</strong> | Pass: {comparison.pass_count} | Fail: {comparison.fail_count}
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

    </main>
  );
}
