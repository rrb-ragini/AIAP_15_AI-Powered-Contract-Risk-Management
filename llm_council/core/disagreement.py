import statistics
from typing import Optional
from config.settings import VARIANCE_THRESHOLD


def should_proceed(outputs) -> bool:
    """Return True if at least one model detected a golden clause."""
    if not outputs:
        return False
    return any(o.get("golden_clause_detected", False) for o in outputs.values() if o)


def needs_review(outputs) -> Optional[str]:
    """
    Return the reason a council review is needed, or None if models agree.

    Possible return values:
        "risk_score_variance"  – std-dev of risk scores exceeds VARIANCE_THRESHOLD
        "type_mismatch"        – models disagree on golden_clause_type
        "balance_mismatch"     – models disagree on whether clause is balanced
        None                   – models are in consensus; no review needed
    """
    if not outputs:
        return None

    valid_outputs = [o for o in outputs.values() if o]
    if len(valid_outputs) < 2:
        return None  # Not enough data to determine disagreement

    risk_scores = [o.get("risk_score", 0) for o in valid_outputs]
    std_dev = statistics.pstdev(risk_scores)

    types    = [o.get("golden_clause_type") for o in valid_outputs]
    balances = [o.get("balanced") for o in valid_outputs]

    if std_dev > VARIANCE_THRESHOLD:
        return "risk_score_variance"
    if len(set(types)) > 1:
        return "type_mismatch"
    if len(set(balances)) > 1:
        return "balance_mismatch"

    return None
