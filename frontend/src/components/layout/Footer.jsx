import React from 'react'

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--color-border)',
      padding: '1rem 1.5rem',
      textAlign: 'center',
      fontSize: '0.8rem',
      color: 'var(--color-text-muted)',
    }}>
      LeaseShield is for informational purposes only and does not constitute legal advice.
      Always consult a qualified attorney before signing a lease.
    </footer>
  )
}
