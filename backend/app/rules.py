from typing import List

from .schemas import DesignValidationInput, Severity, ValidationFinding


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
