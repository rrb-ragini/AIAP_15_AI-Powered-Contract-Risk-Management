from config.settings import AVAILABLE_MODELS
from models.openai_model import call_openai
from models.claude_model import call_claude
from models.gemini_model import call_gemini

MODEL_REGISTRY = {
    "openai": call_openai,
    "claude": call_claude,
    "gemini": call_gemini
}

def get_active_models():
    return {
        name: MODEL_REGISTRY[name]
        for name, enabled in AVAILABLE_MODELS.items()
        if enabled
    }
