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

Return strictly valid JSON and NOTHING ELSE:

{{
  "golden_clause_detected": true/false,
  "golden_clause_type": "Indemnity" | "Payment" | "Data Security" | null,
  "risk_score": float,
  "balanced": true/false,
  "justification": "...",
  "key_risk_indicators": ["..."]
}}

Clause:
{clause_text}
"""



REVIEW_PROMPT = """
You are reviewing peer legal analysis.

Clause:
{clause_text}

Your analysis:
{self_output}

Peer analyses:
{peer_outputs}

Revise only if clearly justified.

Return strictly valid JSON:
{{
  "golden_clause_detected": true/false,
  "golden_clause_type": "...",
  "risk_score": float,
  "balanced": true/false,
  "justification": "...",
  "revised": true/false,
  "revision_reason": "..."
}}
"""


ARBITRATION_PROMPT = """
You are the final legal arbitrator.

Clause:
{clause_text}

Model outputs:
{model_outputs}

Produce final consolidated judgment.

Return strictly valid JSON:
{{
  "clause_text": "...",
  "golden_clause_detected": true/false,
  "golden_clause_type": "...",
  "final_risk_score": float,
  "risk_level": "Low/Medium/High",
  "business_risk_if_ignored": "...",
  "suggested_correction": "...",
  "justification": "...",
  "confidence": float
}}
"""
