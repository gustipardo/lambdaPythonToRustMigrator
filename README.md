# Lambda Python → Rust Migrator

> Paste your Python Lambda. Get a Rust Lambda. Ship dramatically faster code without writing a line of Rust.

Hackathon-scope project (3–5 days). Demonstrates frontend + backend + LLM-assisted code migration pipeline.

---

## The Problem

AWS Lambda cold starts in Python take 100–500ms. Rust cold starts take 1–10ms.
Most teams don't switch because learning Rust is expensive. This tool removes that barrier.

| Metric | Python Lambda | Rust Lambda | Improvement |
|--------|--------------|-------------|-------------|
| Cold start | ~340ms | ~8ms | **97% faster** |
| Memory | ~140MB | ~35MB | **75% less** |
| AWS cost | baseline | ~4× cheaper | significant |

Numbers from: [confessionsofadataguy.com](https://www.confessionsofadataguy.com/aws-lambdas-python-vs-rust-performance-and-cost-savings/) + [paiml.com](https://paiml.com/blog/2024-12-30-lambda-rust-python/) benchmarks.

---

## How It Works

Single web page. Two modes.

### Demo Mode
5 pre-validated Lambda examples (S3, DynamoDB, SQS, HTTP handler).
Each example shows real benchmark numbers from AWS (Init Duration / Duration / Memory).
Python source and generated Rust side by side. No LLM call at runtime.

### Custom Mode
User pastes their own Python Lambda handler.
Backend calls Claude Sonnet 4.6 → returns `main.rs` + `Cargo.toml`.
Estimated performance improvement shown. Disclaimer: review before deploying.

```
User pastes Python
       ↓
POST /migrate (FastAPI)
       ↓
Claude Sonnet 4.6
       ↓
main.rs + Cargo.toml returned
       ↓
Display + copy button
```

---

## Stack

| Layer | Tech | Why |
|-------|------|-----|
| Frontend | React + Vite + TypeScript | Highly interactive — tabs, editor, charts, API calls. Next.js/Astro add overhead for zero gain |
| Components | shadcn/ui + Tailwind | Components live in repo, full token control, accessible |
| Charts | Recharts | Lightweight, React-native |
| Backend | FastAPI (Python 3.11) | One file, async, Anthropic SDK native |
| LLM | Claude Sonnet 4.6 + prompt caching | Best code generation quality, existing API credit |
| Demo data | Static JSON files | No DB needed, stateless |

---

## Project Structure (planned)

```
/
├── frontend/          ← React + Vite app
│   └── src/
│       ├── components/
│       └── App.tsx
├── backend/           ← FastAPI server
│   ├── main.py        ← Single entry point
│   ├── examples/      ← Pre-validated demo JSON files
│   └── prompt.py      ← Claude system prompt
├── Investigation/     ← Research notes (read these first)
│   ├── FEASIBILITY.md       ← Idea validation, risks, LLM pipeline design
│   ├── LAMBDA_INTRO.md      ← What is Lambda, why Rust matters
│   ├── AWS lambda Python vs Lambda.md  ← Benchmark blog post (source of numbers)
│   ├── Rust on AWS Lambda? (Reddit).md ← Community experience
│   └── Github Repositories.md         ← Reference repos
├── ARCHITECTURE.md    ← System design, endpoints, design system, all decisions
├── SIDE_FEATURES.md   ← Out-of-scope features (do not implement)
└── CLAUDE.md          ← Workflow rules, priorities, budget
```

---

## Reading Order (for new contributors)

1. This file — overview
2. `Investigation/LAMBDA_INTRO.md` — context on Lambda + cold starts
3. `Investigation/FEASIBILITY.md` — is this a good idea? what are the risks?
4. `ARCHITECTURE.md` — full system design, stack decisions, design system, endpoints
5. `SIDE_FEATURES.md` — what we explicitly are NOT building

---

## API

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/migrate` | Migrate Python Lambda to Rust via Claude |
| `GET` | `/examples` | Return pre-validated demo examples |

### POST /migrate — Request
```json
{
  "code": "def lambda_handler(event, context): ...",
  "mode": "custom"
}
```

### POST /migrate — Response
```json
{
  "rust_code": "use lambda_runtime::...",
  "cargo_toml": "[package]\nname = ...",
  "metrics": {
    "estimated": true,
    "cold_start_python_ms": 340,
    "cold_start_rust_ms": 8,
    "memory_python_mb": 139,
    "memory_rust_mb": 35,
    "improvement_label": "~97% faster cold start"
  }
}
```

---

## Design

Light-first. Warm paper background (`#FAF7F1`), Amber accent (`#B87826`).
"Editorial Dev-Tool" aesthetic — Linear + Readwise, not AI-hype gradients.

Typography: Fraunces (headings) · Inter (body) · JetBrains Mono (code)

---

## Budget

Anthropic API credit: $15 USD.
Claude Sonnet 4.6: $3/MTok input · $15/MTok output.
Average migration ≈ 500 tok in + 800 tok out ≈ **$0.013/call**.
With prompt caching (system prompt cached): **~3000+ migrations** within budget.

---

## Reference Repos

- Python Lambda examples: [alfonsof/aws-python-examples](https://github.com/alfonsof/aws-python-examples)
- Python vs Rust benchmark: [danielbeach/PythonVsRustAWSLambda](https://github.com/danielbeach/PythonVsRustAWSLambda)
- Rust Lambda runtime: [awslabs/aws-lambda-rust-runtime](https://github.com/awslabs/aws-lambda-rust-runtime)
