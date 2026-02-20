import asyncio
import logging
from core.segmentation import segment_contract
from core.analysis import initial_analysis
from core.review import review_round
from core.arbitration import arbitration
from core.disagreement import should_proceed, needs_review
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
        message = record.getMessage() # Get the formatted message
        
        # Apply specific colors for specific messages
        if "Starting pipeline..." in message or "Pipeline completed." in message:
             log_fmt = self.BOLD_GREEN + self.FORMAT + self.RESET
        elif "Processing clause" in message:
             log_fmt = self.MAGENTA + self.FORMAT + self.RESET
        elif any(x in message for x in ["Running arbitration", "Disagreement detected", "Consensus reached", "Golden clause detected", "Running initial analysis"]):
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


async def run_pipeline(contract_text):

    logging.info("Starting pipeline...")
    clauses = await segment_contract(contract_text)
    logging.info(f"Segmented contract into {len(clauses)} clauses.")
    results = []

    async def process_clause(index, clause):
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

            logging.info(f"Golden clause detected in {clause_id}. Proceeding...")
            anonymized = anonymize_initial_outputs(initial_outputs)

            if needs_review(initial_outputs):
                logging.info(f"Disagreement detected in {clause_id}. Starting Council Review...")
                reviews = await review_round(clause_text, initial_outputs)
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
            logging.error(f"Error processing clause {clause_id}: {str(e)}")
            return {
                "clause_id": clause_id,
                "clause_text": clause_text,
                "golden_clause_detected": False,
                "error": str(e),
                "risk_level": "Error",
                "justification": f"Processing failed: {str(e)}"
            }

    # Process clauses in batches to balance speed and rate limits
    batch_size = 3
    for i in range(0, len(clauses), batch_size):
        batch = clauses[i:i + batch_size]
        tasks = [process_clause(i + j, clause) for j, clause in enumerate(batch)]
        batch_results = await asyncio.gather(*tasks)
        results.extend(batch_results)

    logging.info("Pipeline completed.")
    return results


if __name__ == "__main__":
    contract_text = "PASTE CONTRACT TEXT HERE"
    output = asyncio.run(run_pipeline(contract_text))
    print(output)
