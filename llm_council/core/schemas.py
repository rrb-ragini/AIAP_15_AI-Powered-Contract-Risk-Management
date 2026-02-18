from pydantic import BaseModel, Field
from typing import List, Optional


class AnalysisOutput(BaseModel):
    golden_clause_detected: bool
    golden_clause_type: Optional[str]
    risk_score: float = Field(ge=0, le=10)
    balanced: bool
    justification: str
    key_risk_indicators: List[str]


class ReviewOutput(BaseModel):
    golden_clause_detected: bool
    golden_clause_type: Optional[str]
    risk_score: float = Field(ge=0, le=10)
    balanced: bool
    justification: str
    revised: bool
    revision_reason: str | None = None


class ArbitrationOutput(BaseModel):
    clause_text: str
    golden_clause_detected: bool
    golden_clause_type: Optional[str]
    final_risk_score: float = Field(ge=0, le=10)
    risk_level: str
    business_risk_if_ignored: str
    suggested_correction: str
    justification: str
    confidence: float = Field(ge=0, le=1)
