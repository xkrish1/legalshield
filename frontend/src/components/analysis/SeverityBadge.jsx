import React from 'react'

const LABELS = { high: '🔴 High', medium: '🟡 Medium', low: '🟢 Low', unclear: '⚪ Unclear' }
const COLORS  = { high: '#dc2626', medium: '#d97706', low: '#16a34a', unclear: '#6b7280' }

export default function SeverityBadge({ severity }) {
  const color = COLORS[severity] || COLORS.unclear
  return (
    <span style={{
      padding: '0.2rem 0.6rem',
      background: `${color}18`,
      color,
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: 700,
      whiteSpace: 'nowrap',
    }}>
      {LABELS[severity] || severity}
    </span>
  )
}
