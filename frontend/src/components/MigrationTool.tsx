import { useState, useEffect, useRef } from 'react'
import { ChevronDown, Check, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'
import { fetchExamples, migrateCustom } from '../api'
import type { DemoExample, MigrateResponse } from '../types'
import { CodeBlock } from './CodeBlock'

const EXAMPLE_DESCS: Record<string, string> = {
  'http-handler': 'API Gateway passthrough',
  's3-upload':    'PutObject to S3',
  's3-download':  'GetObject from S3',
  'dynamodb-put': 'PutItem to DynamoDB',
  'sqs-send':     'SendMessage to SQS',
}

const PHASES = [
  'Parsing Python handler',
  'Mapping libraries → aws-sdk-rust',
  'Generating Rust',
  'Building Cargo.toml',
]

const PHASE_DELAYS = [0, 1800, 3800, 5800]
const PROGRESS_WIDTHS = [8, 30, 60, 80]

export function MigrationTool() {
  const [tab, setTab] = useState<'demo' | 'custom'>('demo')
  const [examples, setExamples] = useState<DemoExample[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [backendStatus, setBackendStatus] = useState<'loading' | 'live' | 'offline'>('loading')

  useEffect(() => {
    fetchExamples()
      .then(data => {
        setExamples(data)
        if (data.length > 0) setSelectedId(data[0].id)
        setBackendStatus('live')
      })
      .catch(() => setBackendStatus('offline'))
  }, [])

  const selectedExample = examples.find(e => e.id === selectedId)

  return (
    <div className="tool-card">
      <div className="tool-tabs">
        <button
          className={`tool-tab${tab === 'demo' ? ' is-active' : ''}`}
          onClick={() => setTab('demo')}
        >
          Demo Examples
        </button>
        <button
          className={`tool-tab${tab === 'custom' ? ' is-active' : ' tool-tab-pulse'}`}
          onClick={() => setTab('custom')}
        >
          Custom Code
        </button>
        <span className="tool-tab-spacer" />
        <div className="tool-status">
          {backendStatus === 'loading' ? (
            <span>connecting…</span>
          ) : backendStatus === 'live' ? (
            <><div className="status-dot" />backend live</>
          ) : (
            <><div className="status-dot offline" />backend offline</>
          )}
        </div>
      </div>

      {tab === 'demo' ? (
        <DemoPanel
          examples={examples}
          selectedId={selectedId}
          onSelect={setSelectedId}
          example={selectedExample}
          status={backendStatus}
        />
      ) : (
        <CustomPanel />
      )}
    </div>
  )
}

// ─── Demo Panel ───────────────────────────────────────────

interface DemoPanelProps {
  examples: DemoExample[]
  selectedId: string
  onSelect: (id: string) => void
  example: DemoExample | undefined
  status: 'loading' | 'live' | 'offline'
}

function DemoPanel({ examples, selectedId, onSelect, example, status }: DemoPanelProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  if (status === 'offline') {
    return (
      <div className="demo-panel">
        <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--text-3)' }}>
          <AlertCircle size={20} style={{ color: 'var(--py)', marginBottom: 12 }} />
          <p>Backend is offline — run <code className="inline-code">uvicorn main:app --reload</code> in /backend</p>
        </div>
      </div>
    )
  }

  if (status === 'loading' || !example) {
    return (
      <div className="demo-panel">
        <div style={{ padding: '80px 0', textAlign: 'center', color: 'var(--text-3)', fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}>
          loading examples…
        </div>
      </div>
    )
  }

  const selectedIdx = examples.findIndex(e => e.id === selectedId)
  const idxLabel = String(selectedIdx + 1).padStart(2, '0')

  return (
    <div className="demo-panel">
      <div className="demo-selector-row">
        <div className="dropdown" ref={dropRef}>
          <button
            className={`dropdown-trigger${isOpen ? ' is-open' : ''}`}
            onClick={() => setIsOpen(o => !o)}
          >
            <span className="drop-idx">{idxLabel}</span>
            <span className="drop-name">{example.label}</span>
            <span className="drop-desc">{EXAMPLE_DESCS[selectedId] ?? ''}</span>
            <ChevronDown size={14} />
          </button>
          {isOpen && (
            <div className="dropdown-menu">
              {examples.map((ex, i) => (
                <button
                  key={ex.id}
                  className={`dropdown-item${ex.id === selectedId ? ' is-active' : ''}`}
                  onClick={() => { onSelect(ex.id); setIsOpen(false) }}
                >
                  <span className="drop-idx">{String(i + 1).padStart(2, '0')}</span>
                  <span className="drop-text">
                    <div className="drop-name">{ex.label}</div>
                    <div className="drop-desc">{EXAMPLE_DESCS[ex.id] ?? ''}</div>
                  </span>
                  {ex.id === selectedId && <Check size={14} />}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="demo-meta">
          <span className="meta-pill">Pre-validated</span>
          <span className="meta-pill">Real benchmarks</span>
        </div>
      </div>

      <div className="code-split">
        <CodeBlock code={example.python_code} label="handler.py" maxHeight="320px" />
        <CodeBlock code={example.rust_code} label="main.rs" maxHeight="320px" />
      </div>

      <div style={{ marginBottom: 14 }}>
        <CodeBlock code={example.cargo_toml} label="Cargo.toml" maxHeight="160px" />
      </div>

      <DemoMetrics metrics={example.metrics} />
    </div>
  )
}

// ─── Demo Metrics ─────────────────────────────────────────

interface MetricData {
  python: { init_ms: number; duration_ms: number; memory_mb: number }
  rust:   { init_ms: number; duration_ms: number; memory_mb: number }
}

function DemoMetrics({ metrics }: { metrics: MetricData }) {
  const cells = [
    {
      key: 'Cold Start',
      py: `${metrics.python.init_ms}ms`,
      rs: `${metrics.rust.init_ms}ms`,
      delta: `${(metrics.python.init_ms / metrics.rust.init_ms).toFixed(1)}x faster`,
    },
    {
      key: 'Duration',
      py: `${metrics.python.duration_ms}ms`,
      rs: `${metrics.rust.duration_ms}ms`,
      delta: `${(metrics.python.duration_ms / metrics.rust.duration_ms).toFixed(1)}x faster`,
    },
    {
      key: 'Memory',
      py: `${metrics.python.memory_mb}MB`,
      rs: `${metrics.rust.memory_mb}MB`,
      delta: `${(metrics.python.memory_mb / metrics.rust.memory_mb).toFixed(1)}x less`,
    },
  ]

  return (
    <div className="metrics-panel">
      {cells.map(c => (
        <div key={c.key} className="metric-cell">
          <div className="metric-key">{c.key}</div>
          <div className="metric-line">
            <span className="metric-py">{c.py}</span>
            <ArrowRight size={12} style={{ color: 'var(--text-3)' }} />
            <span className="metric-rs">{c.rs}</span>
          </div>
          <div className="metric-delta">{c.delta}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Custom Panel ─────────────────────────────────────────

function CustomPanel() {
  const [code, setCode] = useState('')
  const [result, setResult] = useState<MigrateResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [outTab, setOutTab] = useState<'main.rs' | 'Cargo.toml'>('main.rs')
  const [phaseIdx, setPhaseIdx] = useState(-1)
  const [progressWidth, setProgressWidth] = useState(0)

  async function handleMigrate() {
    const trimmed = code.trim()
    if (!trimmed) return
    setLoading(true)
    setError(null)
    setResult(null)
    setPhaseIdx(0)
    setProgressWidth(PROGRESS_WIDTHS[0])

    const timers: ReturnType<typeof setTimeout>[] = []
    PHASE_DELAYS.slice(1).forEach((delay, i) => {
      timers.push(setTimeout(() => {
        setPhaseIdx(i + 1)
        setProgressWidth(PROGRESS_WIDTHS[i + 1])
      }, delay))
    })

    try {
      const res = await migrateCustom(trimmed)
      timers.forEach(clearTimeout)
      setProgressWidth(100)
      setPhaseIdx(PHASES.length)
      setTimeout(() => {
        setResult(res)
        setOutTab('main.rs')
        setLoading(false)
      }, 300)
    } catch (e) {
      timers.forEach(clearTimeout)
      setError(e instanceof Error ? e.message : 'Migration failed.')
      setLoading(false)
      setPhaseIdx(-1)
      setProgressWidth(0)
    }
  }

  const lineCount = code ? code.split('\n').length : 0

  return (
    <div className="custom-panel">
      <div className="custom-grid">
        {/* Input side */}
        <div className="custom-input">
          <div className="code-head">
            <div className="code-dots">
              <span style={{ background: '#FF6058' }} />
              <span style={{ background: '#FFBD2E' }} />
              <span style={{ background: '#28CA41' }} />
            </div>
            <span className="code-label">handler.py</span>
          </div>
          <textarea
            className="custom-textarea"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder={`# Paste the function AWS invokes — needs (event, context) params\nimport json\n\ndef lambda_handler(event, context):\n    return {\n        'statusCode': 200,\n        'body': json.dumps({'hello': 'world'})\n    }`}
            spellCheck={false}
          />
          <div className="custom-actions">
            <span className="custom-meta">
              {lineCount > 0 ? `${lineCount} lines` : 'paste your lambda handler'}
            </span>
            <button
              className={`btn-primary${loading ? ' is-loading' : ''}`}
              onClick={handleMigrate}
              disabled={loading || !code.trim()}
            >
              {loading ? (
                <><div className="spinner" />Migrating…</>
              ) : (
                <>Migrate to Rust<ArrowRight size={14} /></>
              )}
            </button>
          </div>
        </div>

        {/* Output side */}
        <div className="custom-output">
          {loading ? (
            <LoadingState phaseIdx={phaseIdx} progressWidth={progressWidth} />
          ) : error ? (
            <ErrorState message={error} />
          ) : result ? (
            <ResultState
              result={result}
              outTab={outTab}
              onTabChange={setOutTab}
            />
          ) : (
            <EmptyState />
          )}
        </div>
      </div>

      {/* Footer */}
      {result && (
        <div className="custom-foot">
          <div className="disclaimer">
            <div className="disc-dot" />
            AI-generated — review before deploying to production
          </div>
          {result.metrics.estimated && (
            <div className="est-badges">
              <div className="est-badge">
                <span className="est-key">Cold start</span>
                <span className="est-val">
                  {result.metrics.cold_start_python_ms}ms → {result.metrics.cold_start_rust_ms}ms
                </span>
              </div>
              <div className="est-badge">
                <span className="est-key">Memory</span>
                <span className="est-val">
                  {result.metrics.memory_python_mb}MB → {result.metrics.memory_rust_mb}MB
                </span>
              </div>
              {result.metrics.improvement_label && (
                <div className="est-badge">
                  <span className="est-key">Est. gain</span>
                  <span className="est-val">{result.metrics.improvement_label}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="out-empty">
      <div className="out-empty-mark">λ</div>
      <p>
        Paste your <code>lambda_handler</code> on the left and click <strong style={{ color: 'var(--code-fg)' }}>Migrate to Rust</strong>
      </p>
    </div>
  )
}

function LoadingState({ phaseIdx, progressWidth }: { phaseIdx: number; progressWidth: number }) {
  return (
    <div className="out-running">
      <div className="progress-rail">
        <div className="progress-fill" style={{ width: `${progressWidth}%` }} />
      </div>
      <ul className="progress-list">
        {PHASES.map((phase, i) => {
          const isDone = i < phaseIdx
          const isActive = i === phaseIdx
          return (
            <li key={phase} className={isDone ? 'done' : isActive ? 'active' : ''}>
              <span className="phase-idx">{String(i + 1).padStart(2, '0')}</span>
              <span className="phase-name">{phase}</span>
              {isDone && <CheckCircle2 size={14} />}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function ErrorState({ message }: { message: string }) {
  const isWrongType = message.includes('management') || message.includes('handler found') || message.includes('(event, context)')
  return (
    <div className="out-error">
      <div className="error-box" style={{ flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>{message}</span>
        </div>
        {isWrongType && (
          <pre style={{ margin: '0 0 0 24px', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 11.5, color: '#8FB29E', lineHeight: 1.7, whiteSpace: 'pre' }}>
{`# What you need:
def lambda_handler(event, context):
    # your logic here
    return {"statusCode": 200, "body": "..."}`}
          </pre>
        )}
      </div>
    </div>
  )
}

interface ResultStateProps {
  result: MigrateResponse
  outTab: 'main.rs' | 'Cargo.toml'
  onTabChange: (t: 'main.rs' | 'Cargo.toml') => void
}

function ResultState({ result, outTab, onTabChange }: ResultStateProps) {
  const [copied, setCopied] = useState(false)
  const content = outTab === 'main.rs' ? result.rust_code : result.cargo_toml

  async function handleCopy() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <div className="out-tabs">
        {(['main.rs', 'Cargo.toml'] as const).map(t => (
          <button
            key={t}
            className={`out-tab${outTab === t ? ' is-active' : ''}`}
            onClick={() => onTabChange(t)}
          >
            {t}
          </button>
        ))}
        <span className="out-tab-spacer" />
        <button className="copy-btn" onClick={handleCopy}>
          {copied ? <Check size={10} /> : <Copy size={10} />}
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
      <div className="code-body" style={{ flex: 1, maxHeight: 380, overflow: 'auto' }}>
        <pre className="code-pre" style={{ margin: 0 }}><code>{content}</code></pre>
      </div>
    </>
  )
}

function Copy({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}
