import React, { useState } from 'react'
import SeverityBadge from './SeverityBadge'

export default function ClauseCard({ flag }) {
  const [open, setOpen] = useState(false)
  const { clause_type, severity, excerpt, why_it_matters, plain_english, questions_to_ask, confidence, fee_analysis } = flag

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
              background: 'var(--color-surface-subtle)',
              borderLeft: '3px solid var(--color-primary)',
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

          {fee_analysis && (
            <div className="fade-in" style={{
              padding: '0.6rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              background: fee_analysis.severity_signal === 'low'
                ? 'var(--severity-low-bg)' : fee_analysis.severity_signal === 'medium'
                ? 'var(--severity-medium-bg)' : 'var(--severity-high-bg)',
              border: `1px solid ${
                fee_analysis.severity_signal === 'low'
                  ? 'rgba(52,201,122,0.25)' : fee_analysis.severity_signal === 'medium'
                  ? 'rgba(240,168,50,0.25)' : 'rgba(224,85,85,0.25)'
              }`,
              fontSize: '0.8rem',
            }}>
              <p style={{ fontWeight: 700, marginBottom: '0.3rem' }}>🧮 Fee Proportionality Analysis</p>
              <p style={{ color: 'var(--color-text-muted)' }}>{fee_analysis.rationale}</p>
              {fee_analysis.fee_pct_of_rent != null && (
                <p style={{ marginTop: '0.3rem', fontWeight: 600 }}>
                  Fee = {fee_analysis.fee_pct_of_rent}% of monthly rent
                  {fee_analysis.fee_pct_of_rent <= 5
                    ? ' ✅ At or below 5% threshold'
                    : fee_analysis.fee_pct_of_rent <= 10
                    ? ' ⚠️ Above 5% threshold'
                    : ' 🔴 Exceeds 10% threshold'
                  }
                </p>
              )}
              {fee_analysis.is_daily_fee && (
                <p style={{ marginTop: '0.3rem', fontWeight: 600, color: '#dc2626' }}>
                  🔴 Daily fee — high risk regardless of amount
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
