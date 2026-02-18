from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import asyncio
from main import run_pipeline
from core.utils import extract_text_from_file
from typing import List, Dict, Any

app = FastAPI()

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for demonstration (replace with database for production)
STATS_FILE = "stats.json"

def load_stats():
    if os.path.exists(STATS_FILE):
        with open(STATS_FILE, "r") as f:
            return json.load(f)
    return {
        "total_contracts": 0,
        "high_risk_clauses": 0,
        "avg_risk_score": 0,
        "total_clauses": 0,
        "risk_distribution": {"High": 0, "Moderate": 0, "Low": 0, "None": 0}
    }

def save_stats(stats):
    with open(STATS_FILE, "w") as f:
        json.dump(stats, f)

@app.post("/analyze")
async def analyze_contract(file: UploadFile = File(...)):
    try:
        content = await file.read()
        contract_text = extract_text_from_file(content, file.filename)
        
        if not contract_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from file.")

        results = await run_pipeline(contract_text)
        
        # Update metrics
        stats = load_stats()
        stats["total_contracts"] += 1
        
        contract_total_risk = 0
        clauses_with_risk = 0
        
        for res in results:
            stats["total_clauses"] += 1
            risk_level = res.get("risk_level", "None")
            stats["risk_distribution"][risk_level] = stats["risk_distribution"].get(risk_level, 0) + 1
            
            if risk_level == "High":
                stats["high_risk_clauses"] += 1
            
            risk_score = res.get("final_risk_score", 0)
            contract_total_risk += risk_score
            if risk_score > 0:
                clauses_with_risk += 1

        # Simple average risk update
        # (This is a naive update for demo purposes)
        avg_contract_risk = (contract_total_risk / len(results)) if results else 0
        stats["avg_risk_score"] = (stats["avg_risk_score"] * (stats["total_contracts"] - 1) + (avg_contract_risk * 10)) / stats["total_contracts"]

        save_stats(stats)
        
        return {
            "filename": file.filename,
            "results": results,
            "overall_stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dashboard-stats")
async def get_stats():
    return load_stats()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
