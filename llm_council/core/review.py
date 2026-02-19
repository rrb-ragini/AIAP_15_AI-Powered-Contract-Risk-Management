import os
import json
import asyncio

from config.prompts import REVIEW_PROMPT
from core.schemas import SingleReviewOutput
from models.openai_model import call_openai
from models.claude_model import call_claude
from models.gemini_model import call_gemini
from models.utils import safe_llm_call


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

    # -------- STEP 4: Call all reviewers --------
    tasks = [
        safe_llm_call(
            lambda p: call_openai(p, api_key=os.getenv("OPENAI_API_KEY")),
            prompt,
            SingleReviewOutput
        ),
        safe_llm_call(
            lambda p: call_claude(p, api_key=os.getenv("ANTHROPIC_API_KEY")),
            prompt,
            SingleReviewOutput
        ),
        safe_llm_call(
            lambda p: call_gemini(p, api_key=os.getenv("GOOGLE_API_KEY")),
            prompt,
            SingleReviewOutput
        ),
    ]

    validated_results = await asyncio.gather(*tasks)


    reviewer_names = ["Reviewer_1", "Reviewer_2", "Reviewer_3"]

    reviews = {}
    for name, result in zip(reviewer_names, validated_results):
        reviews[name] = result

    return {
        "responses": anonymized,
        "reviews": reviews
    }