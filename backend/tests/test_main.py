import pytest
from main import parse_llm_output


# --- parse_llm_output unit tests ---

def test_parse_valid_response():
    text = "```rust\nfn main() {}\n```\n```toml\n[package]\n```"
    rust, toml = parse_llm_output(text)
    assert "fn main" in rust
    assert "[package]" in toml


def test_parse_rs_alias():
    text = "```rs\nfn main() {}\n```\n```toml\n[package]\n```"
    rust, _ = parse_llm_output(text)
    assert rust


def test_parse_extra_whitespace():
    text = "```rust  \nfn main() {}\n```\n```toml\n[package]\n```"
    rust, _ = parse_llm_output(text)
    assert rust


def test_parse_missing_rust_raises():
    with pytest.raises(ValueError, match="rust block"):
        parse_llm_output("```toml\n[package]\n```")


def test_parse_missing_toml_raises():
    with pytest.raises(ValueError, match="toml block"):
        parse_llm_output("```rust\nfn main() {}\n```")


# --- endpoint tests ---

def test_get_examples_returns_list(client):
    res = client.get("/examples")
    assert res.status_code == 200
    assert isinstance(res.json(), list)
    assert len(res.json()) > 0


def test_migrate_demo_known_example(client):
    res = client.post("/migrate", json={"code": "s3-upload", "mode": "demo"})
    assert res.status_code == 200
    data = res.json()
    assert "rust_code" in data
    assert "cargo_toml" in data
    assert data["metrics"]["estimated"] is False


def test_migrate_demo_unknown_returns_404(client):
    res = client.post("/migrate", json={"code": "no-existe", "mode": "demo"})
    assert res.status_code == 404


def test_migrate_invalid_mode_returns_422(client):
    res = client.post("/migrate", json={"code": "algo", "mode": "invalido"})
    assert res.status_code == 422


def test_migrate_too_short_returns_422(client):
    res = client.post("/migrate", json={"code": "x", "mode": "custom"})
    assert res.status_code == 422


def test_migrate_too_long_returns_422(client):
    res = client.post("/migrate", json={"code": "x" * 15_001, "mode": "custom"})
    assert res.status_code == 422


def test_migrate_no_handler_returns_422(client):
    code = "print('hello world, this is not a lambda handler at all')"
    res = client.post("/migrate", json={"code": code, "mode": "custom"})
    assert res.status_code == 422


# --- custom mode with mocked Claude ---

class _FakeBlock:
    def __init__(self, text: str):
        self.text = text


class _FakeMessage:
    def __init__(self, text: str):
        self.content = [_FakeBlock(text)]


def test_migrate_custom_success(client, monkeypatch):
    fake_response = "```rust\nfn main() {}\n```\n```toml\n[package]\nname = \"test\"\n```"
    monkeypatch.setattr("main.client.messages.create", lambda **_: _FakeMessage(fake_response))
    code = "def lambda_handler(event, context):\n    return {'statusCode': 200}"
    res = client.post("/migrate", json={"code": code, "mode": "custom"})
    assert res.status_code == 200
    data = res.json()
    assert data["metrics"]["estimated"] is True
    assert "fn main" in data["rust_code"]
