from dotenv import load_dotenv
import os
import shutil
import logging
from datetime import datetime

# Load environment variables from .env file
load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
from main import run_pipeline
from core.utils import extract_text_from_file

logger = logging.getLogger(__name__)

app = FastAPI(title="Contract Risk Management API")

# ─── CORS ────────────────────────────────────────────────────────────────────
# In production (Railway), set FRONTEND_URL env var to your frontend's domain.
# Falls back to "*" for local dev.
FRONTEND_URL = os.getenv("FRONTEND_URL", "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL] if FRONTEND_URL != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Storage paths ────────────────────────────────────────────────────────────
STATS_FILE = "stats.json"
REPORTS_DIR = "reports"
UPLOADS_DIR = "uploads"

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".txt"}
MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024  # 20 MB

if not os.path.exists(REPORTS_DIR):
    os.makedirs(REPORTS_DIR)
if not os.path.exists(UPLOADS_DIR):
    os.makedirs(UPLOADS_DIR)

# ─── Startup warning for ephemeral filesystems (e.g. Railway) ────────────────
logging.basicConfig(level=logging.INFO)
logger.warning(
    "⚠️  Reports and uploads are stored on the local filesystem. "
    "On platforms with ephemeral storage (e.g. Railway), these files will be "
    "lost on redeploy. Consider using persistent storage (S3/Railway Volume) for production."
)


# ─── Stats helpers ────────────────────────────────────────────────────────────

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
        logger.warning("Reports directory %s not found.", REPORTS_DIR)
        return {
            "total_contracts": 0,
            "high_risk_contracts": 0,
            "total_risky_clauses": 0,
            "avg_risk_score": 0,
            "total_clauses": 0,
            "risk_distribution": risk_distribution,
            "business_impact": business_impact,
        }

    all_files = os.listdir(REPORTS_DIR)
    logger.info("Found %d files in %s", len(all_files), REPORTS_DIR)

    for filename in all_files:
        if not filename.endswith(".json"):
            continue
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
                if rl == "moderate":
                    rl = "medium"
                risk_distribution[rl] = risk_distribution.get(rl, 0) + 1

                text = res.get("clause_text", "").lower()
                if any(k in text for k in ["payment", "fee", "price"]):
                    business_impact["cash_flow"] += 1
                elif any(k in text for k in ["termination", "liability", "indemni"]):
                    business_impact["legal"] += 1
                elif any(k in text for k in ["deliver", "service", "timeline"]):
                    business_impact["ops"] += 1

                if rl not in ("none", ""):
                    total_risky_clauses += 1
                if rl == "high":
                    has_high = True
                contract_risk += res.get("final_risk_score", 0)

            if has_high:
                high_risk_contracts += 1
            if results:
                total_risk_sum += contract_risk / len(results)

        except Exception as e:
            logger.warning("Skipping malformed report file %s: %s", filename, e)
            continue

    stats = {
        "total_contracts": total_contracts,
        "high_risk_contracts": high_risk_contracts,
        "total_risky_clauses": total_risky_clauses,
        "avg_risk_score": (total_risk_sum / total_contracts) if total_contracts > 0 else 0,
        "total_clauses": total_clauses,
        "risk_distribution": risk_distribution,
        "business_impact": business_impact,
    }
    save_stats(stats)
    return stats


def load_stats():
    if os.path.exists(STATS_FILE):
        try:
            with open(STATS_FILE, "r") as f:
                stats = json.load(f)
            # Reconcile if missing newer keys
            if "high_risk_contracts" not in stats or "business_impact" not in stats:
                return reconcile_stats()
            return stats
        except Exception as e:
            logger.warning("Could not read stats file, reconciling: %s", e)
            return reconcile_stats()
    return reconcile_stats()


def save_stats(stats):
    try:
        with open(STATS_FILE, "w") as f:
            json.dump(stats, f)
    except Exception as e:
        logger.error("Failed to save stats: %s", e)


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    """Health check endpoint for Railway and other deployment platforms."""
    return {"status": "ok"}


