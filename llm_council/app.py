from dotenv import load_dotenv
import os
import shutil
from datetime import datetime

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
REPORTS_DIR = "reports"
UPLOADS_DIR = "uploads"

if not os.path.exists(REPORTS_DIR):
    os.makedirs(REPORTS_DIR)
if not os.path.exists(UPLOADS_DIR):
    os.makedirs(UPLOADS_DIR)

def reconcile_stats():
    """Recalculate stats based on actual report files."""
    total_contracts = 0
    high_risk_contracts = 0
    total_risky_clauses = 0
    total_clauses = 0
    total_risk_sum = 0
    risk_distribution = {"high": 0, "medium": 0, "low": 0, "none": 0}
    business_impact = {"cash_flow": 0, "legal": 0, "ops": 0}
    
    if not os.path.exists(REPORTS_DIR):
        print(f"Reports directory {REPORTS_DIR} not found.")
        return {
            "total_contracts": 0,
            "high_risk_contracts": 0,
            "total_risky_clauses": 0,
            "avg_risk_score": 0,
            "total_clauses": 0,
            "risk_distribution": risk_distribution,
            "business_impact": business_impact
        }
        
    all_files = os.listdir(REPORTS_DIR)
    print(f"Found {len(all_files)} files in {REPORTS_DIR}")
    for filename in all_files:
        if filename.endswith(".json"):
            try:
                with open(os.path.join(REPORTS_DIR, filename), "r") as f:
                    data = json.load(f)
                    results = data.get("results", [])
                    total_contracts += 1
                    total_clauses += len(results)
                    
                    has_high = False
                    contract_risk = 0
                    for res in results:
                        rl = res.get("risk_level", "None").lower()
                        if rl == 'moderate': rl = 'medium'
                        risk_distribution[rl] = risk_distribution.get(rl, 0) + 1
                        
                        text = res.get("clause_text", "").lower()
                        if any(k in text for k in ['payment', 'fee', 'price']):
                            business_impact["cash_flow"] += 1
                        elif any(k in text for k in ['termination', 'liability', 'indemni']):
                            business_impact["legal"] += 1
                        elif any(k in text for k in ['deliver', 'service', 'timeline']):
                            business_impact["ops"] += 1
                        
                        if rl != "none" and rl != "":
                            total_risky_clauses += 1
                        if rl == "high":
                            has_high = True
                        contract_risk += res.get("final_risk_score", 0)
                    
                    if has_high:
                        high_risk_contracts += 1
                    
                    if results:
                        total_risk_sum += (contract_risk / len(results))
            except:
                continue
                
    stats = {
        "total_contracts": total_contracts,
        "high_risk_contracts": high_risk_contracts,
        "total_risky_clauses": total_risky_clauses,
        "avg_risk_score": (total_risk_sum / total_contracts) if total_contracts > 0 else 0,
        "total_clauses": total_clauses,
        "risk_distribution": risk_distribution,
        "business_impact": business_impact
    }
    save_stats(stats)
    return stats

