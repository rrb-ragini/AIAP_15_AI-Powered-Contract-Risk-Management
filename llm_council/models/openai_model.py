import json
from functools import lru_cache
from openai import AsyncOpenAI
from models.utils import clean_json
from config.settings import OPENAI_MODEL


@lru_cache(maxsize=4)
def _get_client(api_key: str) -> AsyncOpenAI:
    """Cache the client so we reuse connection pools across calls."""
    return AsyncOpenAI(api_key=api_key)


async def call_openai(prompt: str, api_key: str):
    client = _get_client(api_key)

    response = await client.chat.completions.create(
        model=OPENAI_MODEL,
        temperature=0,
        messages=[{"role": "user", "content": prompt}]
    )

    raw_text = response.choices[0].message.content
    return json.loads(clean_json(raw_text))
