import statistics
from config.settings import VARIANCE_THRESHOLD

def should_proceed(outputs):
    if not outputs:
        return False
    return any(o.get("golden_clause_detected", False) for o in outputs.values() if o)

def needs_review(outputs):
    if not outputs:
        return False
        
    valid_outputs = [o for o in outputs.values() if o]
    if len(valid_outputs) < 2:
        return False # Not enough data to determine disagreement
        
    risk_scores = [o.get("risk_score", 0) for o in valid_outputs]
    std_dev = statistics.pstdev(risk_scores)

    types = [o.get("golden_clause_type") for o in valid_outputs]
    balances = [o.get("balanced") for o in valid_outputs]

    if std_dev > VARIANCE_THRESHOLD:
        return True
    if len(set(types)) > 1:
        return True
    if len(set(balances)) > 1:
        return True

    return False
