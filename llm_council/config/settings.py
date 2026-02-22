# ─── Model availability ───────────────────────────────────────────────────────
AVAILABLE_MODELS = {
    "openai": True,
    "claude": True,
    "gemini": True
}

# ─── Model role assignments ────────────────────────────────────────────────────
# Change either value to "openai", "claude", or "gemini"
SEGMENTATION_MODEL = "openai"
ARBITRATOR_MODEL   = "gemini"

# ─── Disagreement / council threshold ─────────────────────────────────────────
VARIANCE_THRESHOLD = 1.0

# ─── Retry settings ───────────────────────────────────────────────────────────
MAX_RETRIES       = 2        # number of retries after the first attempt
RETRY_BASE_DELAY  = 1.0      # seconds; actual wait = RETRY_BASE_DELAY * 2^attempt

# ─── Batching settings ────────────────────────────────────────────────────────
BATCH_SIZE              = 6    # clauses processed concurrently per batch
INTER_BATCH_DELAY_SECS  = 0    # seconds between batches; raise this (e.g. to 1.0) only if you hit 429 rate-limit errors
