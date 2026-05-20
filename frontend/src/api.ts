import type { DemoExample, MigrateResponse } from './types'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export async function fetchExamples(): Promise<DemoExample[]> {
  const res = await fetch(`${BASE}/examples`)
  if (!res.ok) throw new Error(`Failed to load examples: ${res.statusText}`)
  return res.json()
}

const TIMEOUT_MS = 30_000

export async function migrateCustom(code: string): Promise<MigrateResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(`${BASE}/migrate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, mode: 'custom' }),
      signal: controller.signal,
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.detail ?? `Server error ${res.status}`)
    return data
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new Error('Migration timed out. Try a shorter handler.')
    }
    throw e
  } finally {
    clearTimeout(timeoutId)
  }
}
