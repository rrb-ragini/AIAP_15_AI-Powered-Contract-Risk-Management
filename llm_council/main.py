import asyncio
import logging
from core.segmentation import segment_contract
from core.analysis import initial_analysis
from core.review import review_round
from core.arbitration import arbitration
from core.disagreement import should_proceed, needs_review
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()]
)

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

    logging.info("Starting pipeline...")
    clauses = await segment_contract(contract_text)
    logging.info(f"Segmented contract into {len(clauses)} clauses.")
    results = []

    for index, clause in enumerate(clauses):
        clause_id = clause["clause_id"]
        clause_text = clause["clause_text"]
        logging.info(f"Processing clause {index + 1}/{len(clauses)} (ID: {clause_id})...")

        logging.info("Running initial analysis...")
        initial_outputs = await initial_analysis(clause_text)

        # If no model detected golden clause → skip everything
        if not should_proceed(initial_outputs):
            logging.info("No golden clause detected. Skipping further analysis.")
            results.append({
                "clause_id": clause_id,
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

        logging.info("Golden clause detected. Proceeding...")

        # Prepare anonymized responses (ALWAYS)
        # from core.review import anonymize_outputs  # if you have helper
        anonymized = anonymize_initial_outputs(initial_outputs)

        # Determine if review is needed
        if needs_review(initial_outputs):
            logging.info("Disagreement detected. Starting Council Review...")
            reviews = await review_round(clause_text, initial_outputs)
        else:
            logging.info("Consensus reached. Skipping Council Review.")
            reviews = None

        council_data = {
            "responses": anonymized,
            "reviews": reviews
        }

        logging.info("Running arbitration...")
        final = await arbitration(clause_text, council_data)

        results.append({
            "clause_id": clause_id,
            **final
        })
        logging.info(f"Finished processing clause {index + 1}.")


    logging.info("Pipeline completed.")
    return results


if __name__ == "__main__":
    contract_text = "PASTE CONTRACT TEXT HERE"
    output = asyncio.run(run_pipeline(contract_text))
    print(output)
