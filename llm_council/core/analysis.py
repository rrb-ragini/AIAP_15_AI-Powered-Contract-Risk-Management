import asyncio
import logging
from models.registry import get_active_models, API_KEY_MAP
from config.prompts import ANALYSIS_PROMPT
from config.golden_clauses import GOLDEN_CLAUSES
from core.schemas import AnalysisOutput
from models.utils import safe_llm_call


async def initial_analysis(clause_text):

    prompt = ANALYSIS_PROMPT.format(
        clause_text=clause_text,
        golden_clauses=GOLDEN_CLAUSES
    )

    active_models = get_active_models()

    async def run_model(name, fn):
        api_key = API_KEY_MAP[name]()
        result = await safe_llm_call(lambda p: fn(p, api_key=api_key), prompt, AnalysisOutput)
        return name, result

    tasks = [run_model(name, fn) for name, fn in active_models.items()]
    batch_results = await asyncio.gather(*tasks)

    results = {name: result for name, result in batch_results}

    # Warn if any model failed to respond
    for name, result in results.items():
        if result is None:
            logging.warning(f"Model '{name}' returned no result during initial analysis.")

    return results
