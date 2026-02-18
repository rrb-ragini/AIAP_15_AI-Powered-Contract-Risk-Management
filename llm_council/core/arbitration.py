import os
import json
from config.prompts import ARBITRATION_PROMPT
from config.settings import ARBITRATOR_MODEL
from models.openai_model import call_openai
from models.claude_model import call_claude
from models.gemini_model import call_gemini
from core.schemas import ArbitrationOutput


async def arbitration(clause_text, model_outputs):

    openai_key = os.getenv("OPENAI_API_KEY")
    claude_key = os.getenv("ANTHROPIC_API_KEY")
    gemini_key = os.getenv("GOOGLE_API_KEY")

    prompt = ARBITRATION_PROMPT.format(
        clause_text=clause_text,
        model_outputs=json.dumps(model_outputs, indent=2)
    )

    if ARBITRATOR_MODEL == "openai":
        raw = await call_openai(prompt, api_key=openai_key)

    elif ARBITRATOR_MODEL == "claude":
        raw = await call_claude(prompt, api_key=claude_key)

    elif ARBITRATOR_MODEL == "gemini":
        raw = await call_gemini(prompt, api_key=gemini_key)

    else:
        raise ValueError(f"Unsupported ARBITRATOR_MODEL: {ARBITRATOR_MODEL}")

    validated = ArbitrationOutput(**raw)
    return validated.model_dump()
