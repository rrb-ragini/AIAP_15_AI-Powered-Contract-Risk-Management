import asyncio
import logging

from config.settings import MAX_RETRIES, RETRY_BASE_DELAY


async def safe_llm_call(fn, prompt, schema_class=None):
    """
    Generic wrapper around any LLM call.
    - Retries up to MAX_RETRIES times (from settings.py)
    - Exponential backoff: RETRY_BASE_DELAY * 2^attempt seconds between retries
    - Validates output against schema_class if provided
    - Prevents full pipeline crash on failure
    """
    for attempt in range(MAX_RETRIES + 1):
        try:
            raw = await fn(prompt)

            if schema_class:
                validated = schema_class(**raw)
                return validated.model_dump()

            return raw

        except Exception as e:
            logging.warning(
                f"LLM call failed (attempt {attempt + 1}/{MAX_RETRIES + 1}): {str(e)}"
            )

            if attempt == MAX_RETRIES:
                raise e

            wait = RETRY_BASE_DELAY * (2 ** attempt)
            logging.debug(f"Retrying in {wait:.1f}s...")
            await asyncio.sleep(wait)

    return None
