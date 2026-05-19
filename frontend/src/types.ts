export interface Metrics {
  estimated: boolean
  // demo mode fields (estimated: false)
  python?: { init_ms: number; duration_ms: number; memory_mb: number }
  rust?: { init_ms: number; duration_ms: number; memory_mb: number }
  // custom mode fields (estimated: true)
  cold_start_python_ms?: number
  cold_start_rust_ms?: number
  memory_python_mb?: number
  memory_rust_mb?: number
  improvement_label?: string
}

export interface MigrateResponse {
  rust_code: string
  cargo_toml: string
  metrics: Metrics
}

export interface DemoExample {
  id: string
  label: string
  python_code: string
  rust_code: string
  cargo_toml: string
  metrics: {
    python: { init_ms: number; duration_ms: number; memory_mb: number }
    rust: { init_ms: number; duration_ms: number; memory_mb: number }
  }
}
