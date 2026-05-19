import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

interface Props {
  code: string
  label: string
  maxHeight?: string
}

export function CodeBlock({ code, label, maxHeight = '340px' }: Props) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const lines = code.split('\n')
  const gutterText = lines.map((_, i) => i + 1).join('\n')

  return (
    <div className="code-block" style={{ maxHeight, overflow: 'hidden' }}>
      <div className="code-head">
        <div className="code-dots">
          <span style={{ background: '#FF6058' }} />
          <span style={{ background: '#FFBD2E' }} />
          <span style={{ background: '#28CA41' }} />
        </div>
        <span className="code-label">{label}</span>
        <button className="copy-btn" onClick={handleCopy}>
          {copied ? <Check size={10} /> : <Copy size={10} />}
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
      <div className="code-body" style={{ maxHeight: `calc(${maxHeight} - 40px)`, overflow: 'auto' }}>
        <pre className="code-gutter">{gutterText}</pre>
        <pre className="code-pre"><code>{code}</code></pre>
      </div>
    </div>
  )
}
