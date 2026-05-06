# AI Equity Research Analyst — Web

UI for the [equity-research-ai-api](../equity-research-ai-api).

Four tabs:
- **Ask filings** — retrieval Q&A across (or scoped to a single) issuer
- **Investment memo** — multi-question structured memo with citation-backed answers; LLM-synthesised when the API has `ANTHROPIC_API_KEY`, evidence-only fallback otherwise
- **DCF** — two-stage DCF with WACC × terminal-growth sensitivity table
- **Peer comps** — EV/Sales, EV/EBITDA, P/E triangulation

## Setup
```bash
npm install
NEXT_PUBLIC_API_URL=http://localhost:8000 npm run dev
```
