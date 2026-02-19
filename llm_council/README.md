# LLM Council - AI-Powered Contract Risk Management

This directory contains the `llm_council` module, a multi-model system designed to analyze contract clauses, detect risks against "Golden Clauses", and reach a consensus through a council of AI models (OpenAI, Anthropic Claude, and Google Gemini).

## 🧠 Architecture & Information Flow

![Information Flow Diagram](Information_Flow_Council_LLM.png)

This pipeline orchestrates a multi-step analysis process:
1.  **Segmentation**: Breaks contract into clauses.
2.  **Initial Analysis**: Parallel analysis by three LLMs.
3.  **Council Review**: Models critique each other if there is disagreement.
4.  **Arbitration**: Final decision making by a designated judge model.

---

## 🛠️ Prerequisites

- **Python 3.8+**
- Active API keys for:
    - OpenAI (GPT-4 or similar)
    - Anthropic (Claude 3 or similar)
    - Google (Gemini Pro or similar)

## 📦 Installation

1. **Clone the repository** and navigate to the `llm_council` directory.
2. **Install dependencies** using pip:

```bash
pip install -r requirements.txt
```

## ⚙️ Configuration

1. **Create a `.env` file** in the root directory.
2. **Add your API keys** to the `.env` file:

```env
OPENAI_API_KEY=your_openai_key_here
ANTHROPIC_API_KEY=your_anthropic_key_here
GOOGLE_API_KEY=your_google_key_here
```

## 🚀 Usage

### Run the Main Pipeline
To analyze a contract, you can run the `main.py` script directly. 
*Note: Ensure you have pasted your contract text into the `__main__` block or modified the script to accept input.*

```bash
python main.py
```

### Run using Jupyter Notebook
For a more interactive experience or to validate specific components, use the provided notebook:

```bash
jupyter notebook validate_system.ipynb
```

---

## 🏗️ Project Skeleton

```
.
├── config/
│   ├── golden_clauses.py
│   ├── prompts.py
│   └── settings.py
├── core/
│   ├── analysis.py
│   ├── arbitration.py
│   ├── disagreement.py
│   ├── review.py
│   ├── schemas.py
│   └── segmentation.py
├── models/
│   ├── claude_model.py
│   ├── gemini_model.py
│   ├── openai_model.py
│   └── registry.py
├── notebooks/
│   └── run_pipeline.ipynb
├── .env
├── main.py
├── requirements.txt
└── validate_system.ipynb
```

## 📂 File Descriptions

### **Root Directory**
- **`main.py`**: The entry point. Orchestrates the pipeline.
- **`validate_system.ipynb`**: Notebook for testing and validation.
- **`requirements.txt`**: Project dependencies.

### **`config/`**
- **`golden_clauses.py`**: Benchmarks for risk analysis (Standard Clauses).
- **`prompts.py`**: System prompts for Analysis, Review, and Arbitration.
- **`settings.py`**: Configuration settings.

### **`core/`**
- **`segmentation.py`**: Splits contract into clauses.
- **`analysis.py`**: **Initial Analysis** phase (Independent model breakdown).
- **`disagreement.py`**: Logic to trigger **Council Review** based on score variance.
- **`review.py`**: **Council Review** phase (Peer critique).
- **`arbitration.py`**: **Arbitration** phase (Final synthesis and verdict).
- **`schemas.py`**: Pydantic data models for structured outputs.

### **`models/`**
- **`openai_model.py`**, **`claude_model.py`**, **`gemini_model.py`**: API Wrappers.
- **`registry.py`**: Model registry.

---

## 🔄 Detailed Pipeline Steps

When a contract is submitted for analysis in `main.py`, the data flows as follows:

### 1. Segmentation
The raw contract text is passed to `segment_contract`, splitting it into distinct clauses.

### 2. Initial Analysis (Parallel)
Each clause is sent to all three models (OpenAI, Claude, Gemini) simultaneously alongside the "Golden Clauses".
- **Action**: Assess risk, check deviations, assign risk score.
- **Output**: Three independent `AnalysisOutput` objects.

### 3. Golden Clause Check & Filtering
- If **NO** model detects a Golden Clause, the clause is skipped (Risk = 0).
- If **YES**, the pipeline proceeds.

### 4. Anonymization
Initial outputs are anonymized ("Response A", "Response B", "Response C") to prevent bias during review.

### 5. Disagreement Check
- **Low Disagreement**: Review phase may be skipped.
- **High Disagreement**: **Council Review** is triggered to resolve conflict.

### 6. Council Review (Conditional)
Models review the *anonymized* responses of others.
- **Action**: Critique logic and scoring, identifying strengths/weaknesses.
- **Output**: Critiques from each reviewer.

### 7. Arbitration
The Arbitrator model (Gemini) aggregates all data (Original Clause, Initial Responses, Peer Reviews).
- **Action**: Weighs initial thoughts against critiques to form a final opinion.
- **Output**: Definitive **Risk Score**, **Risk Level**, **Justification**, and **Suggested Correction**.

### 8. Result Compilation
Final analysis list is returned.

---

## 🤝 Contributing

Contributions are welcome!
- **Author**: Nanduri Anirudh
