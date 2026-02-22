# AI-Powered Contract Risk Management

**BITSoM AIAP (Applied AI Project) — Course Project**
**Author: Nanduri Anirudh**

---

## Overview

This project uses a multi-LLM council architecture to automatically analyse B2B legal contracts. It segments a contract into clauses, identifies **Golden Clauses** (high-stakes clause types), assesses their legal and commercial risk, and produces a structured JSON verdict — all driven by three AI models working in parallel, critiquing each other, and arbitrated by a designated judge model.

---

## The 10 Golden Clauses

The system detects and analyses the following clause types only. Any clause that does not match one of these is skipped (risk = 0).

| # | Clause Type |
|---|---|
| 1 | Payment Terms |
| 2 | Term and Termination |
| 3 | Scope of Services |
| 4 | Confidentiality |
| 5 | Limitation of Liability |
| 6 | Indemnity |
| 7 | Intellectual Property |
| 8 | Service Levels |
| 9 | Governing Law & Jurisdiction |
| 10 | Force Majeure |

---

## Pipeline Architecture

The core pipeline lives in `llm_council/` and runs these steps for each clause:

```
Contract Text
     │
     ▼
1. Segmentation          (configurable model, default: OpenAI)
     │
     ▼
2. Initial Analysis      (all 3 models in parallel → AnalysisOutput per model)
     │
     ├─ No golden clause detected → skip (risk = 0)
     │
     ▼
3. Disagreement Check    (risk score variance / type / balance mismatch)
     │
     ├─ Consensus      → skip Council Review
     ├─ Disagreement   → Council Review (all 3 models peer-critique each other)
     │
     ▼
4. Arbitration           (configurable model, default: Gemini)
     │
     ▼
5. Structured Output     (ArbitrationOutput JSON per clause)
```

Risk levels: **Low** (0–3) · **Moderate** (4–6) · **High** (7–10)

---

## Project Structure

```
AIAP_15_AI-Powered-Contract-Risk-Management/
│
├── llm_council/                     # Core pipeline module
│   ├── main.py                      # Pipeline entry point (run_pipeline)
│   ├── app.py                       # Gradio web interface
│   ├── validate_system.ipynb        # Interactive validation notebook
│   ├── sample_contract.txt          # Sample contract for testing
│   ├── requirements.txt             # llm_council-specific dependencies
│   ├── .env                         # API keys (not committed)
│   │
│   ├── config/
│   │   ├── settings.py              # All pipeline configuration (models, batching, retries)
│   │   ├── golden_clauses.py        # Golden Clause definitions and examples
│   │   └── prompts.py               # LLM prompts (segmentation, analysis, review, arbitration)
│   │
│   ├── core/
│   │   ├── segmentation.py          # Splits contract into clauses (uses SEGMENTATION_MODEL)
│   │   ├── analysis.py              # Parallel initial analysis by all active models
│   │   ├── disagreement.py          # Detects disagreement and returns named reason
│   │   ├── review.py                # Council peer-review round (conditional)
│   │   ├── arbitration.py           # Final verdict (uses ARBITRATOR_MODEL)
│   │   ├── schemas.py               # Pydantic output schemas
│   │   └── utils.py                 # File extraction helpers (PDF, DOCX, TXT)
│   │
│   ├── models/
│   │   ├── openai_model.py          # OpenAI API wrapper
│   │   ├── claude_model.py          # Anthropic Claude API wrapper
│   │   ├── gemini_model.py          # Google Gemini API wrapper
│   │   ├── registry.py              # MODEL_REGISTRY + get_active_models()
│   │   └── utils.py                 # safe_llm_call (retry + exponential backoff)
│   │
│   └── notebooks/
│       └── run_pipeline.ipynb       # Notebook runner for the pipeline
│
├── UI/                              # Front-end assets
├── Golden Clause/                   # Reference golden clause documents
├── LLM_Investigation.ipynb          # Early-stage LLM exploration notebook
├── requirements.txt                 # Top-level dependencies
└── README.md                        # This file
```

---

## Configuration (`llm_council/config/settings.py`)

All operational parameters are controlled from a single file:

```python
# Which models participate in analysis & council review
AVAILABLE_MODELS = {"openai": True, "claude": True, "gemini": True}

# Role assignments — change string to "openai", "claude", or "gemini"
SEGMENTATION_MODEL = "openai"
ARBITRATOR_MODEL   = "gemini"

# Retry behaviour
MAX_RETRIES      = 2
RETRY_BASE_DELAY = 1.0   # wait = RETRY_BASE_DELAY × 2^attempt (exponential backoff)

# Batching — process N clauses in parallel per batch
BATCH_SIZE             = 6
INTER_BATCH_DELAY_SECS = 0   # increase to ~1.0 if you hit 429 rate-limit errors

# Disagreement threshold
VARIANCE_THRESHOLD = 1.0   # std-dev of risk scores above this triggers council review
```

---

## Setup

### 1. Prerequisites
- Python 3.8+
- API keys for OpenAI, Anthropic, and Google Gemini

### 2. Clone & create virtual environment

```bash
git clone <repository-url>
cd AIAP_15_AI-Powered-Contract-Risk-Management

# Windows
python -m venv ailpenv
ailpenv\Scripts\activate

# macOS / Linux
python3 -m venv ailpenv
source ailpenv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
pip install -r llm_council/requirements.txt
```

### 4. Configure API keys

Create `llm_council/.env`:

```env
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
GOOGLE_API_KEY=your_google_key_here
```

> **Never commit `.env` to version control.**

---

## Usage

### Run the pipeline programmatically

```python
import asyncio
from llm_council.main import run_pipeline

results = asyncio.run(run_pipeline(contract_text, output_path="output.json"))
```

### Run the Gradio web UI

```bash
cd llm_council
python app.py
```

### Run via CLI

```bash
cd llm_council
python main.py   # paste contract text into the __main__ block
```

### Validate components interactively

```bash
cd llm_council
jupyter notebook validate_system.ipynb
```

---

## Output Schema

Each clause in the returned list follows this structure:

```json
{
  "clause_id": 1,
  "clause_text": "...",
  "golden_clause_detected": true,
  "golden_clause_type": "Limitation of Liability",
  "final_risk_score": 7.5,
  "risk_level": "High",
  "business_risk_if_ignored": "...",
  "suggested_correction": "...",
  "justification": "...",
  "confidence": 0.87
}
```

Clauses where no golden clause was detected are returned with `final_risk_score: 0.0` and `risk_level: "None"`.
