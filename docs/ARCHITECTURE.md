# Architecture Summary

## Services

- `frontend` (Next.js): dashboard, findings visualization, validation reports UX
- `backend` (FastAPI): ingestion API, validation orchestration, standards checks

## Validation pipeline (MVP)

1. Receive design payload
2. Check dimensions/tolerances/materials/loads against selected standards
3. Produce findings with severity and recommendations
4. Return readiness score and report-ready JSON

## Planned expansion

- CAD and drawing extraction microservices
- Deterministic rules engine with versioned standards packs
- Simulation adapters (FEA/thermal/motion)
- Event-driven orchestration and audit trail
