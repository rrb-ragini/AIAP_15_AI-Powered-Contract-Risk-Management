import os
from models.openai_model import call_openai
from config.prompts import SEGMENTATION_PROMPT


async def segment_contract(contract_text):
    prompt = SEGMENTATION_PROMPT.format(contract_text=contract_text)

    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise ValueError("OPENAI_API_KEY missing")

    return await call_openai(prompt, api_key=api_key)
