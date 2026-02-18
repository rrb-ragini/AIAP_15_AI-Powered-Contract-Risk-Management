import os
import json
from config.prompts import REVIEW_PROMPT
from models.openai_model import call_openai
from models.claude_model import call_claude
from models.gemini_model import call_gemini
from core.schemas import ReviewOutput


async def review_round(clause_text, initial_outputs):

    openai_key = os.getenv("OPENAI_API_KEY")
    claude_key = os.getenv("ANTHROPIC_API_KEY")
    gemini_key = os.getenv("GOOGLE_API_KEY")

    models = {
        "openai": lambda p: call_openai(p, api_key=openai_key),
        "claude": lambda p: call_claude(p, api_key=claude_key),
        "gemini": lambda p: call_gemini(p, api_key=gemini_key),
    }

    revised = {}

    for name, fn in models.items():

        peers = {k: v for k, v in initial_outputs.items() if k != name}

        prompt = REVIEW_PROMPT.format(
            clause_text=clause_text,
            self_output=json.dumps(initial_outputs[name], indent=2),
            peer_outputs=json.dumps(peers, indent=2)
        )

        raw = await fn(prompt)
        validated = ReviewOutput(**raw)
        revised[name] = validated.model_dump()

    return revised
