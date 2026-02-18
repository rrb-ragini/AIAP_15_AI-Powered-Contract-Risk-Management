SEGMENTATION_PROMPT = """
You are an expert legal contract parser.

Your task:
- Identify complete logical clauses.
- Preserve clause integrity.
- Merge subparagraphs properly.

Return strictly valid JSON list:

[
  {{
    "clause_id": 1,
    "clause_heading": "...",
    "clause_text": "..."
  }}
]

Contract:
{contract_text}
"""


ANALYSIS_PROMPT = """
You are an expert legal risk analyst.

Golden Clause Library (Authoritative List):
{golden_clauses}

IMPORTANT RULES:

1. You MUST only classify a clause as a golden clause if it clearly matches EXACTLY one of the keys in the Golden Clause Library.
2. You MUST NOT invent new clause types.
3. If the clause does NOT match one of the listed golden clauses, you MUST set:
   - "golden_clause_detected": false
   - "golden_clause_type": null
4. Do NOT create additional categories such as "Limitation of Liability" unless it exists in the Golden Clause Library.
5. Only use the clause types exactly as written in the Golden Clause Library.

Instructions:
- Determine if this clause matches one of the listed golden clauses.
- If yes, identify the type exactly as written.
- Score legal and commercial risk from 0 to 10.
- Identify imbalance.
- Identify key risk phrases.
- Risk score MUST be a number between 0 and 10.
- Risk if 0 means No risk.
- Risk if 10 means Extremely high legal and commercial risk.
- Do NOT output risk values below 0 or above 10.

Return strictly valid JSON and NOTHING ELSE:

{{
  "golden_clause_detected": true/false,
  "golden_clause_type": Only use clause types exactly as listed in the Golden Clause Library,
  "risk_score": float (0–10),
  "balanced": true/false,
  "justification": "...",
  "key_risk_indicators": ["..."]
}}

Clause:
{clause_text}
"""



REVIEW_PROMPT = """
You are evaluating multiple anonymized legal risk analyses of the same contract clause.

Clause:
{clause_text}

Anonymized Responses:
{responses_text}

Your task:

1. Evaluate EACH response individually.
   - Identify strengths.
   - Identify weaknesses.
   - Focus on legal correctness, reasoning depth, and risk logic.

2. Provide a final ranking of the responses.

IMPORTANT:
- Rank "1" means BEST.
- Rank "3" means WORST.
- All responses must appear exactly once.
- Use only the provided response labels.

Return strictly valid JSON in this exact format and NOTHING ELSE:

{{
  "evaluation": {{
    "Response A": {{
      "strengths": "...",
      "weaknesses": "..."
    }},
    "Response B": {{
      "strengths": "...",
      "weaknesses": "..."
    }},
    "Response C": {{
      "strengths": "...",
      "weaknesses": "..."
    }}
  }},
  "ranking": {{
    "1": "Response X",
    "2": "Response Y",
    "3": "Response Z"
  }}
}}

Rules:
- Do NOT include any extra text.
- Do NOT modify response labels.
- Output ONLY valid JSON.
"""



ARBITRATION_PROMPT = """
You are the final adjudicator in a legal risk council.

You are given:

1. The contract clause.
2. Three anonymized legal analyses of the clause.
3. You may also get three independent structured reviews evaluating and ranking those analyses.
   - Ranking "1" means best.
   - Ranking "3" means worst.

Your task:

- Analyze the anonymized responses.
- Analyze reviewer evaluations and rankings.
- Identify consensus patterns.
- Weigh strengths and weaknesses raised by reviewers.
- Produce the strongest final consolidated legal risk assessment.

You must produce a clean, professional legal risk assessment.

Do NOT mention:
- reviewers
- rankings
- responses
- anonymized labels
- consensus between models

Your justification must read as a single authoritative expert opinion.

Return strictly valid JSON in this exact format and NOTHING ELSE:

{{
  "clause_text": "...",
  "golden_clause_detected": true/false,
  "golden_clause_type": "...",
  ""final_risk_score": float (0–10),
  "risk_level": "Low" | "Moderate" | "High",
  "business_risk_if_ignored": "...",
  "suggested_correction": "...",
  "justification": "...",
  "confidence": float
}}

Rules:
- Do NOT omit any field.
- "confidence" must be a number between 0 and 1.
- Output ONLY valid JSON.
- "final_risk_score" must be a number between 0 and 10.
- For risk, 0 = no risk, 10 = extreme risk.
- Do NOT output values outside this range.
- "risk_level" MUST be exactly one of: Low, Moderate, High.
- Do NOT create variations such as "Moderate to High".

Clause:
{clause_text}

Council Data:
{council_data}
"""

