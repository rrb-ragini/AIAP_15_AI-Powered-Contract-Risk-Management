import json
from functools import lru_cache
from anthropic import AsyncAnthropic
from models.utils import clean_json
from config.settings import CLAUDE_MODEL, CLAUDE_MAX_TOKENS


@lru_cache(maxsize=4)
def _get_client(api_key: str) -> AsyncAnthropic:
    """Cache the client so we reuse connection pools across calls."""
    return AsyncAnthropic(api_key=api_key)


async def call_claude(prompt: str, api_key: str):
    client = _get_client(api_key)

    message = await client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=CLAUDE_MAX_TOKENS,   # required by Anthropic API; controlled via settings.py
        temperature=0,
        messages=[{"role": "user", "content": prompt}]
    )

    raw_text = message.content[0].text
    return json.loads(clean_json(raw_text))
