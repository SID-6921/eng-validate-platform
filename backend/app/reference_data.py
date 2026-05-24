from typing import List

from .schemas import ConstructionReferenceCase


def get_india_construction_reference_cases() -> List[ConstructionReferenceCase]:
    return [
        ConstructionReferenceCase(
            case_id="AP-TRUSS-01",
            sector="airport-terminal",
            design_name="Check-in Hall Steel Truss",
            target_status="conditional-approval",
            summary="Long-span roof truss with pending connection and vibration checks.",
            key_inputs={
                "span_m": 36,
                "bay_spacing_m": 8,
                "material": "E350 structural steel",
                "seismic_zone": "IV",
            },
            expected_issues=[
                "Connection detailing verification pending",
                "Vibration comfort check for crowd zone pending",
            ],
            standards=["IS 800", "IS 875", "IS 1893", "NBC 2016"],
        ),
        ConstructionReferenceCase(
            case_id="CU-SLAB-03",
            sector="customs-cargo",
            design_name="Forklift Bay RC Slab",
            target_status="rework-required",
            summary="Warehouse slab with axle and rack point-load overstress risk.",
            key_inputs={
                "slab_thickness_mm": 180,
                "forklift_axle_load_kN": 95,
                "rack_point_load_kN": 65,
                "material": "M30 + Fe500",
            },
            expected_issues=[
                "Punching/shear overstress at rack base",
                "Joint spacing too high for load class",
                "Wear topping spec missing",
            ],
            standards=["IS 456", "IS 875", "NBC 2016", "Warehouse SOP"],
        ),
        ConstructionReferenceCase(
            case_id="HR-CORE-04",
            sector="high-rise",
            design_name="RC Core + Egress Stair",
            target_status="approved",
            summary="Compliant stair core geometry and seismic detailing baseline.",
            key_inputs={
                "stair_width_mm": 1800,
                "riser_mm": 150,
                "tread_mm": 300,
                "core_wall_mm": 300,
            },
            expected_issues=[],
            standards=["NBC 2016", "IS 456", "IS 1893", "IS 13920"],
        ),
        ConstructionReferenceCase(
            case_id="AP-FIRE-06",
            sector="airport-terminal",
            design_name="Fire Stair Pressurization Shaft",
            target_status="rework-required",
            summary="Pressurization design with redundancy and smoke-control gaps.",
            key_inputs={
                "shaft_area_m2": 5.4,
                "doors_count": 14,
                "fan_redundancy": "N",
                "target_pressure_pa": 40,
            },
            expected_issues=[
                "Redundancy requirement not met",
                "Pressure target low for door opening scenario",
                "Smoke extraction integration missing",
            ],
            standards=["NBC 2016 Fire", "Local Fire NOC norms", "Airport EHS SOP"],
        ),
        ConstructionReferenceCase(
            case_id="CU-CANOPY-07",
            sector="customs-cargo",
            design_name="Truck Inspection Canopy",
            target_status="conditional-approval",
            summary="Inspection lane canopy mostly compliant with minor documentation gap.",
            key_inputs={
                "clear_height_m": 6.5,
                "lane_width_m": 4.2,
                "cantilever_m": 3.0,
                "wind_basic_speed_mps": 47,
            },
            expected_issues=["Drainage slope annotation incomplete"],
            standards=["IS 800", "IS 875", "NBC 2016", "Customs lane SOP"],
        ),
    ]
