import json
import os
import re
from pathlib import Path
from typing import Literal

import anthropic
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator

load_dotenv()

app = FastAPI(title="Lambda Migrator")

_raw_origins = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

EXAMPLES_DIR = Path(__file__).parent / "demo_examples"

SYSTEM_PROMPT = """\
You are an expert Rust and AWS Lambda engineer. Your job is to migrate Python AWS Lambda \
functions to idiomatic, production-ready Rust using the aws-lambda-rust-runtime crate.

Library mapping (Python → Rust):
- boto3 (S3)       → aws-sdk-s3
- boto3 (DynamoDB) → aws-sdk-dynamodb
- boto3 (SQS)      → aws-sdk-sqs
- requests         → reqwest
- json             → serde_json
- os.environ       → std::env::var

Rules:
- Always use tokio async runtime with #[tokio::main]
- Always use lambda_runtime::{run, service_fn, Error, LambdaEvent}
- Deserialize the event with serde_json::Value unless a typed struct is clearly better
- Return serde_json::Value from the handler
- Never use unwrap() — use ? or map_err

Output format — respond with ONLY these two fenced blocks, nothing else:

```rust
// main.rs
<code here>
```

```toml
# Cargo.toml
<code here>
```
"""

ESTIMATED_METRICS = {
    "estimated": True,
    "cold_start_python_ms": 340,
    "cold_start_rust_ms": 8,
    "memory_python_mb": 139,
    "memory_rust_mb": 35,
    "improvement_label": "~97% faster cold start",
}


class MigrateRequest(BaseModel):
    code: str
    mode: Literal["demo", "custom"]

    @field_validator("code")
    @classmethod
    def code_max_length(cls, v: str) -> str:
        if len(v) > 15_000:
            raise ValueError("Code is too long (max 15,000 characters).")
        return v


def parse_llm_output(text: str) -> tuple[str, str]:
    rust_match = re.search(r"```(?:rust|rs)\s*\n(.*?)```", text, re.DOTALL)
    toml_match = re.search(r"```toml\s*\n(.*?)```", text, re.DOTALL)
    if not rust_match:
        raise ValueError("Claude did not return a ```rust block. Try again or simplify the handler.")
    if not toml_match:
        raise ValueError("Claude did not return a ```toml block. Try again or simplify the handler.")
    return rust_match.group(1).strip(), toml_match.group(1).strip()


@app.get("/examples")
async def get_examples():
    examples = []
    for f in sorted(EXAMPLES_DIR.glob("*.json")):
        data = json.loads(f.read_text())
        examples.append(data)
    return examples


@app.post("/migrate")
async def migrate(req: MigrateRequest):
    if req.mode == "demo":
        target = next(
            (f for f in EXAMPLES_DIR.glob("*.json") if f.stem == req.code),
            None,
        )
        if not target:
            raise HTTPException(status_code=404, detail=f"Demo example '{req.code}' not found")
        data = json.loads(target.read_text())
        return {
            "rust_code": data["rust_code"],
            "cargo_toml": data["cargo_toml"],
            "metrics": {
                "estimated": False,
                **data["metrics"],
            },
        }

    if len(req.code.strip()) < 20:
        raise HTTPException(status_code=422, detail="Code is too short. Paste a Python Lambda handler.")

    if not re.search(r"def\s+\w+\s*\(\s*\w+\s*,\s*\w+\s*\)", req.code):
        raise HTTPException(
            status_code=422,
            detail=(
                "No Lambda handler found. A Lambda handler is a function that AWS invokes — "
                "it must accept (event, context) parameters, e.g.: "
                "def lambda_handler(event, context): ..."
                " The code you pasted looks like a management/CLI script, not a handler."
            ),
        )

    try:
        message = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            system=[
                {
                    "type": "text",
                    "text": SYSTEM_PROMPT,
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[
                {
                    "role": "user",
                    "content": f"Migrate this Python Lambda to Rust:\n\n```python\n{req.code}\n```",
                }
            ],
        )
    except anthropic.RateLimitError:
        raise HTTPException(status_code=429, detail="API rate limit reached. Please wait a few seconds.")
    except anthropic.APITimeoutError:
        raise HTTPException(status_code=504, detail="Claude took too long. Try a shorter handler.")
    except anthropic.APIConnectionError:
        raise HTTPException(status_code=503, detail="Could not connect to Claude API.")
    except anthropic.APIError as e:
        raise HTTPException(status_code=502, detail=f"Claude API error: {e.message}")

    if not message.content:
        raise HTTPException(status_code=502, detail="Claude returned an empty response.")

    raw = message.content[0].text
    try:
        rust_code, cargo_toml = parse_llm_output(raw)
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))

    return {
        "rust_code": rust_code,
        "cargo_toml": cargo_toml,
        "metrics": ESTIMATED_METRICS,
    }
