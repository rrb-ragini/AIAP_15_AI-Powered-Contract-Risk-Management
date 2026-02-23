import json
from functools import lru_cache
from google import genai
from models.utils import clean_json
from config.settings import GEMINI_MODEL


@lru_cache(maxsize=4)
def _get_client(api_key: str) -> genai.Client:
    """Cache the client so we reuse connection pools across calls."""
    return genai.Client(api_key=api_key)


async def call_gemini(prompt: str, api_key: str):
    client = _get_client(api_key)

    response = await client.aio.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt
    )

    raw_text = response.text
    return json.loads(clean_json(raw_text))