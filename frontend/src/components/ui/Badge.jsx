import React from 'react'

export default function Badge({ children, color = 'var(--color-primary)', bg }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '0.2rem 0.6rem',
      borderRadius: '999px',
      fontSize: '0.75rem',
      fontWeight: 600,
      color: color,
      background: bg || `${color}18`,
    }}>
      {children}
    </span>
  )
}
