import React from 'react'

export default function ScenarioSelector({ scenarios, selected, onSelect }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      {scenarios.map(s => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          style={{
            padding: '0.3rem 0.75rem',
            borderRadius: '999px',
            border: '1px solid var(--color-border)',
            background: selected === s ? 'var(--color-primary)' : 'var(--color-surface)',
            color: selected === s ? '#fff' : 'var(--color-text-muted)',
            fontSize: '0.8rem',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          {s}
        </button>
      ))}
    </div>
  )
}
