# Railway Deployment Guide

Deploying this app requires two Railway services from the same GitHub repo — one for the backend (FastAPI) and one for the frontend (React/Vite).

---

## Pre-flight Checklist

Ensure these files are committed and pushed before setting up Railway:

| File | Purpose |
|---|---|
| `llm_council/Procfile` | Backend start command |
| `llm_council/railway.toml` | Backend healthcheck config |
| `UI/.../railway.toml` | Frontend build/start config |
| `UI/.../.node-version` | Forces Node 20 (required by pdfjs-dist) |
| `UI/.../package-lock.json` | Must be synced (`npm install` run locally) |

---

## Step 1 — Create a Railway Project

1. [railway.app](https://railway.app) → **New Project → Empty Project**

---

## Step 2 — Backend Service

1. **+ New Service → GitHub Repo** → select your repo
2. **Settings → Source → Root Directory:** `llm_council`
3. **Variables** tab → add all before deploying:

   | Variable | Value |
   |---|---|
   | `OPENAI_API_KEY` | your OpenAI key |
   | `ANTHROPIC_API_KEY` | your Anthropic key |
   | `GOOGLE_API_KEY` | your Google/Gemini key |
   | `FRONTEND_URL` | *(add after Step 3 — leave blank for now)* |

4. Click **Deploy** → wait for green status
5. **Settings → Networking → Generate Domain** → enter any port (Railway handles routing) → copy the URL

---

## Step 3 — Frontend Service

> **Important:** Set `VITE_API_BASE_URL` **before** deploying. It is baked into the JS bundle at build time — if set after, you must redeploy.

1. **+ New Service → GitHub Repo** → select the same repo
2. **Settings → Source → Root Directory:** `UI/AI Contract Risk Management UI`
3. **Variables** tab → add before deploying:

   | Variable | Value |
   |---|---|
   | `VITE_API_BASE_URL` | Backend URL from Step 2 — **must include `https://`** (e.g. `https://xxx.up.railway.app`) |

4. Click **Deploy** → Railway runs `npm ci && npm run build` then `npm start` (which runs `serve -s build -l $PORT`)
5. **Settings → Networking → Generate Domain** → enter any port number
6. **Check Deploy Logs** — find the line:
   ```
   INFO  Accepting connections at http://localhost:XXXX
   ```
7. Go back to **Settings → Networking** and set the domain port to match `XXXX` from the logs (typically `8080`)
8. Copy the frontend URL

---

## Step 4 — Wire FRONTEND_URL Back to Backend

Backend service → **Variables** → fill in:

| Variable | Value |
|---|---|
| `FRONTEND_URL` | Frontend URL from Step 3 — **must include `https://`**, no trailing slash (e.g. `https://yyy.up.railway.app`) |

Railway restarts the backend automatically — no redeploy needed.

---

## Step 5 — Verify

| Check | Expected result |
|---|---|
| `https://<backend-url>/health` | `{"status":"ok"}` |
| Frontend URL | Landing page loads |
| Upload a PDF | Analysis completes and results appear |
| Browser DevTools → Console | No CORS errors |

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| 502 on frontend | Domain port ≠ serve port | Check Deploy Logs for actual port, update domain port to match |
| Build fails (`npm ci` lock file error) | `package-lock.json` out of sync | Run `npm install` locally, commit and push `package-lock.json` |
| Node version error | Railway using Node 18 | Ensure `.node-version` file with `20` is committed |
| API calls fail | `VITE_API_BASE_URL` missing `https://` | Value must start with `https://` — if not, requests go to the wrong URL |
| API calls fail | `VITE_API_BASE_URL` not set or set after build | Set variable, then redeploy frontend |
| CORS error on response | `FRONTEND_URL` missing `https://` | Value must include `https://`, exact domain, no trailing slash |
| CORS error on response | `FRONTEND_URL` not set on backend | Add frontend URL to backend variables |

---

## Environment Variables Summary

| Service | Variable | Notes |
|---|---|---|
| Backend | `OPENAI_API_KEY` | Set before deploy |
| Backend | `ANTHROPIC_API_KEY` | Set before deploy |
| Backend | `GOOGLE_API_KEY` | Set before deploy |
| Backend | `FRONTEND_URL` | Set after frontend deploys |
| Frontend | `VITE_API_BASE_URL` | **Must** be set before deploy (build-time) |
