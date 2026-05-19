export function HeroVisual() {
  return (
    <div style={{ width: '100%', maxWidth: 860, margin: '0 auto 44px', padding: '0 4px' }}>
      <svg
        viewBox="0 0 860 340"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 14, overflow: 'visible' }}
        aria-label="Python Lambda code migrating to Rust Lambda code"
      >
        <defs>
          <filter id="shadow" x="-4%" y="-4%" width="108%" height="116%">
            <feDropShadow dx="0" dy="6" stdDeviation="14" floodColor="#11182A" floodOpacity="0.22" />
          </filter>
          <linearGradient id="arrowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#B87826" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#B87826" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* ── Left panel: Python ── */}
        <g filter="url(#shadow)">
          <rect x="0" y="0" width="378" height="340" rx="12" fill="#161B28" />
        </g>

        {/* Window chrome */}
        <rect x="0" y="0" width="378" height="40" rx="12" fill="#11161F" />
        <rect x="0" y="28" width="378" height="12" fill="#11161F" />

        {/* Traffic lights */}
        <circle cx="20" cy="20" r="5" fill="#FF6058" opacity="0.7" />
        <circle cx="36" cy="20" r="5" fill="#FFBD2E" opacity="0.7" />
        <circle cx="52" cy="20" r="5" fill="#28CA41" opacity="0.7" />

        {/* File label */}
        <text x="72" y="25" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="#6B7494">handler.py</text>

        {/* Python badge */}
        <rect x="290" y="11" width="72" height="18" rx="4" fill="#A55A3D" fillOpacity="0.18" />
        <text x="326" y="23.5" fontFamily="JetBrains Mono, monospace" fontSize="10.5" fill="#A55A3D" textAnchor="middle">Python 3.11</text>

        {/* Code lines — Python */}
        <text fontFamily="JetBrains Mono, monospace" fontSize="12.5" fill="#6B7494">
          <tspan x="22" dy="66">import boto3</tspan>
          <tspan x="22" dy="20">import json</tspan>
        </text>
        <text fontFamily="JetBrains Mono, monospace" fontSize="12.5">
          <tspan x="22" y="128" fill="#C28BE3">def </tspan>
          <tspan fill="#7FB2E5">lambda_handler</tspan>
          <tspan fill="#DDE3F0">(event, context):</tspan>
        </text>
        <text fontFamily="JetBrains Mono, monospace" fontSize="12.5">
          <tspan x="42" y="150" fill="#6B7494">    </tspan>
          <tspan fill="#E5C07B">s3</tspan>
          <tspan fill="#DDE3F0"> = boto3.client(</tspan>
          <tspan fill="#B8C77F">'s3'</tspan>
          <tspan fill="#DDE3F0">)</tspan>
        </text>
        <text fontFamily="JetBrains Mono, monospace" fontSize="12.5">
          <tspan x="42" y="172" fill="#E5C07B">    bucket</tspan>
          <tspan fill="#DDE3F0"> = event[</tspan>
          <tspan fill="#B8C77F">'bucket'</tspan>
          <tspan fill="#DDE3F0">]</tspan>
        </text>
        <text fontFamily="JetBrains Mono, monospace" fontSize="12.5">
          <tspan x="42" y="194" fill="#DDE3F0">    s3.put_object(</tspan>
        </text>
        <text fontFamily="JetBrains Mono, monospace" fontSize="12.5">
          <tspan x="62" y="216" fill="#E5C07B">        Bucket</tspan>
          <tspan fill="#DDE3F0">=bucket,</tspan>
        </text>
        <text fontFamily="JetBrains Mono, monospace" fontSize="12.5">
          <tspan x="62" y="238" fill="#E5C07B">        Key</tspan>
          <tspan fill="#DDE3F0">=event[</tspan>
          <tspan fill="#B8C77F">'key'</tspan>
          <tspan fill="#DDE3F0">])</tspan>
        </text>
        <text fontFamily="JetBrains Mono, monospace" fontSize="12.5">
          <tspan x="42" y="260" fill="#C28BE3">    return </tspan>
          <tspan fill="#DDE3F0">{'{'}</tspan>
          <tspan fill="#B8C77F">'statusCode'</tspan>
          <tspan fill="#DDE3F0">: </tspan>
          <tspan fill="#E5C07B">200</tspan>
          <tspan fill="#DDE3F0">{'}'}</tspan>
        </text>

        {/* Bottom metrics bar */}
        <rect x="0" y="296" width="378" height="44" rx="0" fill="#0E121B" />
        <rect x="0" y="296" width="378" height="2" fill="#1E2535" />
        <rect x="0" y="328" width="378" height="12" rx="12" fill="#0E121B" />

        <text x="22" y="322" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="#6B7494">Init duration</text>
        <text x="120" y="322" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="#A55A3D" fontWeight="600">260ms</text>
        <text x="200" y="322" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="#6B7494">Memory</text>
        <text x="260" y="322" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="#A55A3D" fontWeight="600">140MB</text>

        {/* ── Center arrow ── */}
        {/* Label above the circle */}
        <text x="430" y="142" fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#B87826" textAnchor="middle" opacity="0.75">Claude Sonnet</text>
        {/* Glow rings centered at true content midpoint */}
        <circle cx="430" cy="170" r="30" fill="#B87826" fillOpacity="0.08" />
        <circle cx="430" cy="170" r="21" fill="#B87826" fillOpacity="0.13" />
        {/* Arrow shaft */}
        <line x1="400" y1="170" x2="453" y2="170" stroke="url(#arrowGrad)" strokeWidth="2.5" strokeLinecap="round" />
        {/* Arrow head — tip at circle edge, vertically centered on y=170 */}
        <polyline points="443,161 457,170 443,179" fill="none" stroke="#B87826" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* ── Right panel: Rust ── */}
        <g filter="url(#shadow)">
          <rect x="482" y="0" width="378" height="340" rx="12" fill="#161B28" />
        </g>

        {/* Window chrome */}
        <rect x="482" y="0" width="378" height="40" rx="12" fill="#11161F" />
        <rect x="482" y="28" width="378" height="12" fill="#11161F" />

        <circle cx="502" cy="20" r="5" fill="#FF6058" opacity="0.7" />
        <circle cx="518" cy="20" r="5" fill="#FFBD2E" opacity="0.7" />
        <circle cx="534" cy="20" r="5" fill="#28CA41" opacity="0.7" />

        <text x="554" y="25" fontFamily="JetBrains Mono, monospace" fontSize="12" fill="#6B7494">main.rs</text>

        {/* Rust badge */}
        <rect x="764" y="11" width="88" height="18" rx="4" fill="#4A7B5C" fillOpacity="0.18" />
        <text x="808" y="23.5" fontFamily="JetBrains Mono, monospace" fontSize="10.5" fill="#4A7B5C" textAnchor="middle">Rust · cargo λ</text>

        {/* Code lines — Rust */}
        <text fontFamily="JetBrains Mono, monospace" fontSize="12.5">
          <tspan x="504" y="66" fill="#C28BE3">use </tspan>
          <tspan fill="#E5A87B">aws_sdk_s3</tspan>
          <tspan fill="#DDE3F0">::Client;</tspan>
        </text>
        <text fontFamily="JetBrains Mono, monospace" fontSize="12.5">
          <tspan x="504" y="86" fill="#C28BE3">use </tspan>
          <tspan fill="#E5A87B">lambda_runtime</tspan>
          <tspan fill="#DDE3F0">::{'{'}run, LambdaEvent{'}'};</tspan>
        </text>
        <text fontFamily="JetBrains Mono, monospace" fontSize="12.5">
          <tspan x="504" y="106" fill="#C28BE3">use </tspan>
          <tspan fill="#E5A87B">serde_json</tspan>
          <tspan fill="#DDE3F0">::{'{'}</tspan>
          <tspan fill="#E5C07B">json</tspan>
          <tspan fill="#DDE3F0">, Value{'}'};</tspan>
        </text>
        <text fontFamily="JetBrains Mono, monospace" fontSize="12.5">
          <tspan x="504" y="134" fill="#8FB29E">#[tokio::main]</tspan>
        </text>
        <text fontFamily="JetBrains Mono, monospace" fontSize="12.5">
          <tspan x="504" y="154" fill="#C28BE3">async fn </tspan>
          <tspan fill="#7FB2E5">main</tspan>
          <tspan fill="#DDE3F0">() -{'>'} </tspan>
          <tspan fill="#E5A87B">Result</tspan>
          <tspan fill="#DDE3F0">{'<'}(), Error{'>'} {'{'}</tspan>
        </text>
        <text fontFamily="JetBrains Mono, monospace" fontSize="12.5">
          <tspan x="524" y="176" fill="#DDE3F0">run(service_fn(handler)).await</tspan>
        </text>
        <text fontFamily="JetBrains Mono, monospace" fontSize="12.5">
          <tspan x="504" y="196" fill="#DDE3F0">{'}'}</tspan>
        </text>
        <text fontFamily="JetBrains Mono, monospace" fontSize="12.5">
          <tspan x="504" y="222" fill="#C28BE3">async fn </tspan>
          <tspan fill="#7FB2E5">handler</tspan>
          <tspan fill="#DDE3F0">(</tspan>
          <tspan fill="#E5C07B">e</tspan>
          <tspan fill="#DDE3F0">: LambdaEvent{'<'}Value{'>'}) {'{'}</tspan>
        </text>
        <text fontFamily="JetBrains Mono, monospace" fontSize="12.5">
          <tspan x="524" y="244" fill="#6B7494">    // s3, serde, tokio...</tspan>
        </text>
        <text fontFamily="JetBrains Mono, monospace" fontSize="12.5">
          <tspan x="524" y="266" fill="#C28BE3">    Ok</tspan>
          <tspan fill="#DDE3F0">(</tspan>
          <tspan fill="#D78F6A">json!</tspan>
          <tspan fill="#DDE3F0">({'{'} </tspan>
          <tspan fill="#B8C77F">"statusCode"</tspan>
          <tspan fill="#DDE3F0">: </tspan>
          <tspan fill="#E5C07B">200</tspan>
          <tspan fill="#DDE3F0"> {'}'}))</tspan>
        </text>

        {/* Bottom metrics bar */}
        <rect x="482" y="296" width="378" height="44" rx="0" fill="#0E121B" />
        <rect x="482" y="296" width="378" height="2" fill="#1E2535" />
        <rect x="482" y="328" width="378" height="12" rx="12" fill="#0E121B" />

        <text x="504" y="322" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="#6B7494">Init duration</text>
        <text x="602" y="322" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="#4A7B5C" fontWeight="600">38ms</text>
        <text x="672" y="322" fontFamily="JetBrains Mono, monospace" fontSize="11" fill="#6B7494">Memory</text>
        <text x="730" y="322" fontFamily="JetBrains Mono, monospace" fontSize="13" fill="#4A7B5C" fontWeight="600">85MB</text>

        {/* Speedup badge */}
        <rect x="782" y="308" width="68" height="22" rx="5" fill="#B87826" fillOpacity="0.15" />
        <text x="816" y="323.5" fontFamily="JetBrains Mono, monospace" fontSize="11.5" fill="#B87826" fontWeight="700" textAnchor="middle">6.8× faster</text>
      </svg>
    </div>
  )
}
