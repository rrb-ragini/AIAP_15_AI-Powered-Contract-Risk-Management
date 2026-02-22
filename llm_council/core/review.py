import json
import asyncio
import logging

from config.prompts import REVIEW_PROMPT
from core.schemas import SingleReviewOutput
from models.registry import get_active_models, API_KEY_MAP
from models.utils import safe_llm_call


async def review_round(clause_text, initial_outputs):

    active_models = get_active_models()
    n_models = len(active_models)

    # -------- STEP 1: Build dynamic labels (A, B, C, ...) --------
    # Note: REVIEW_PROMPT expects the same labels in its JSON template.
    # If n_models != 3 the prompt JSON template won't perfectly match the
    # actual responses. Log a warning so this is visible.
    label_letters = [chr(ord("A") + i) for i in range(n_models)]
    labels = [f"Response {l}" for l in label_letters]
    if n_models != 3:
        logging.warning(
            f"review_round: {n_models} models active but REVIEW_PROMPT is "
            "designed for 3. Consider updating the prompt template in "
            "config/prompts.py to match the actual number of models."
        )

    # -------- STEP 2: Anonymize responses --------
    anonymized = {}
    for label, (_, value) in zip(labels, initial_outputs.items()):
        if value is None:
            anonymized[label] = {"error": "Model failed to respond"}
            continue
        v = dict(value)
        v.pop("confidence", None)   # remove bias field
        anonymized[label] = v

    # -------- STEP 3: Build responses_text --------
    responses_text = ""
    for label, content in anonymized.items():
        responses_text += f"{label}:\n{json.dumps(content, indent=2)}\n\n"

    # -------- STEP 4: Format prompt --------
    prompt = REVIEW_PROMPT.format(
        clause_text=clause_text,
        responses_text=responses_text
    )

    # -------- STEP 5: Call all active reviewers --------
    reviewer_names = [f"Reviewer_{i+1}" for i in range(n_models)]

    tasks = [
        safe_llm_call(
            lambda p, fn=fn, name=name: fn(p, api_key=API_KEY_MAP[name]()),
            prompt,
            SingleReviewOutput
        )
        for name, fn in active_models.items()
    ]

    validated_results = await asyncio.gather(*tasks)

    reviews = {}
    for name, result in zip(reviewer_names, validated_results):
        if result is None:
            logging.warning(f"{name} returned no result during review round.")
        reviews[name] = result

    return {
        "responses": anonymized,
        "reviews": reviews
    }