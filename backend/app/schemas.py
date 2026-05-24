from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


class Severity(str, Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class ValidationFinding(BaseModel):
    id: str
    category: str
    message: str
    why: str
    severity: Severity
    recommended_fix: str
    cost_risk_impact: str
    violated_standard: Optional[str] = None


class DesignValidationInput(BaseModel):
    design_name: str = Field(..., min_length=2)
    dimensions_complete: bool = True
    tolerance_mm: float = Field(..., ge=0)
    allowed_tolerance_mm: float = Field(..., ge=0)
    material: str
    approved_materials: List[str]
    max_load_kn: float = Field(..., ge=0)
    expected_load_kn: float = Field(..., ge=0)
    has_safety_annotations: bool = True
    selected_standards: List[str] = Field(default_factory=list)


class DesignValidationResponse(BaseModel):
    design_name: str
    readiness_score: float
    status: str
    findings: List[ValidationFinding]
    recommendations: List[str]
