import asyncio
from core.segmentation import segment_contract
from core.analysis import initial_analysis
from core.review import review_round
from core.arbitration import arbitration
from core.disagreement import should_proceed, needs_review
from dotenv import load_dotenv
load_dotenv()

def anonymize_initial_outputs(initial_outputs):
    """
    Convert model outputs into anonymized Response A/B/C structure.
    """
    labels = ["Response A", "Response B", "Response C"]

    anonymized = {}
    for label, (_, output) in zip(labels, initial_outputs.items()):
        anonymized[label] = output

    return anonymized


async def run_pipeline(contract_text):

    clauses = await segment_contract(contract_text)
    results = []

    for clause in clauses:

        clause_text = clause["clause_text"]

        initial_outputs = await initial_analysis(clause_text)

        # If no model detected golden clause → skip everything
        if not should_proceed(initial_outputs):
            results.append({
                "clause_id": clause["clause_id"],
                "clause_text": clause_text,
                "golden_clause_detected": False,
                "golden_clause_type": None,
                "final_risk_score": 0.0,
                "risk_level": "None",
                "business_risk_if_ignored": None,
                "suggested_correction": None,
                "justification": "All models agree this clause is not a golden clause.",
                "confidence": 1.0
            })
            continue

        # Prepare anonymized responses (ALWAYS)
        # from core.review import anonymize_outputs  # if you have helper
        anonymized = anonymize_initial_outputs(initial_outputs)

        # Determine if review is needed
        if needs_review(initial_outputs):
            reviews = await review_round(clause_text, initial_outputs)
        else:
            reviews = None

        council_data = {
            "responses": anonymized,
            "reviews": reviews
        }

        final = await arbitration(clause_text, council_data)

        results.append({
            "clause_id": clause["clause_id"],
            **final
        })


    return results


if __name__ == "__main__":
    contract_text = "PASTE CONTRACT TEXT HERE"
    output = asyncio.run(run_pipeline(contract_text))
    print(output)
