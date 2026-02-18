import json
import anthropic


def _clean_json(raw_text: str):
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.replace("```json", "").replace("```", "").strip()
    return cleaned


async def call_claude(prompt: str, api_key: str):

    client = anthropic.Anthropic(api_key=api_key)

    message = client.messages.create(
        model="claude-3-haiku-20240307",
        max_tokens=2000,
        temperature=0,
        messages=[{"role": "user", "content": prompt}]
    )

    raw_text = message.content[0].text
    cleaned = _clean_json(raw_text)

    return json.loads(cleaned)
