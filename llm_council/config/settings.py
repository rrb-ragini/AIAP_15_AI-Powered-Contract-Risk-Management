# ─── Model availability ───────────────────────────────────────────────────────
AVAILABLE_MODELS = {
    "openai": True,
    "claude": True,
    "gemini": True
}

# ─── Model role assignments ────────────────────────────────────────────────────
# Change any value to "openai", "claude", or "gemini"
SEGMENTATION_MODEL = "openai"
ARBITRATOR_MODEL   = "gemini"

# ─── Model name constants ─────────────────────────────────────────────────────
# Update these to upgrade a model without touching core files
OPENAI_MODEL = "gpt-4o"
CLAUDE_MODEL = "claude-3-haiku-20240307"
GEMINI_MODEL = "gemini-2.5-flash"

# Anthropic requires max_tokens (unlike OpenAI/Gemini); set to model max for no practical restriction
CLAUDE_MAX_TOKENS = 4096

# ─── Disagreement / council threshold ─────────────────────────────────────────
VARIANCE_THRESHOLD = 1.0

# ─── Retry settings ───────────────────────────────────────────────────────────
MAX_RETRIES       = 2        # number of retries after the first attempt
RETRY_BASE_DELAY  = 1.0      # seconds; actual wait = RETRY_BASE_DELAY * 2^attempt

# ─── Batching settings ────────────────────────────────────────────────────────
BATCH_SIZE              = 6    # clauses processed concurrently per batch
INTER_BATCH_DELAY_SECS  = 0    # seconds between batches; raise to ~1.0 if you hit 429 errors