@app.post("/analyze")
async def analyze_contract(file: UploadFile = File(...)):
    # ── Input validation ──────────────────────────────────────────────────────
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    content = await file.read()

    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({len(content) // (1024*1024)} MB). Maximum allowed is 20 MB."
        )

    try:
        contract_text = extract_text_from_file(content, file.filename)

        if not contract_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from file.")

        results = await run_pipeline(contract_text)

        # ── Update metrics ────────────────────────────────────────────────────
        stats = load_stats()
        stats["total_contracts"] += 1

        contract_total_risk = 0
        has_high_risk = False

        for res in results:
            stats["total_clauses"] += 1
            risk_level = res.get("risk_level", "None")
            stats["risk_distribution"][risk_level] = stats["risk_distribution"].get(risk_level, 0) + 1

            text = res.get("clause_text", "").lower()
            if any(k in text for k in ["payment", "fee", "price"]):
                stats["business_impact"]["cash_flow"] += 1
            elif any(k in text for k in ["termination", "liability", "indemni"]):
                stats["business_impact"]["legal"] += 1
            elif any(k in text for k in ["deliver", "service", "timeline"]):
                stats["business_impact"]["ops"] += 1

            if risk_level not in ("None", ""):
                stats["total_risky_clauses"] += 1
            if risk_level == "High":
                has_high_risk = True

            risk_score = res.get("final_risk_score", 0)
            contract_total_risk += risk_score

        if has_high_risk:
            stats["high_risk_contracts"] += 1

        avg_contract_risk = (contract_total_risk / len(results)) if results else 0
        stats["avg_risk_score"] = (
            (stats["avg_risk_score"] * (stats["total_contracts"] - 1) + avg_contract_risk)
            / stats["total_contracts"]
        )

        save_stats(stats)

        # ── Save individual report ────────────────────────────────────────────
        report_id = f"{int(datetime.now().timestamp())}_{file.filename.replace(' ', '_')}"
        report_data = {
            "id": report_id,
            "filename": file.filename,
            "results": results,
            "contract_text": contract_text,
            "timestamp": datetime.now().isoformat(),
        }

        with open(os.path.join(REPORTS_DIR, f"{report_id}.json"), "w") as f:
            json.dump(report_data, f)

        # ── Save original file ────────────────────────────────────────────────
        save_ext = ext if ext else ".pdf"
        upload_filename = f"{report_id}{save_ext}"
        with open(os.path.join(UPLOADS_DIR, upload_filename), "wb") as f:
            f.write(content)

        return {
            "id": report_id,
            "filename": file.filename,
            "results": results,
            "overall_stats": stats,
            "contract_text": contract_text,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Error during analysis of %s: %s", file.filename, e)
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/dashboard-stats")
async def get_stats():
    logger.info("Reconciling stats for dashboard...")
    return reconcile_stats()


@app.get("/reports")
async def get_reports():
    reports = []
    for filename in os.listdir(REPORTS_DIR):
        if not filename.endswith(".json"):
            continue
        report_path = os.path.join(REPORTS_DIR, filename)
        try:
            with open(report_path, "r") as f:
                data = json.load(f)
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
                "flagged_count": len(risky_clauses),
            })
        except Exception as e:
            logger.warning("Skipping malformed report file %s: %s", filename, e)
            continue

    reports.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return reports


@app.get("/reports/{report_id}")
async def get_report(report_id: str):
    report_path = os.path.join(REPORTS_DIR, f"{report_id}.json")
    if not os.path.exists(report_path):
        raise HTTPException(status_code=404, detail="Report not found")
    try:
        with open(report_path, "r") as f:
            return json.load(f)
    except Exception as e:
        logger.error("Error reading report %s: %s", report_id, e)
        raise HTTPException(status_code=500, detail="Failed to read report")


@app.get("/reports/{report_id}/file")
async def get_report_file(report_id: str):
    # Try original extension first, then fall back to .pdf for legacy reports
    for ext in [".pdf", ".docx", ".doc", ".txt", ""]:
        candidate = os.path.join(UPLOADS_DIR, f"{report_id}{ext}")
        if os.path.exists(candidate):
            from fastapi.responses import FileResponse
            media_types = {
                ".pdf": "application/pdf",
                ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".doc": "application/msword",
                ".txt": "text/plain",
            }
            media_type = media_types.get(ext, "application/octet-stream")
            return FileResponse(candidate, media_type=media_type, filename=f"{report_id}{ext}")
    raise HTTPException(status_code=404, detail="Original file not found")


@app.delete("/reports/{report_id}")
async def delete_report(report_id: str):
    report_path = os.path.join(REPORTS_DIR, f"{report_id}.json")
    if not os.path.exists(report_path):
        raise HTTPException(status_code=404, detail="Report not found")

    try:
        os.remove(report_path)
        # Remove any associated upload file
        for ext in [".pdf", ".docx", ".doc", ".txt", ""]:
            candidate = os.path.join(UPLOADS_DIR, f"{report_id}{ext}")
            if os.path.exists(candidate):
                os.remove(candidate)
                break
        reconcile_stats()
        return {"status": "success"}
    except Exception as e:
        logger.error("Error deleting report %s: %s", report_id, e)
        raise HTTPException(status_code=500, detail="Failed to delete report")


@app.delete("/reports")
async def delete_all_reports():
    try:
        if os.path.exists(REPORTS_DIR):
            shutil.rmtree(REPORTS_DIR)
        os.makedirs(REPORTS_DIR)

        if os.path.exists(UPLOADS_DIR):
            shutil.rmtree(UPLOADS_DIR)
        os.makedirs(UPLOADS_DIR)

        reconcile_stats()
        return {"status": "success"}
    except Exception as e:
        logger.error("Error clearing all reports: %s", e)
        raise HTTPException(status_code=500, detail="Failed to clear reports")


if __name__ == "__main__":
    import uvicorn
    # Railway injects $PORT; defaults to 8000 for local development
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
