import json
import asyncio
from google import genai


def _clean_json(raw_text: str):
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.replace("```json", "").replace("```", "").strip()
    return cleaned


async def call_gemini(prompt: str, api_key: str):

    client = genai.Client(api_key=api_key)

    # Use to_thread to avoid blocking the event loop
    response = await asyncio.to_thread(
        client.models.generate_content,
        model="gemini-2.5-flash",
        contents=prompt
    )

    raw_text = response.text
    cleaned = _clean_json(raw_text)

    return json.loads(cleaned)