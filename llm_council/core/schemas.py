from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Literal
from config.golden_clauses import GOLDEN_CLAUSES


class AnalysisOutput(BaseModel):
    golden_clause_detected: bool
    golden_clause_type: Optional[str]
    risk_score: float = Field(..., ge=0, le=10)
    balanced: bool
    justification: str
    key_risk_indicators: List[str]

    @field_validator("golden_clause_type")
    def validate_clause_type(cls, v):
        if v is None:
            return v
        if v not in GOLDEN_CLAUSES.keys():
            raise ValueError(f"Invalid golden clause type: {v}")
        return v


class ResponseCritique(BaseModel):
    strengths: str
    weaknesses: str


class SingleReviewOutput(BaseModel):
    evaluation: Dict[str, ResponseCritique]
    ranking: Dict[str, str]


class ArbitrationOutput(BaseModel):
    clause_text: str
    golden_clause_detected: bool
    golden_clause_type: Optional[str]
    final_risk_score: float = Field(..., ge=0, le=10)
    risk_level: Literal["Low", "Moderate", "High"]   # validated at schema level
    business_risk_if_ignored: str
    suggested_correction: str
    justification: str
    confidence: float = Field(default=0.5, ge=0, le=1)
