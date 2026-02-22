import os
import logging
from config.prompts import SEGMENTATION_PROMPT
from config.settings import SEGMENTATION_MODEL
from models.registry import MODEL_REGISTRY

# Map model name → environment variable for API key
_API_KEY_MAP = {
    "openai": lambda: os.getenv("OPENAI_API_KEY"),
    "claude": lambda: os.getenv("ANTHROPIC_API_KEY"),
    "gemini": lambda: os.getenv("GOOGLE_API_KEY"),
}


async def segment_contract(contract_text):
    """
    Segment contract text into clauses using the model defined by
    SEGMENTATION_MODEL in config/settings.py (defaults to 'openai').

    Returns a list of dicts, each with 'clause_id' and 'clause_text'.
    Raises ValueError if the model key is missing or the output is invalid.
    """
    api_key = _API_KEY_MAP[SEGMENTATION_MODEL]()
    if not api_key:
        raise ValueError(
            f"API key for SEGMENTATION_MODEL='{SEGMENTATION_MODEL}' is missing from environment."
        )

    prompt = SEGMENTATION_PROMPT.format(contract_text=contract_text)
    fn = MODEL_REGISTRY[SEGMENTATION_MODEL]

    result = await fn(prompt, api_key=api_key)

    # ── Validate output ──────────────────────────────────────────────────────
    if not isinstance(result, list) or len(result) == 0:
        raise ValueError(
            f"Segmentation returned an empty or non-list result: {result!r}"
        )

    valid_clauses = []
    for i, item in enumerate(result):
        if not isinstance(item, dict):
            logging.warning(f"Segmentation: item {i} is not a dict, skipping: {item!r}")
            continue
        if "clause_id" not in item or "clause_text" not in item:
            logging.warning(
                f"Segmentation: item {i} missing required keys "
                f"('clause_id'/'clause_text'), skipping: {item!r}"
            )
            continue
        valid_clauses.append(item)

    if not valid_clauses:
        raise ValueError("Segmentation produced no valid clauses after validation.")

    logging.info(
        f"Segmentation complete: {len(valid_clauses)}/{len(result)} clauses valid "
        f"(model: {SEGMENTATION_MODEL})."
    )
    return valid_clauses
