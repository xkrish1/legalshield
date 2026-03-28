import React, { useState } from 'react'
import ClauseCard from './ClauseCard'

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2, unclear: 3 }

export default function ClauseList({ flags }) {
  const [filter, setFilter] = useState('all')

  if (!flags || flags.length === 0) {
    return (
      <div className="card">
        <p style={{ color: 'var(--color-text-muted)' }}>No risky clauses detected in this lease.</p>
      </div>
    )
  }

  const sorted   = [...flags].sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3))
  const filtered = filter === 'all' ? sorted : sorted.filter(f => f.severity === filter)

  const counts = flags.reduce((acc, f) => { acc[f.severity] = (acc[f.severity] || 0) + 1; return acc }, {})
  const filters = [
    { key: 'all',    label: `All (${flags.length})` },
    { key: 'high',   label: `High (${counts.high || 0})` },
    { key: 'medium', label: `Medium (${counts.medium || 0})` },
    { key: 'low',    label: `Low (${counts.low || 0})` },
  ]

  return (
    <div>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '0.3rem 0.8rem',
              borderRadius: '999px',
              border: '1px solid var(--color-border)',
              background: filter === f.key ? 'var(--color-primary)' : 'var(--color-surface)',
              color: filter === f.key ? '#fff' : 'var(--color-text-muted)',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <p style={{ color: 'var(--color-text-muted)' }}>No {filter}-severity clauses found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map((flag, i) => <ClauseCard key={`${flag.clause_type}-${i}`} flag={flag} />)}
        </div>
      )}
    </div>
  )
}
