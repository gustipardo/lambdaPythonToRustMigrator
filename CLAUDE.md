# Lambda Python → Rust Migrator

## Project Context

Hackathon-style project. Deadline: ~few days. Scope locked. No scope creep.

Goal: demonstrate frontend + backend skills + LLM-assisted code migration pipeline.
Product: SaaS-style web page where user pastes Python Lambda → gets Rust Lambda back.
No auth. No DB. No storage. Stateless.

## Workflow Rules

- Direct to implementation. No over-engineering.
- Side features go in `SIDE_FEATURES.md` — NOT in code.
- Every decision favors shipping over perfection.
- No comments unless WHY is non-obvious.
- No unused abstractions.

## Stack (locked — see ARCHITECTURE.md for rationale)

- **Frontend**: React + Vite + TypeScript + Tailwind
- **Components**: shadcn/ui (components live in repo, full control)
- **Charts**: Recharts
- **Backend**: FastAPI Python 3.11 (single file, async, Anthropic SDK native)
- **LLM**: Claude Sonnet 4.6 + prompt caching — $15 budget
- **Theme**: Light-first. Warm paper `#FAF7F1`, amber accent `#B87826`
- **NOT using**: Next.js (no SSR/routing needed), Astro (too much interactivity for islands), Monaco (side feature), any DB

## Infrastructure

- AWS account: ready to use (for running demo benchmarks if needed)
- No deployment to cloud required for the demo — local Vite dev + uvicorn is enough

## Priority Features (must ship)

- [ ] Landing page with value prop (cold start numbers, before/after)
- [ ] Code editor input (Python Lambda paste)
- [ ] Migration call → Claude API → Rust output
- [ ] Code output display with copy button
- [ ] Basic error handling (invalid input, API failure)

## Side Features (logged in SIDE_FEATURES.md — do not implement)

See `SIDE_FEATURES.md`

## Budget

Anthropic API: ~$15 USD. Use claude-sonnet-4-6. Cache prompts where possible.
Each migration ~1k-3k tokens input + output ≈ $0.003–0.01 per call. ~1500–5000 calls max.

## Key Files

- `CLAUDE.md` — this file (Claude reads this automatically on project open)
- `ARCHITECTURE.md` — system design, screens, endpoint contract, design tokens, all stack decisions with rationale
- `SIDE_FEATURES.md` — out-of-scope ideas
- `Investigation/FEASIBILITY.md` — idea validation, risks, LLM pipeline, output testing decision
- `README.md` — full project overview for humans and onboarding

## Guidance for Claude When Coding

- **Before adding any feature:** check `SIDE_FEATURES.md`. If it's there, don't build it.
- **Backend `main.py`:** keep as a single file. No splitting into modules unless it exceeds ~200 lines.
- **Claude API calls:** always use the system prompt as a cached block (`cache_control: ephemeral`). Never skip caching — the $15 budget depends on it.
- **Frontend components:** use shadcn/ui primitives first. Only write custom Tailwind if shadcn doesn't cover it.
- **Demo examples:** stored as JSON in `backend/examples/`. Never hardcode them in Python or JS.
- **Metrics in custom mode:** always mark `"estimated": true`. Never fabricate real benchmark numbers for user-submitted code.
- **No TypeScript `any`.** No `// eslint-disable`. Fix the type, don't suppress it.
- **CORS:** FastAPI backend must allow the Vite dev origin (`localhost:5173`).
- **Error states:** show them in the UI. Never silently swallow API errors.
