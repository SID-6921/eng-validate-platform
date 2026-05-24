from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .reference_data import get_india_construction_reference_cases
from .rules import (
    compare_draft_vs_measurements,
    compute_readiness_score,
    get_online_design_sources,
    run_validation,
    suggest_manufacturing_process,
)
from .schemas import (
    ConstructionReferenceCase,
    DesignSource,
    MeasurementComparisonInput,
    MeasurementComparisonResponse,
    DesignValidationInput,
    DesignValidationResponse,
    ProcessSuggestionInput,
    ProcessSuggestionResponse,
)

app = FastAPI(
    title="Engineering Validation Platform API",
    description="MVP API for compliance and manufacturing validation.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/v1/standards")
def standards() -> dict:
    return {
        "supported": [
            "ISO",
            "ASTM",
            "ANSI",
            "OSHA",
            "CE",
            "Internal-SOP",
            "Regional-Code",
        ]
    }


@app.get("/api/v1/design-sources", response_model=list[DesignSource])
def design_sources() -> list[DesignSource]:
    return get_online_design_sources()


@app.post("/api/v1/suggest-process", response_model=ProcessSuggestionResponse)
def suggest_process(payload: ProcessSuggestionInput) -> ProcessSuggestionResponse:
    return suggest_manufacturing_process(payload)


@app.get("/api/v1/india-construction-cases", response_model=list[ConstructionReferenceCase])
def india_construction_cases() -> list[ConstructionReferenceCase]:
    return get_india_construction_reference_cases()


@app.post("/api/v1/compare-measurements", response_model=MeasurementComparisonResponse)
def compare_measurements(payload: MeasurementComparisonInput) -> MeasurementComparisonResponse:
    return compare_draft_vs_measurements(payload)


@app.post("/api/v1/validate-design", response_model=DesignValidationResponse)
def validate_design(payload: DesignValidationInput) -> DesignValidationResponse:
    findings = run_validation(payload)
    score = compute_readiness_score(findings)

    status = "approved"
    if any(f.severity in ("critical", "high") for f in findings):
        status = "rework-required"
    elif findings:
        status = "conditional-approval"

    recommendations = [
        "Standardize tolerance stack-up across mating parts.",
        "Prefer approved high-strength low-alloy alternatives for high load cases.",
        "Run structural simulation for peak thermal and dynamic load scenarios.",
        "Add assembly sequence checks with collision-free access validation.",
    ]

    return DesignValidationResponse(
        design_name=payload.design_name,
        readiness_score=score,
        status=status,
        findings=findings,
        recommendations=recommendations,
    )
