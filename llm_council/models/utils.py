import asyncio
import logging
import json

MAX_RETRIES = 2


async def safe_llm_call(fn, prompt, schema_class=None):
    """
    Generic wrapper around any LLM call.
    - Retries on JSON decode errors
    - Retries on validation errors
    - Prevents full pipeline crash
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

            await asyncio.sleep(1)  # small backoff

    return None
