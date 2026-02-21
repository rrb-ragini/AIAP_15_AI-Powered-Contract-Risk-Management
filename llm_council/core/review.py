import os
import json
import asyncio
import logging

from config.prompts import REVIEW_PROMPT
from core.schemas import SingleReviewOutput
from models.registry import get_active_models
from models.utils import safe_llm_call

# Map model name → environment variable for API key
_API_KEY_MAP = {
    "openai": lambda: os.getenv("OPENAI_API_KEY"),
    "claude": lambda: os.getenv("ANTHROPIC_API_KEY"),
    "gemini": lambda: os.getenv("GOOGLE_API_KEY"),
}


async def review_round(clause_text, initial_outputs):

    # -------- STEP 1: Anonymize responses --------
    labels = ["Response A", "Response B", "Response C"]

    anonymized = {}
    for label, (_, value) in zip(labels, initial_outputs.items()):
        if value is None:
            anonymized[label] = {"error": "Model failed to respond"}
            continue
        v = dict(value)
        v.pop("confidence", None)  # remove bias field if exists
        anonymized[label] = v

    # -------- STEP 2: Build responses_text --------
    responses_text = ""
    for label, content in anonymized.items():
        responses_text += f"{label}:\n{json.dumps(content, indent=2)}\n\n"

    # -------- STEP 3: Format prompt --------
    prompt = REVIEW_PROMPT.format(
        clause_text=clause_text,
        responses_text=responses_text
    )

    # -------- STEP 4: Call all active reviewers (from registry) --------
    active_models = get_active_models()
    reviewer_names = [f"Reviewer_{i+1}" for i in range(len(active_models))]

    tasks = [
        safe_llm_call(
            lambda p, fn=fn, name=name: fn(p, api_key=_API_KEY_MAP[name]()),
            prompt,
            SingleReviewOutput
        )
        for name, fn in active_models.items()
    ]

    validated_results = await asyncio.gather(*tasks)

    # Warn if any reviewer failed
    reviews = {}
    for name, result in zip(reviewer_names, validated_results):
        if result is None:
            logging.warning(f"{name} returned no result during review round.")
        reviews[name] = result

    return {
        "responses": anonymized,
        "reviews": reviews
    }