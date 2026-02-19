import os
import asyncio
from models.openai_model import call_openai
from models.claude_model import call_claude
from models.gemini_model import call_gemini
from config.prompts import ANALYSIS_PROMPT
from config.golden_clauses import GOLDEN_CLAUSES
from core.schemas import AnalysisOutput
from models.utils import safe_llm_call

async def initial_analysis(clause_text):

    prompt = ANALYSIS_PROMPT.format(
        clause_text=clause_text,
        golden_clauses=GOLDEN_CLAUSES
    )

    openai_key = os.getenv("OPENAI_API_KEY")
    claude_key = os.getenv("ANTHROPIC_API_KEY")
    gemini_key = os.getenv("GOOGLE_API_KEY")

    models = [
        ("openai", lambda p: call_openai(p, api_key=openai_key)),
        ("claude", lambda p: call_claude(p, api_key=claude_key)),
        ("gemini", lambda p: call_gemini(p, api_key=gemini_key)),
    ]

    async def run_model(name, fn):
        result = await safe_llm_call(fn, prompt, AnalysisOutput)
        return name, result

    # Execute all model calls in parallel
    tasks = [run_model(name, fn) for name, fn in models]
    batch_results = await asyncio.gather(*tasks)
    
    results = {name: result for name, result in batch_results}

    return results
