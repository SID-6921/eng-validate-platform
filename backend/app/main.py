from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .rules import compute_readiness_score, run_validation
from .schemas import DesignValidationInput, DesignValidationResponse

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
