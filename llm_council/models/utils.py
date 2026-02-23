import asyncio
import json
import logging
from config.settings import MAX_RETRIES, RETRY_BASE_DELAY

# Errors that should NOT be retried (config problems that retrying won't fix)
_NON_RETRIABLE_ERRORS = frozenset({
    "AuthenticationError",
    "PermissionDeniedError",
    "NotFoundError",
    "InvalidRequestError",
    "BadRequestError",
})


def clean_json(raw_text: str) -> str:
    """Strip markdown code fences from an LLM JSON response."""
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.replace("```json", "").replace("```", "").strip()
    return cleaned


async def safe_llm_call(fn, prompt, schema_class=None):
    """
    Generic wrapper around any LLM call.
    - Retries up to MAX_RETRIES times with exponential backoff
    - Non-retriable errors are re-raised immediately
    - Validates output against schema_class if provided
    """
    for attempt in range(MAX_RETRIES + 1):
        try:
            raw = await fn(prompt)

            if schema_class:
                validated = schema_class(**raw)
                return validated.model_dump()

            return raw

        except Exception as e:
            if type(e).__name__ in _NON_RETRIABLE_ERRORS:
                logging.error(
                    f"Non-retriable error ({type(e).__name__}), aborting: {e}"
                )
                raise

            logging.warning(
                f"LLM call failed (attempt {attempt + 1}/{MAX_RETRIES + 1}): "
                f"{type(e).__name__}: {e}"
            )

            if attempt == MAX_RETRIES:
                raise

            wait = RETRY_BASE_DELAY * (2 ** attempt)
            logging.debug(f"Retrying in {wait:.1f}s...")
            await asyncio.sleep(wait)

    return None
