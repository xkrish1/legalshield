import React, { useState } from 'react'
import SeverityBadge from './SeverityBadge'

export default function ClauseCard({ flag }) {
  const [open, setOpen] = useState(false)
  const { clause_type, severity, excerpt, why_it_matters, plain_english, questions_to_ask, confidence } = flag

  return (
    <div className="card fade-in" style={{ borderLeft: `4px solid var(--severity-${severity})` }}>
      <div
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: '1rem' }}
        onClick={() => setOpen(o => !o)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <SeverityBadge severity={severity} />
          <span style={{ fontWeight: 600, fontSize: '0.95rem', textTransform: 'capitalize' }}>
            {clause_type.replace(/_/g, ' ')}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            {Math.round((confidence || 0) * 100)}% confidence
          </span>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>

      {open && (
        <div className="fade-in" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {excerpt && (
            <blockquote style={{
              background: '#f3f4f6',
              borderLeft: '3px solid var(--color-border)',
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontStyle: 'italic',
              color: 'var(--color-text-muted)',
              margin: 0,
            }}>
              "{excerpt}"
            </blockquote>
          )}

          {why_it_matters && (
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>⚠️ Why it matters</p>
              <p style={{ fontSize: '0.875rem' }}>{why_it_matters}</p>
            </div>
          )}

          {plain_english && (
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.25rem' }}>💬 Plain English</p>
              <p style={{ fontSize: '0.875rem' }}>{plain_english}</p>
            </div>
          )}

          {questions_to_ask?.length > 0 && (
            <div>
              <p style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '0.4rem' }}>❓ Questions to ask</p>
              <ul style={{ paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {questions_to_ask.map((q, i) => (
                  <li key={i} style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{q}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
