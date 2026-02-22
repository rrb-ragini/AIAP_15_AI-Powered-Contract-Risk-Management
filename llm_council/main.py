import asyncio
import json
import logging
import pathlib
from core.segmentation import segment_contract
from core.analysis import initial_analysis
from core.review import review_round
from core.arbitration import arbitration
from core.disagreement import should_proceed, needs_review
from config.settings import BATCH_SIZE, INTER_BATCH_DELAY_SECS
from dotenv import load_dotenv

# Custom logging formatter for colors
class ColorFormatter(logging.Formatter):
    GREY = "\x1b[38;20m"
    BOLD_GREEN = "\x1b[32;1m"
    YELLOW = "\x1b[33;20m"
    RED = "\x1b[31;20m"
    BOLD_RED = "\x1b[31;1m"
    CYAN = "\x1b[36;20m"     # For stages/status
    MAGENTA = "\x1b[35;20m"  # For clause loop
    RESET = "\x1b[0m"
    
    FORMAT = "%(asctime)s - %(levelname)s - %(message)s"

    FORMATS = {
        logging.DEBUG: GREY + FORMAT + RESET,
        logging.INFO: GREY + FORMAT + RESET,
        logging.WARNING: YELLOW + FORMAT + RESET,
        logging.ERROR: RED + FORMAT + RESET,
        logging.CRITICAL: BOLD_RED + FORMAT + RESET
    }

    def format(self, record):
        log_fmt = self.FORMATS.get(record.levelno)
        message = record.getMessage()
        
        if "Starting pipeline..." in message or "Pipeline completed." in message:
             log_fmt = self.BOLD_GREEN + self.FORMAT + self.RESET
        elif "Processing clause" in message:
             log_fmt = self.MAGENTA + self.FORMAT + self.RESET
        elif any(x in message for x in [
            "Running arbitration", "Disagreement detected", "Consensus reached",
            "Golden clause detected", "Running initial analysis"
        ]):
             log_fmt = self.CYAN + self.FORMAT + self.RESET
             
        formatter = logging.Formatter(log_fmt)
        return formatter.format(record)

# Configure logging
handler = logging.StreamHandler()
handler.setFormatter(ColorFormatter())
logging.basicConfig(
    level=logging.INFO,
    handlers=[handler]
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


async def run_pipeline(contract_text, output_path=None):
    """
    Run the full contract analysis pipeline.

    Args:
        contract_text (str): Raw text of the contract.
        output_path (str | None): Optional path to save results as JSON.

    Returns:
        list[dict]: One result dict per clause.
    """
    logging.info("Starting pipeline...")
    clauses = await segment_contract(contract_text)
    logging.info(f"Segmented contract into {len(clauses)} clauses.")
    results = []

    # Track stats for end-of-run summary
    n_golden = 0
    n_council = 0
    n_errors = 0

    async def process_clause(index, clause):
        nonlocal n_golden, n_council, n_errors
        clause_id = clause["clause_id"]
        clause_text = clause["clause_text"]
        try:
            logging.info(f"Processing clause {index + 1}/{len(clauses)} (ID: {clause_id})...")

            logging.info(f"Running initial analysis for clause {clause_id}...")
            initial_outputs = await initial_analysis(clause_text)

            # If no model detected golden clause → skip everything
            if not should_proceed(initial_outputs):
                logging.info(f"No golden clause detected for clause {clause_id}. Skipping.")
                return {
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
                }

            n_golden += 1
            logging.info(f"Golden clause detected in {clause_id}. Proceeding...")
            anonymized = anonymize_initial_outputs(initial_outputs)

            review_reason = needs_review(initial_outputs)
            if review_reason:
                logging.info(
                    f"Disagreement detected in {clause_id} "
                    f"(reason: {review_reason}). Starting Council Review..."
                )
                reviews = await review_round(clause_text, initial_outputs)
                n_council += 1
            else:
                logging.info(f"Consensus reached for {clause_id}. Skipping Council Review.")
                reviews = None

            council_data = {
                "responses": anonymized,
                "reviews": reviews
            }

            logging.info(f"Running arbitration for {clause_id}...")
            final = await arbitration(clause_text, council_data)

            if not final:
                raise ValueError(f"Arbitration failed for clause {clause_id}")

            logging.info(f"Finished processing clause {index + 1}.")
            return {
                "clause_id": clause_id,
                **final
            }
        except Exception as e:
            n_errors += 1
            logging.error(f"Error processing clause {clause_id}: {str(e)}")
            return {
                "clause_id": clause_id,
                "clause_text": clause_text,
                "golden_clause_detected": False,
                "error": str(e),
                "risk_level": "Error",
                "justification": f"Processing failed: {str(e)}"
            }

    # Process clauses in configurable batches to balance speed and rate limits
    for i in range(0, len(clauses), BATCH_SIZE):
        batch = clauses[i:i + BATCH_SIZE]
        tasks = [process_clause(i + j, clause) for j, clause in enumerate(batch)]
        batch_results = await asyncio.gather(*tasks)
        results.extend(batch_results)

        # Rate-limit buffer between batches (skip delay after the last batch)
        if i + BATCH_SIZE < len(clauses):
            await asyncio.sleep(INTER_BATCH_DELAY_SECS)

    # ── End-of-run summary ────────────────────────────────────────────────────
    risk_scores = [
        r.get("final_risk_score", 0)
        for r in results
        if isinstance(r.get("final_risk_score"), (int, float))
    ]
    avg_risk = sum(risk_scores) / len(risk_scores) if risk_scores else 0.0

    logging.info(
        f"Pipeline completed. | Clauses: {len(results)} | "
        f"Golden: {n_golden} | Council reviews: {n_council} | "
        f"Errors: {n_errors} | Avg risk score: {avg_risk:.2f}"
    )

    # ── Optional output persistence ────────────────────────────────────────────
    if output_path:
        out = pathlib.Path(output_path)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(json.dumps(results, indent=2, default=str), encoding="utf-8")
        logging.info(f"Results saved to {out.resolve()}")

    return results


if __name__ == "__main__":
    contract_text = "PASTE CONTRACT TEXT HERE"
    output = asyncio.run(run_pipeline(contract_text, output_path="pipeline_output.json"))
    print(output)
