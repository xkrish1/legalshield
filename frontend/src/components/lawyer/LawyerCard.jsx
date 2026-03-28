import React from 'react'

export default function LawyerCard({ lawyer }) {
  return (
    <div style={{
      padding: '1rem',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '0.75rem',
      background: 'var(--color-surface)',
    }}>
      <div>
        <p style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{lawyer.name}</p>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{lawyer.specialty}</p>
        <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{lawyer.address}</p>
      </div>
      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-end' }}>
        <p style={{ fontWeight: 600 }}>{lawyer.phone}</p>
        {lawyer.free && (
          <span style={{
            fontSize: '0.75rem',
            padding: '0.2rem 0.6rem',
            background: '#dcfce7',
            color: '#16a34a',
            borderRadius: '999px',
            fontWeight: 600,
          }}>
            Free Services
          </span>
        )}
      </div>
    </div>
  )
}
