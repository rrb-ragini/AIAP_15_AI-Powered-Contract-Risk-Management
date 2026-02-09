# AIAP_15_AI-Powered-Contract-Risk-Management

**Course Project for BITSoM AIAP (Applied AI Project)**

This project leverages Large Language Models (LLMs) to automate the analysis of B2B legal contracts. It identifies key "Golden Clauses," assesses their risk levels, and provides structured justifications to aid legal professionals and contract managers.

## Project Overview

The core objective is to build an intelligent tool that can:
1.  **Ingest B2B Contracts**: Process legal documents to extract relevant text.
2.  **Identify Golden Clauses**: Automatically detect 10 critical clause categories (e.g., Indemnification, Liability, Termination).
3.  **Assess Risk**: Evaluate each clause against standard balanced commercial terms and assign a risk rating (Low, Medium, High).
4.  **Structured Output**: Deliver analysis in a strict JSON format for downstream processing.

### The 10 Golden Clauses
The system is designed to identify and analyze the following:
1.  **Payment Terms**
2.  **Limitation of Liability**
3.  **Indemnification**
4.  **Governing Law & Jurisdiction**
5.  **Data Privacy**
6.  **Termination**
7.  **Force Majeure**
8.  **Intellectual Property**
9.  **Confidentiality**
10. **Non-Solicitation**

## Setup Instructions

Follow these steps to set up your development environment.

### 1. Prerequisite
Ensure you have Python 3.8+ installed.

### 2. Clone the Repository
```bash
git clone <repository-url>
cd AIAP_15_AI-Powered-Contract-Risk-Management
```

### 3. Create a Virtual Environment
It is recommended to use a virtual environment to manage dependencies.

**Windows:**
```bash
python -m venv ailpenv
ailpenv\Scripts\activate
```

**macOS/Linux:**
```bash
python3 -m venv ailpenv
source ailpenv/bin/activate
```

### 4. Install Dependencies
Install the required packages from `requirements.txt`:
```bash
pip install -r requirements.txt
```

### 5. Configure Environment Variables
1.  Create a `.env` file in the root directory (copy from `.env.example` if available).
2.  Add your API keys. **Do not commit this file to version control.**

**`.env` format:**
```env
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
```

### 6. Git Ignore
Ensure your `.gitignore` includes the following to prevent accidental commits of sensitive files:
```text
.env
ailpenv/
__pycache__/
.ipynb_checkpoints/
```

## Usage

The primary analysis tool is currently implemented in a Jupyter Notebook.

1.  Start Jupyter Notebook:
    ```bash
    jupyter notebook
    ```
2.  Open `LLM_Investigation.ipynb`.
3.  Run the cells to initialize the models and process contract text.

## Risk Assessment Framework

The tool evaluates risk based on deviation from balanced commercial norms:

-   **Low Risk**: Standard, balanced terms. Fairly shared obligations.
-   **Medium Risk**: Some deviation favoring the counterparty, or minor ambiguity.
-   **High Risk**: Significant imbalance, unlimited liability, vague obligations, or heavy penalties.

## Project Structure

```
AIAP_15_AI-Powered-Contract-Risk-Management/
├── LLM_Investigation.ipynb  # Main analysis notebook
├── requirements.txt         # Project dependencies
├── .env                     # API keys (not committed)
└── README.md                # Project documentation
```
