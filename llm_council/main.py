import asyncio
from core.segmentation import segment_contract
from core.analysis import initial_analysis
from core.review import review_round
from core.arbitration import arbitration
from core.disagreement import should_proceed, needs_review
from dotenv import load_dotenv
load_dotenv()


async def run_pipeline(contract_text):

    clauses = await segment_contract(contract_text)
    results = []

    for clause in clauses:

        clause_text = clause["clause_text"]

        initial_outputs = await initial_analysis(clause_text)

        if not should_proceed(initial_outputs):
            results.append({
                "clause_id": clause["clause_id"],
                "clause_text": clause_text,
                "golden_clause_detected": False
            })
            continue

        if needs_review(initial_outputs):
            revised_outputs = await review_round(clause_text, initial_outputs)
        else:
            revised_outputs = initial_outputs

        final = await arbitration(clause_text, revised_outputs)

        results.append({
            "clause_id": clause["clause_id"],
            **final
        })

    return results


if __name__ == "__main__":
    contract_text = "PASTE CONTRACT TEXT HERE"
    output = asyncio.run(run_pipeline(contract_text))
    print(output)
