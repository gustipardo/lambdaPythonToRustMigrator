import json
import os
import re
from pathlib import Path

import anthropic
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

load_dotenv()

app = FastAPI(title="Lambda Migrator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
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
    mode: str  # "demo" | "custom"


def parse_llm_output(text: str) -> tuple[str, str]:
    rust_match = re.search(r"```rust\n(.*?)```", text, re.DOTALL)
    toml_match = re.search(r"```toml\n(.*?)```", text, re.DOTALL)
    if not rust_match or not toml_match:
        raise ValueError("Claude response did not contain expected code blocks")
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

    if req.mode != "custom":
        raise HTTPException(status_code=400, detail="mode must be 'demo' or 'custom'")

    if len(req.code.strip()) < 20:
        raise HTTPException(status_code=422, detail="Code is too short. Paste a Python Lambda handler.")

    if not re.search(r"def\s+\w+\s*\(\s*event", req.code):
        raise HTTPException(
            status_code=422,
            detail=(
                "No Lambda handler found. A Lambda handler is a function that AWS invokes — "
                "it must accept (event, context) parameters, e.g.: "
                "def lambda_handler(event, context): ..."
                " The code you pasted looks like a management/CLI script, not a handler."
            ),
        )

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
