import { useRef, useEffect, useState } from 'react'
import { ArrowRight, Zap } from 'lucide-react'
import { MigrationTool } from './components/MigrationTool'

const BENCH = [
  { idx: '01', name: 'HTTP Handler',  desc: 'API Gateway passthrough', python: 180, rust: 8  },
  { idx: '02', name: 'S3 Upload',     desc: 'PutObject to S3',          python: 260, rust: 38 },
  { idx: '03', name: 'S3 Download',   desc: 'GetObject from S3',        python: 245, rust: 35 },
  { idx: '04', name: 'DynamoDB Put',  desc: 'PutItem to DynamoDB',      python: 310, rust: 40 },
  { idx: '05', name: 'SQS Send',      desc: 'SendMessage to SQS',       python: 280, rust: 32 },
]

export default function App() {
  const toolRef = useRef<HTMLDivElement>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 8) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function scrollToTool() {
    toolRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      {/* Nav */}
      <nav className={`nav${scrolled ? ' is-scrolled' : ''}`}>
        <div className="container">
          <div className="nav-row">
            <a href="#" className="brand">
              <span className="brand-mark">L</span>
              <span className="brand-word">LambdaMigrator</span>
            </a>
            <div className="nav-right">
              <a href="#benchmarks" className="nav-link">Benchmarks</a>
              <a href="#how" className="nav-link">How it works</a>
              <button className="nav-cta" onClick={scrollToTool}>
                Try it now <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero">
        <div className="container">
          <div className="hero-inner">
            <div className="chip">
              <Zap size={12} />
              Powered by Claude Sonnet 4.6
            </div>
            <h1 className="display">
              Paste Python Lambda.<br />
              <span className="display-italic">Get Rust Lambda.</span>
            </h1>
            <p className="hero-sub">
              LLM-assisted migration to{' '}
              <strong>aws-lambda-rust-runtime</strong>.
              Real benchmark numbers. No setup required.
            </p>

            <div className="stat-grid">
              <div className="stat-card">
                <div className="stat-value">97%</div>
                <div className="stat-label">faster cold start</div>
                <div className="stat-hint">340ms → 8ms init duration</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">75%</div>
                <div className="stat-label">less memory used</div>
                <div className="stat-hint">139MB → 35MB at runtime</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">&lt;10s</div>
                <div className="stat-label">migration time</div>
                <div className="stat-hint">avg 6s via Claude Sonnet</div>
              </div>
            </div>

            <div className="hero-cta-row">
              <button className="btn-primary" onClick={scrollToTool}>
                Try the migrator <ArrowRight size={15} />
              </button>
              <a href="#benchmarks" className="btn-ghost">
                See benchmarks
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Benchmarks */}
      <section className="section" id="benchmarks">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Performance</span>
            <h2 className="section-title">Real AWS cold start numbers</h2>
            <p className="section-sub">
              Measured on AWS Lambda with 128MB memory allocation. Init Duration from CloudWatch logs.
              Python 3.11 vs. Rust compiled with <span className="inline-code">cargo lambda build --release</span>.
            </p>
          </div>
          <div className="bench-card">
            <div className="bench-head">
              <span>Lambda</span>
              <span className="num">Python init</span>
              <span className="num">Rust init</span>
              <span className="num">Speedup</span>
            </div>
            {BENCH.map(row => (
              <div key={row.idx} className="bench-row">
                <div className="bench-name">
                  <span className="bench-idx">{row.idx}</span>
                  <span>{row.name}</span>
                </div>
                <span className="num mono pill-py">{row.python}ms</span>
                <span className="num mono pill-rs">{row.rust}ms</span>
                <span className="speedup">{Math.round(row.python / row.rust)}x</span>
              </div>
            ))}
            <div className="bench-foot">
              <span className="dot-py" />Python 3.11
              &nbsp;&nbsp;
              <span className="dot-rs" />Rust (aws-lambda-rust-runtime)
              &nbsp;·&nbsp;
              128MB · us-east-1 · cold start only
            </div>
          </div>
        </div>
      </section>

      {/* Migration Tool */}
      <section className="section section-tool" ref={toolRef} id="tool">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Migrator</span>
            <h2 className="section-title">Migrate your Lambda in seconds</h2>
            <p className="section-sub">
              Browse pre-validated demo examples with real benchmarks, or paste your own Python handler for an instant AI migration.
            </p>
          </div>
          <MigrationTool />
        </div>
      </section>

      {/* How it works */}
      <section className="section section-how" id="how">
        <div className="container">
          <div className="section-head">
            <span className="eyebrow">Process</span>
            <h2 className="section-title">How it works</h2>
          </div>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-n">01</div>
              <div className="step-key">Paste</div>
              <p className="step-body">
                Drop your Python <span className="inline-code">lambda_handler</span> into the editor. Any complexity, any AWS service.
              </p>
              <div className="step-detail">
                boto3 · requests · json · os.environ
              </div>
            </div>
            <div className="step-card">
              <div className="step-n">02</div>
              <div className="step-key">Analyze</div>
              <p className="step-body">
                Claude maps boto3 to aws-sdk-rust, rewrites async patterns to tokio, and applies idiomatic Rust error handling.
              </p>
              <div className="step-detail">
                boto3 → aws-sdk-s3 · requests → reqwest · json → serde_json
              </div>
            </div>
            <div className="step-card">
              <div className="step-n">03</div>
              <div className="step-key">Get Rust</div>
              <p className="step-body">
                Copy <span className="inline-code">main.rs</span> and <span className="inline-code">Cargo.toml</span> — ready for <span className="inline-code">cargo lambda build</span>.
              </p>
              <div className="step-detail">
                tokio · lambda_runtime · serde_json · aws-config
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-row">
            <span>LambdaMigrator — hackathon project</span>
            <span>Claude Sonnet 4.6 · aws-lambda-rust-runtime · FastAPI · React</span>
          </div>
        </div>
      </footer>
    </>
  )
}
