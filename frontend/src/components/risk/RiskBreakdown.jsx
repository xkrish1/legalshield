import React from 'react'

const COLORS = { high: '#dc2626', medium: '#d97706', low: '#16a34a', unclear: '#6b7280' }

export default function RiskBreakdown({ flags, summary }) {
  const counts = (flags || []).reduce((acc, f) => {
    acc[f.severity] = (acc[f.severity] || 0) + 1
    return acc
  }, {})

  return (
    <div className="card">
      <p style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Summary</p>
      <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
        {summary}
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        {Object.entries(counts).map(([sev, count]) => (
          <div key={sev} style={{
            padding: '0.5rem 1rem',
            background: `${COLORS[sev] || '#6b7280'}12`,
            border: `1px solid ${COLORS[sev] || '#6b7280'}30`,
            borderRadius: 'var(--radius-md)',
            textAlign: 'center',
            minWidth: '70px',
          }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: COLORS[sev] || '#6b7280' }}>{count}</div>
            <div style={{ fontSize: '0.75rem', color: COLORS[sev] || '#6b7280', textTransform: 'capitalize' }}>{sev}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
