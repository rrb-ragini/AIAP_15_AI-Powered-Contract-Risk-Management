import statistics
from config.settings import VARIANCE_THRESHOLD

def should_proceed(outputs):
    return any(o["golden_clause_detected"] for o in outputs.values())

def needs_review(outputs):
    risk_scores = [o["risk_score"] for o in outputs.values()]
    std_dev = statistics.pstdev(risk_scores)

    types = [o["golden_clause_type"] for o in outputs.values()]
    balances = [o["balanced"] for o in outputs.values()]

    if std_dev > VARIANCE_THRESHOLD:
        return True
    if len(set(types)) > 1:
        return True
    if len(set(balances)) > 1:
        return True

    return False
