import os
import json

from config.prompts import ARBITRATION_PROMPT
from core.schemas import ArbitrationOutput
from models.gemini_model import call_gemini  # assuming Gemini is arbitrator
from models.utils import safe_llm_call



async def arbitration(clause_text, council_data):

    # council_data should be:
    # {
    #   "responses": {...},
    #   "reviews": {...}
    # }

    prompt = ARBITRATION_PROMPT.format(
        clause_text=clause_text,
        council_data=json.dumps(council_data, indent=2)
    )

    validated = await safe_llm_call(
        lambda p: call_gemini(p, api_key=os.getenv("GOOGLE_API_KEY")),
        prompt,
        ArbitrationOutput
    )

    return validated

