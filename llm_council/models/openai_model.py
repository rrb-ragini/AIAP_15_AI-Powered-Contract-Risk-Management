import json
from openai import OpenAI


def _clean_json(raw_text: str):
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.replace("```json", "").replace("```", "").strip()
    return cleaned


async def call_openai(prompt: str, api_key: str):

    client = OpenAI(api_key=api_key)

    response = client.chat.completions.create(
        model="gpt-4o",
        temperature=0,
        messages=[{"role": "user", "content": prompt}]
    )

    raw_text = response.choices[0].message.content
    cleaned = _clean_json(raw_text)

    return json.loads(cleaned)
