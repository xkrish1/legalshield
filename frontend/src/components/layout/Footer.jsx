import React from 'react'

export default function Footer() {
  return (
    <footer style={{
      background: '#050e1a',
      borderTop: '1px solid #1e3554',
      padding: '1.25rem 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '1rem',
      flexWrap: 'wrap',
    }}>
      <span style={{
        fontFamily: 'Georgia, serif',
        fontSize: '0.85rem',
        color: '#c8a84b',
        fontWeight: 600,
        letterSpacing: '0.01em',
      }}>
        ⚖️ LeaseShield
      </span>
      <p style={{
        fontSize: '0.75rem',
        color: '#3a5570',
        textAlign: 'center',
        flex: 1,
      }}>
        For informational purposes only — not legal advice.
        Always consult a qualified attorney before signing a lease.
      </p>
      <span style={{ fontSize: '0.75rem', color: '#2a4060' }}>
        NJ Tenant Rights
      </span>
    </footer>
  )
}
