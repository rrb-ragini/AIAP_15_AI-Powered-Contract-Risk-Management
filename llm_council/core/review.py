import os
import json
import asyncio

from config.prompts import REVIEW_PROMPT
from core.schemas import SingleReviewOutput
from models.openai_model import call_openai
from models.claude_model import call_claude
from models.gemini_model import call_gemini


async def review_round(clause_text, initial_outputs):

    # -------- STEP 1: Anonymize responses --------
    labels = ["Response A", "Response B", "Response C"]

    anonymized = {}
    for label, (_, value) in zip(labels, initial_outputs.items()):
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
        call_openai(prompt, api_key=os.getenv("OPENAI_API_KEY")),
        call_claude(prompt, api_key=os.getenv("ANTHROPIC_API_KEY")),
        call_gemini(prompt, api_key=os.getenv("GOOGLE_API_KEY")),
    ]

    raw_results = await asyncio.gather(*tasks)

    reviewer_names = ["Reviewer_1", "Reviewer_2", "Reviewer_3"]

    reviews = {}
    for name, raw in zip(reviewer_names, raw_results):
        # Auto-repair missing fields
        for label in ["Response A", "Response B", "Response C"]:
            if "evaluation" in raw and label in raw["evaluation"]:
                raw["evaluation"][label].setdefault("strengths", "")
                raw["evaluation"][label].setdefault("weaknesses", "")

        validated = SingleReviewOutput(**raw)
        reviews[name] = validated.model_dump()

    return {
        "responses": anonymized,
        "reviews": reviews
    }