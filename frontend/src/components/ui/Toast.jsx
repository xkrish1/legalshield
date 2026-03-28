import React, { useEffect } from 'react'

export default function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  const colors = {
    info:    'var(--color-primary)',
    error:   'var(--color-danger)',
    success: 'var(--color-success)',
  }

  return (
    <div className="fade-in" style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      background: 'var(--color-surface)',
      border: `1px solid ${colors[type]}`,
      borderLeft: `4px solid ${colors[type]}`,
      padding: '0.75rem 1rem',
      borderRadius: 'var(--radius-md)',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 9999,
      maxWidth: 360,
      fontSize: '0.875rem',
    }}>
      {message}
    </div>
  )
}