def load_stats():
    # Always reconcile at least once or if asked? 
    # For now, let's reconcile on load if total_contracts seems off or just to be safe.
    if os.path.exists(STATS_FILE):
        with open(STATS_FILE, "r") as f:
            stats = json.load(f)
            # Basic sanity check: if the stats file is old (missing new keys), reconcile
            if "high_risk_contracts" not in stats or "business_impact" not in stats:
                return reconcile_stats()
            return stats
    return reconcile_stats()

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
        has_high_risk = False
        
        for res in results:
            stats["total_clauses"] += 1
            risk_level = res.get("risk_level", "None")
            stats["risk_distribution"][risk_level] = stats["risk_distribution"].get(risk_level, 0) + 1
            
            text = res.get("clause_text", "").lower()
            if any(k in text for k in ['payment', 'fee', 'price']):
                stats["business_impact"]["cash_flow"] += 1
            elif any(k in text for k in ['termination', 'liability', 'indemni']):
                stats["business_impact"]["legal"] += 1
            elif any(k in text for k in ['deliver', 'service', 'timeline']):
                stats["business_impact"]["ops"] += 1

            if risk_level != "None" and risk_level != "":
                stats["total_risky_clauses"] += 1
            
            if risk_level == "High":
                has_high_risk = True
            
            risk_score = res.get("final_risk_score", 0)
            contract_total_risk += risk_score
            if risk_score > 0:
                clauses_with_risk += 1

        if has_high_risk:
            stats["high_risk_contracts"] += 1
        avg_contract_risk = (contract_total_risk / len(results)) if results else 0
        stats["avg_risk_score"] = (stats["avg_risk_score"] * (stats["total_contracts"] - 1) + avg_contract_risk) / stats["total_contracts"]

        save_stats(stats)
        
        # Save individual report
        report_id = f"{int(datetime.now().timestamp())}_{file.filename.replace(' ', '_')}"
        report_data = {
            "id": report_id,
            "filename": file.filename,
            "results": results,
            "contract_text": contract_text,
            "timestamp": datetime.now().isoformat()
        }
        
        with open(os.path.join(REPORTS_DIR, f"{report_id}.json"), "w") as f:
            json.dump(report_data, f)
        
        # Save original PDF
        pdf_filename = report_id if report_id.lower().endswith(".pdf") else f"{report_id}.pdf"
        pdf_path = os.path.join(UPLOADS_DIR, pdf_filename)
        with open(pdf_path, "wb") as f:
            f.write(content)
        
        return {
            "id": report_id,
            "filename": file.filename,
            "results": results,
            "overall_stats": stats,
            "contract_text": contract_text
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/dashboard-stats")
async def get_stats():
    print("Reconciling stats for dashboard...")
    return reconcile_stats()

@app.get("/reports")
async def get_reports():
    reports = []
    for filename in os.listdir(REPORTS_DIR):
        if filename.endswith(".json"):
            report_path = os.path.join(REPORTS_DIR, filename)
            with open(report_path, "r") as f:
                try:
                    data = json.load(f)
                    # Calculate summary stats for the list
                    results = data.get("results", [])
                    risky_clauses = [r for r in results if r.get("risk_level", "None").lower() != "none"]
                    
                    has_high = any(r.get("risk_level", "").lower() == "high" for r in results)
                    has_med = any(r.get("risk_level", "").lower() in ["medium", "moderate"] for r in results)
                    
                    overall_risk = "High" if has_high else "Medium" if has_med else "Low"

                    reports.append({
                        "id": data.get("id"),
                        "filename": data.get("filename"),
                        "timestamp": data.get("timestamp"),
                        "status": "completed",
                        "risk_level": overall_risk,
                        "flagged_count": len(risky_clauses)
                    })
                except:
                    continue
    # Sort by timestamp descending
    reports.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return reports

@app.get("/reports/{report_id}")
async def get_report(report_id: str):
    report_path = os.path.join(REPORTS_DIR, f"{report_id}.json")
    if not os.path.exists(report_path):
        raise HTTPException(status_code=404, detail="Report not found")
    with open(report_path, "r") as f:
        return json.load(f)

@app.get("/reports/{report_id}/file")
async def get_report_file(report_id: str):
    pdf_filename = report_id if report_id.lower().endswith(".pdf") else f"{report_id}.pdf"
    pdf_path = os.path.join(UPLOADS_DIR, pdf_filename)
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=404, detail="Original PDF not found")
    
    from fastapi.responses import FileResponse
    return FileResponse(pdf_path, media_type="application/pdf", filename=f"{report_id}.pdf")

@app.delete("/reports/{report_id}")
async def delete_report(report_id: str):
    report_path = os.path.join(REPORTS_DIR, f"{report_id}.json")
    pdf_filename = report_id if report_id.lower().endswith(".pdf") else f"{report_id}.pdf"
    pdf_path = os.path.join(UPLOADS_DIR, pdf_filename)
    
    if not os.path.exists(report_path):
        raise HTTPException(status_code=404, detail="Report not found")
    
    os.remove(report_path)
    if os.path.exists(pdf_path):
        os.remove(pdf_path)
    
    reconcile_stats()
    return {"status": "success"}

@app.delete("/reports")
async def delete_all_reports():
    # Remove reports directory and recreate
    if os.path.exists(REPORTS_DIR):
        shutil.rmtree(REPORTS_DIR)
    os.makedirs(REPORTS_DIR)
    
    # Remove uploads directory and recreate
    if os.path.exists(UPLOADS_DIR):
        shutil.rmtree(UPLOADS_DIR)
    os.makedirs(UPLOADS_DIR)
    
    reconcile_stats()
    return {"status": "success"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
