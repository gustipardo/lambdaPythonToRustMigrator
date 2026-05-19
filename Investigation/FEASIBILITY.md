# Feasibility: Python Lambda → Rust Migrator (SaaS Page)

## Verdict: YES, build it.

Strong idea for a 3-5 day hackathon. Scope fits the constraint. Value prop is concrete and measurable.

---

## Why the Idea Is Good

**Pain is real.** Python Lambda cold starts are a known, documented problem (100-500ms vs Rust's 1-10ms).
AWS confirmed Rust on Lambda is now GA (2025). The ecosystem exists: `aws-lambda-rust-runtime`, `cargo-lambda`.

**Scope is tractable.** Lambda functions are small by design (single handler, <100 lines typical).
LLM-assisted translation of 50-line Python → Rust is reliable. Not a 50k-line monolith.

**Demo value is high.** Shows: frontend (landing page), backend (API), LLM pipeline (migration), domain knowledge (AWS + Rust).
Before/after cold start numbers make the pitch visual and measurable.

**No serious competitors in simple form.** Tools like `aws-lambda-rust-runtime` require you to already know Rust.
Nothing exists as a "paste Python, get Rust" zero-effort tool.

---

## Problems to Anticipate

### 1. LLM Translation Quality
**Risk:** Claude may generate syntactically correct but functionally wrong Rust.
**Mitigation:**
- Constrain input: only simple Lambda handlers (no complex OOP, no multi-file projects)
- Add clear disclaimer: "Review before deploying"
- Test with 5-10 real Python Lambda examples during dev to tune the prompt
- Prompt must include: Cargo.toml structure, lambda_runtime crate usage, async handler pattern

### 2. Rust-Specific Lambda Boilerplate
**Risk:** Generated Rust won't compile without correct boilerplate (runtime, tokio, handler signature).
**Mitigation:**
- Wrap LLM output in a fixed template:
  ```
  [Cargo.toml template] + [main.rs with correct handler wrapping] + [LLM-translated logic]
  ```
- This is deterministic — template never changes, only the inner logic is LLM-generated.

### 3. Python Libraries Without Rust Equivalents
**Risk:** `boto3`, `requests`, `pandas` — LLM must map these to Rust equivalents.
**Mitigation:**
- Known mappings: boto3 → aws-sdk-rust, requests → reqwest, json → serde_json
- Encode these mappings in the system prompt as a lookup table
- For unknown libraries: output comment noting manual migration needed

### 4. Prompt Cost
**Risk:** $15 budget sounds tight but it's not.
**Math:** claude-sonnet-4-6 input ~$3/MTok, output ~$15/MTok
- Average migration: 500 tok input + 800 tok output ≈ $0.0135
- $15 budget ≈ ~1100 migrations
- With prompt caching (system prompt cached): input drops ~90% → ~3000+ migrations
**Conclusion:** Budget is fine. Cache the system prompt.

### 5. Frontend Scope Creep
**Risk:** "SaaS page" can balloon into auth, dashboard, history.
**Mitigation:** Already defined in SIDE_FEATURES.md. Single page: hero + editor + output. Done.

---

## LLM Pipeline Design

### Do We Need a Pipeline?

Yes — but simple. Not multi-agent. Single call per migration.

```
User pastes Python
       ↓
Backend receives code
       ↓
Inject into prompt template (system + user message)
       ↓
Claude API (claude-sonnet-4-6)
       ↓
Return Rust code + Cargo.toml
       ↓
Display to user
```

### Prompt Structure

**System prompt (cacheable):**
```
You are an expert Rust and AWS Lambda engineer.
Migrate Python AWS Lambda functions to idiomatic Rust using:
- aws-lambda-rust-runtime crate
- tokio async runtime
- serde_json for JSON handling
- reqwest for HTTP (replaces requests)
- aws-sdk-* for boto3 equivalents

Library mapping:
- boto3.client('s3') → aws-sdk-s3
- boto3.client('dynamodb') → aws-sdk-dynamodb
- requests → reqwest
- json → serde_json

Always output:
1. Complete Cargo.toml
2. Complete src/main.rs
3. Brief comment per non-obvious translation

Input is always a single Python Lambda handler function.
Output must compile with: cargo lambda build --release
```

**User message (per call):**
```
Migrate this Python Lambda to Rust:

[user code]
```

### Why Claude API (Anthropic) Over Alternatives?

| Option | Cost | Quality | Verdict |
|--------|------|---------|---------|
| Claude Sonnet 4.6 | $3/$15 per MTok | Best code quality | ✅ USE THIS |
| GPT-4o | $5/$15 per MTok | Good | ❌ more expensive, no existing credit |
| Gemini 1.5 Pro | $3.50/$10.50 | Good | ❌ no existing credit |
| Claude Haiku 4.5 | $0.80/$4 per MTok | Acceptable for simple cases | Backup if budget concern |

**Decision: claude-sonnet-4-6 with prompt caching.**
User already has $15 credit. Sonnet has best code generation quality in the price range.
Haiku as fallback if we want to cut costs 70% post-demo.

---

## Technical Stack Recommendation

### Frontend
- **React + Vite** (fast setup)
- **Tailwind CSS** (SaaS look in hours, not days)
- **Monaco Editor** (VS Code-style code editor in browser) — OR simple `<textarea>` if time is tight
- Single page: hero section + editor + output

### Backend
- **FastAPI (Python)** or **Express (Node.js)**
- Single endpoint: `POST /migrate`
- Accepts: `{ code: string }`
- Returns: `{ rust_code: string, cargo_toml: string }`
- Calls Anthropic SDK internally

### Why FastAPI?
- Python SDK for Anthropic is mature and simple
- Less boilerplate than Express for a single endpoint
- async/await native

---

## Realistic 3-Day Plan

| Day | Work |
|-----|------|
| 1 | Backend: FastAPI + Anthropic integration + prompt tuning with 5 real examples |
| 2 | Frontend: Landing page + editor + output display |
| 3 | Integration + polish + README + demo recording |

---

## Confidence Assessment

| Dimension | Score | Note |
|-----------|-------|------|
| Idea validity | 9/10 | Real pain, measurable value |
| LLM migration quality | 7/10 | Good for simple handlers, degrades with complexity |
| Scope fit (3-5 days) | 8/10 | Tight but doable with hard scope limit |
| Budget fit | 9/10 | $15 is more than enough |
| Demo impact | 9/10 | Cold start numbers are compelling |

**Overall: Build it.**

---

## Key Decision: Should We Test Output Equality?

**Question:** Should the system verify that the Rust output produces identical results to the Python input?

Three options were evaluated:

**Option A — Code migration only (rejected)**
LLM generates Rust, show estimated metrics. No execution.
Risk: no proof the output is correct.

**Option B — Dynamic execution sandbox (rejected)**
Run Python + compile Rust + compare outputs.
Problem: Rust compilation takes ~30s, needs Docker sandbox, massive scope increase. Killed the timeline.

**Option C — Hybrid approach (chosen ✅)**
- **Demo mode:** 5 examples from alfonsof repo, pre-migrated and manually verified before deploy. Real AWS benchmark numbers shown (not estimated). Trustworthy because we control and validate them.
- **Custom mode:** LLM migration only, no execution. Visible disclaimer: "AI-generated. Review before deploying."

This gives credible proof-of-concept (demo mode) without sandbox complexity (custom mode).
The demo numbers are real. The custom mode is clearly labeled as AI-assisted, unvalidated output.
