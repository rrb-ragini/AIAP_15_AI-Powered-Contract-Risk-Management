import os
from config.settings import AVAILABLE_MODELS
from models.openai_model import call_openai
from models.claude_model import call_claude
from models.gemini_model import call_gemini

MODEL_REGISTRY = {
    "openai": call_openai,
    "claude": call_claude,
    "gemini": call_gemini
}

# Shared API key resolver — used by all core modules to avoid copy-paste
API_KEY_MAP = {
    "openai": lambda: os.getenv("OPENAI_API_KEY"),
    "claude": lambda: os.getenv("ANTHROPIC_API_KEY"),
    "gemini": lambda: os.getenv("GOOGLE_API_KEY"),
}

def get_active_models():
    return {
        name: MODEL_REGISTRY[name]
        for name, enabled in AVAILABLE_MODELS.items()
        if enabled
    }
