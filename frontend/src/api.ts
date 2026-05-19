import type { DemoExample, MigrateResponse } from './types'

const BASE = 'http://localhost:8000'

export async function fetchExamples(): Promise<DemoExample[]> {
  const res = await fetch(`${BASE}/examples`)
  if (!res.ok) throw new Error(`Failed to load examples: ${res.statusText}`)
  return res.json()
}

export async function migrateCustom(code: string): Promise<MigrateResponse> {
  const res = await fetch(`${BASE}/migrate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, mode: 'custom' }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.detail ?? `Server error ${res.status}`)
  return data
}
