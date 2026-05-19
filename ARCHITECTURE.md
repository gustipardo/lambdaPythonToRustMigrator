# Architecture & System Design

## What This System Does

User pastes (or selects) a Python AWS Lambda function.
System returns idiomatic Rust code + Cargo.toml, ready for `cargo lambda build`.
Optionally shows real benchmark comparison (demo mode with pre-validated examples).

---

## Two Modes

### Demo Mode
5 pre-selected Lambda examples from [alfonsof/aws-python-examples](https://github.com/alfonsof/aws-python-examples).
Pre-migrated to Rust manually (or LLM + human review).
Pre-run on AWS to capture real Init Duration / Duration / Memory metrics.
Shows actual Python vs Rust runtime numbers side by side.
Source of truth: the blog post benchmarks + alfonsof repo examples.

**Candidates from alfonsof repo (evaluate these first):**
- S3 download
- S3 upload
- DynamoDB put item
- SQS send message
- Simple HTTP handler (API Gateway)

### Custom Mode
User pastes their own Python Lambda handler.
LLM (Claude Sonnet 4.6) generates Rust + Cargo.toml.
No output validation — disclaimer shown.
Estimated performance improvement shown (based on benchmark baselines).

---

## Architecture

```
┌─────────────────────────────────────────────┐
│              Frontend (React + Vite)         │
│                                              │
│  [Hero / Landing]  [Migration Tool]          │
│                                              │
│  Hero:                                       │
│  - Value prop + cold start numbers           │
│  - CTA → scroll to tool                      │
│                                              │
│  Tool:                                       │
│  - Mode toggle: Demo | Custom                │
│  - Demo: dropdown select example             │
│  - Custom: code editor (textarea or Monaco)  │
│  - Migrate button                            │
│  - Output: Rust code + Cargo.toml tabs       │
│  - Metrics badge (estimated or real)         │
│  - Copy button                               │
└──────────────────┬──────────────────────────┘
                   │ POST /migrate
                   ▼
┌─────────────────────────────────────────────┐
│              Backend (FastAPI)               │
│                                              │
│  POST /migrate                               │
│  Body: { code: str, mode: "demo"|"custom" }  │
│                                              │
│  Demo mode:                                  │
│  - Lookup pre-validated result from JSON     │
│  - Return cached Rust + real metrics         │
│                                              │
│  Custom mode:                                │
│  - Validate: is it a lambda_handler?         │
│  - Build prompt (system cached)              │
│  - Call Anthropic Claude Sonnet 4.6          │
│  - Parse response → rust_code + cargo_toml   │
│  - Attach estimated metrics                  │
│  - Return result                             │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
          Anthropic Claude API
          (custom mode only)
```

---

## Backend: Endpoint Contract

### `POST /migrate`

**Request:**
```json
{
  "code": "def lambda_handler(event, context): ...",
  "mode": "custom"
}
```

**Response:**
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

Demo mode returns `"estimated": false` + real measured values.

---

## Frontend: Screens (Minimal)

Single page. No routing.

### Section 1 — Hero
- Headline: "Paste Python Lambda. Get Rust Lambda."
- Subheadline: cold start numbers (340ms → 8ms, 75% less memory)
- CTA button: "Try it now" → scrolls to tool
- Optional: small benchmark table (Python / Rust / Improvement columns)

### Section 2 — Migration Tool
- Toggle: **Demo** | **Custom**
- **Demo tab:**
  - Dropdown: 5 pre-validated examples (S3 Upload, S3 Download, DynamoDB, SQS, HTTP)
  - On select: shows Python code (read-only) + Rust output pre-loaded
  - Metrics panel: real Init Duration, Duration, Memory (Python vs Rust)
- **Custom tab:**
  - Code editor: paste Python Lambda here (textarea, monospace)
  - "Migrate to Rust" button
  - Loading state (streaming if possible)
  - Output: tabbed — "main.rs" | "Cargo.toml"
  - Copy button per tab
  - Disclaimer: "AI-generated. Review before deploying."
  - Metrics panel: estimated improvement badges

### Section 3 — How It Works (optional, minimal)
- 3-step diagram: Paste → Analyze → Get Rust
- Tech note: powered by Claude Sonnet, aws-lambda-rust-runtime

---

## Pre-Validated Demo Examples

Source: https://github.com/alfonsof/aws-python-examples

For each example we need:
1. Python source (from alfonsof repo)
2. Rust migration (LLM-generated + human reviewed)
3. Cargo.toml
4. Real benchmark numbers (Init Duration, Duration, Memory Used)
   - From the blog post or measured manually

Stored as: `backend/demo_examples/` — JSON files, one per example.

**Example file structure:**
```json
{
  "id": "s3-upload",
  "label": "S3 Upload",
  "python_code": "...",
  "rust_code": "...",
  "cargo_toml": "...",
  "metrics": {
    "python": { "init_ms": 260, "duration_ms": 15699, "memory_mb": 140 },
    "rust":   { "init_ms": 38,  "duration_ms": 6452,  "memory_mb": 85 }
  }
}
```

Numbers sourced from: confessionsofadataguy.com blog post + paiml.com benchmarks.

---

## Tech Stack Locked

| Layer | Tech | Reason |
|-------|------|--------|
| Frontend | React + Vite (TypeScript) | Highly interactive — Astro/Next.js add overhead for zero functional gain |
| Components | shadcn/ui + Tailwind | Already referenced in design system. Components live in repo, full token control |
| Charts | Recharts | Lightweight, React-native |
| Code editor | `<textarea>` monospace | Monaco is a side feature |
| Backend | FastAPI (Python 3.11) | One file, async, Anthropic SDK native |
| LLM | Claude Sonnet 4.6 + prompt caching | Best code quality, existing $15 credit |
| Demo data | Static JSON in `backend/examples/` | No DB needed |
| Deployment | Vite dev + uvicorn | No cloud needed for demo |

### Why NOT Next.js
No SSR needed. No API routes needed (FastAPI handles backend). No file-based routing (single page).
Next.js would add `next.config.js` overhead and 0 functional value. Vite bootstraps in 2 min.

### Why shadcn/ui
The `_design/` tokens file already targets shadcn/ui. Components are copied into the repo — no dependency lock-in, full Tailwind customization. We need ~5 components: Button, Card, Tabs, Badge, Separator.

### Why NOT Astro
Astro wins for content-heavy, mostly-static pages with isolated interactive widgets.
This page has: code editor, API calls, tab switching, animated charts, mode toggle — React everywhere.
Astro + React islands adds build complexity with zero benefit at hackathon scope.

### Why NOT Rust/Express backend
- Rust backend: 10x boilerplate for one endpoint. The migration logic lives in Claude, not in the server.
- Express: fine, but Anthropic Python SDK is more mature and we're already in Python for prompts.
- FastAPI: one file, decorator routing, async, done in 30 min.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/migrate` | Custom mode: LLM migration via Claude |
| `GET` | `/examples` | Returns list of pre-validated demo examples |

Demo examples could be bundled in frontend JSON, but keeping them in backend makes updates easier and keeps a single source of truth.

---

## Design System (from `_design/`)

`_design/` is gitignored — internal reference only. Key decisions to apply:

### Visual style: "Editorial Dev-Tool"
**Light-first** (user preference). Warm paper base, Amber accent. Linear + Readwise aesthetic.
No glassmorphism, no gradients, no AI-hype aurora meshes.

### Palette (light mode — PRIMARY)
| Role | Token | Hex |
|------|-------|-----|
| Background | `bg-base` | `#FAF7F1` — warm off-white, NOT pure white |
| Surface cards | `surface-2` | `#EDE8DB` |
| Surface hover | `surface-3` | `#E3DCC9` |
| Text primary | `text-primary` | `#11182A` |
| Text secondary | `text-secondary` | `#3E4560` |
| Text tertiary | `text-tertiary` | `#6E7791` |
| Accent (CTA, links) | `accent-default` | `#B87826` — darker amber for light bg contrast |
| Accent hover | `accent-hover` | `#A86C22` |
| Border | `border-default` | `#D8CFBC` |
| Border subtle | `border-subtle` | `#E8E2D2` |
| Success | `success-default` | `#4A7B5C` |
| Error | `error-default` | `#A55A3D` |

### Typography
- **Display/headings:** Fraunces (serif) — editorial weight
- **Body:** Inter — clean, readable
- **Code:** JetBrains Mono — code editor, metrics, output

### Anti-patterns (hard no)
- No glassmorphism / frosted blur
- No multicolor gradients / aurora mesh
- No Material Design ripples
- No Duolingo greens (`#58CC02`)

---

## LLM Prompt Strategy

System prompt (cached — never changes per session):
- Expert Rust + Lambda engineer persona
- Library mapping table: boto3→aws-sdk-rust, requests→reqwest, json→serde_json
- Output format: code fenced, main.rs first, then Cargo.toml
- Template constraints: must use tokio, lambda_runtime, serde_json

User prompt (per call):
```
Migrate this Python Lambda to Rust:

```python
{user_code}
```
```

Expected output format from Claude:
```
```rust
// main.rs
[code]
```

```toml
# Cargo.toml
[code]
```
```

Backend parses by splitting on the code fences.

---

## Terminology

| Term | Meaning |
|------|---------|
| Lambda handler | Python `lambda_handler(event, context)` function |
| Cold start | First invocation delay (Init Duration in AWS logs) |
| Migration | LLM-assisted Python→Rust translation |
| Demo example | Pre-validated pair from alfonsof repo |
| Custom mode | User-supplied code, LLM migration, no validation |
| Rust runtime | `aws-lambda-rust-runtime` crate |

---

## What We Are NOT Building

See SIDE_FEATURES.md. Specifically:
- No code execution / sandboxing
- No output equality testing (demo examples are pre-validated manually)
- No auth, no DB, no file upload (paste only)
- No deployment pipeline
- No Monaco editor (textarea is enough)
- No syntax highlighting (side feature)
