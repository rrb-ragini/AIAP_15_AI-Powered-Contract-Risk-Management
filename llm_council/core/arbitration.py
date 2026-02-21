import os
import json

from config.prompts import ARBITRATION_PROMPT
from config.settings import ARBITRATOR_MODEL
from core.schemas import ArbitrationOutput
from models.registry import MODEL_REGISTRY
from models.utils import safe_llm_call

# Map model name → environment variable for API key
_API_KEY_MAP = {
    "openai": lambda: os.getenv("OPENAI_API_KEY"),
    "claude": lambda: os.getenv("ANTHROPIC_API_KEY"),
    "gemini": lambda: os.getenv("GOOGLE_API_KEY"),
}


async def arbitration(clause_text, council_data):
    """
    Run the final arbitration step using the model defined by ARBITRATOR_MODEL
    in config/settings.py (defaults to 'gemini').

    council_data should be:
    {
        "responses": {...},
        "reviews":   {...}
    }
    """
    prompt = ARBITRATION_PROMPT.format(
        clause_text=clause_text,
        council_data=json.dumps(council_data, indent=2)
    )

    arbitrator_fn = MODEL_REGISTRY[ARBITRATOR_MODEL]
    api_key = _API_KEY_MAP[ARBITRATOR_MODEL]()

    validated = await safe_llm_call(
        lambda p: arbitrator_fn(p, api_key=api_key),
        prompt,
        ArbitrationOutput
    )

    return validated
