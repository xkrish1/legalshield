const BASE = '/api'

async function handleResponse(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export async function analyzeLease(file) {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${BASE}/analyze`, { method: 'POST', body: form })
  return handleResponse(res)
}

export async function generateLetter(payload) {
  const res = await fetch(`${BASE}/letter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse(res)
}

export async function simulateLandlord(payload) {
  const res = await fetch(`${BASE}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return handleResponse(res)
}

export async function fetchLawyers(zip) {
  const res = await fetch(`${BASE}/lawyers?zip=${encodeURIComponent(zip)}`)
  return handleResponse(res)
}

export async function fetchNearbyLeases(zip) {
  const res = await fetch(`${BASE}/leases/nearby?zip=${encodeURIComponent(zip)}`)
  return handleResponse(res)
}

export async function fetchLeaseDetail(leaseId) {
  const res = await fetch(`${BASE}/leases/nearby/${encodeURIComponent(leaseId)}`)
  return handleResponse(res)
}

export function leaseDownloadUrl(leaseId) {
  return `${BASE}/leases/nearby/${encodeURIComponent(leaseId)}/download`
}

export async function healthCheck() {
  const res = await fetch(`${BASE}/health`)
  return handleResponse(res)
}
