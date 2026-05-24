from typing import List

from .schemas import (
    DesignSource,
    DesignValidationInput,
    ProcessSuggestionInput,
    ProcessSuggestionResponse,
    Severity,
    ValidationFinding,
)


def run_validation(payload: DesignValidationInput) -> List[ValidationFinding]:
    findings: List[ValidationFinding] = []

    if not payload.dimensions_complete:
        findings.append(
            ValidationFinding(
                id="F-001",
                category="measurement",
                message="Missing dimensions detected in design package.",
                why="Complete dimensions are required for tolerance stack and assembly validation.",
                severity=Severity.high,
                recommended_fix="Provide complete dimension callouts in CAD and drawing views.",
                cost_risk_impact="High risk of fabrication rework and delayed production.",
                violated_standard="Internal SOP-DWG-001",
            )
        )

    if payload.tolerance_mm > payload.allowed_tolerance_mm:
        findings.append(
            ValidationFinding(
                id="F-002",
                category="tolerance",
                message="Tolerance exceeds approved manufacturing threshold.",
                why="Part variation may exceed fitment envelope in assembly.",
                severity=Severity.critical,
                recommended_fix="Reduce tolerance band or revise mating-part interface dimensions.",
                cost_risk_impact="Critical assembly failure risk and potential scrap increase.",
                violated_standard="ISO 2768 / Internal MFG-TOL-004",
            )
        )

    if payload.material not in payload.approved_materials:
        findings.append(
            ValidationFinding(
                id="F-003",
                category="material",
                message="Specified material is not in the approved material list.",
                why="Unapproved materials can violate compliance, durability, or supply constraints.",
                severity=Severity.high,
                recommended_fix="Switch to an approved equivalent material and rerun validation.",
                cost_risk_impact="High compliance and procurement risk.",
                violated_standard="ASTM/Company Material Qualification Matrix",
            )
        )

    load_ratio = payload.expected_load_kn / payload.max_load_kn if payload.max_load_kn else 1
    if load_ratio > 1:
        findings.append(
            ValidationFinding(
                id="F-004",
                category="structural",
                message="Expected load exceeds max design load capacity.",
                why="Design cannot safely sustain declared operating load case.",
                severity=Severity.critical,
                recommended_fix="Increase section modulus, strengthen material, or reduce service load.",
                cost_risk_impact="Critical structural safety failure risk.",
                violated_standard="ANSI/ASME safety factor policy",
            )
        )
    elif load_ratio > 0.85:
        findings.append(
            ValidationFinding(
                id="F-005",
                category="structural",
                message="Load utilization above 85 percent margin threshold.",
                why="Low design margin reduces resilience to dynamic or thermal effects.",
                severity=Severity.medium,
                recommended_fix="Improve geometry or material to restore safety margin.",
                cost_risk_impact="Medium reliability risk during field operation.",
                violated_standard="Internal Structural Margin Guideline",
            )
        )

    if not payload.has_safety_annotations:
        findings.append(
            ValidationFinding(
                id="F-006",
                category="documentation",
                message="Safety annotations and warnings are incomplete.",
                why="Assembly and shop-floor execution require explicit safety guidance.",
                severity=Severity.medium,
                recommended_fix="Add mandatory safety labels, PPE notes, and hazard callouts.",
                cost_risk_impact="Medium EHS and training risk.",
                violated_standard="OSHA documentation controls",
            )
        )

    return findings


def compute_readiness_score(findings: List[ValidationFinding]) -> float:
    penalty = {
        Severity.critical: 35,
        Severity.high: 20,
        Severity.medium: 10,
        Severity.low: 4,
    }

    score = 100.0
    for finding in findings:
        score -= penalty[finding.severity]

    return round(max(score, 0.0), 2)


def suggest_manufacturing_process(payload: ProcessSuggestionInput) -> ProcessSuggestionResponse:
    process = "CNC machining"
    reasoning: List[str] = []
    risks: List[str] = []

    volume = payload.annual_volume
    tol = payload.tolerance_mm
    min_feature = payload.min_feature_mm

    if payload.process_family == "sheet-metal":
        process = "Laser cutting + CNC bending"
        reasoning.append("Sheet-metal family selected with geometry suitable for flat-pattern workflows.")
    elif payload.process_family == "plastic":
        process = "Injection molding" if volume >= 10000 else "CNC/3D print prototype + bridge tooling"
        reasoning.append("Plastic parts with annual volume drive tooling vs prototype tradeoff.")
    elif payload.process_family == "additive":
        process = "Industrial additive manufacturing (SLM/SLS)"
        reasoning.append("Additive family selected for complex geometry and low-to-mid volume builds.")
    else:
        if volume >= 5000:
            process = "CNC machining + dedicated fixtures"
        elif volume >= 500:
            process = "CNC machining (cell production)"
        else:
            process = "CNC prototype workflow"
        reasoning.append("Metal family defaults to CNC path with volume-driven production strategy.")

    if tol <= 0.02:
        reasoning.append("Tight tolerance target indicates precision machining and metrology planning.")
        risks.append("High precision tolerance may increase cycle time and scrap risk.")
    elif tol >= 0.5:
        reasoning.append("Loose tolerance allows higher-throughput manufacturing options.")

    if min_feature < 1.0:
        risks.append("Very small feature size may need special tooling and process validation.")

    standards = [
        "ISO 2768 (general tolerances)",
        "ISO GPS / GD&T references",
        "ASTM material specification for selected alloy/polymer",
        "ANSI/ASME Y14.5 for dimensioning and tolerancing",
        "Internal SOP: process capability and inspection plan",
    ]

    tolerance_band = "0.01-0.05 mm" if tol <= 0.05 else "0.05-0.20 mm" if tol <= 0.2 else "0.20-0.80 mm"

    if not risks:
        risks.append("No immediate high-risk flags from quick pre-screen; run full DFM + simulation checks.")

    return ProcessSuggestionResponse(
        design_name=payload.design_name,
        recommended_process=process,
        reasoning=reasoning,
        suggested_tolerance_band_mm=tolerance_band,
        standards_to_check=standards,
        production_risks=risks,
    )


def get_online_design_sources() -> List[DesignSource]:
    return [
        DesignSource(
            name="GrabCAD Library",
            url="https://grabcad.com/library",
            category="Community CAD models",
            notes="Large free community library for concept benchmarking and reference geometry.",
        ),
        DesignSource(
            name="TraceParts",
            url="https://www.traceparts.com/en",
            category="Supplier CAD catalogs",
            notes="Industrial component catalogs across mechanical, electrical, fluid systems.",
        ),
        DesignSource(
            name="3D ContentCentral",
            url="https://www.3dcontentcentral.com",
            category="Supplier + user CAD content",
            notes="2D/3D CAD parts and assemblies with supplier and community contributions.",
        ),
        DesignSource(
            name="McMaster-Carr CAD",
            url="https://www.mcmaster.com/cad-models/",
            category="Commercial component CAD",
            notes="High-coverage mechanical part CAD for fast BOM and assembly design.",
        ),
        DesignSource(
            name="ISO Standards Portal",
            url="https://www.iso.org/standards.html",
            category="Standards lookup",
            notes="Official standards catalog and metadata (full texts may require purchase/access).",
        ),
    ]
