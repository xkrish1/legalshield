import React from 'react'

const variants = {
  primary:   { background: 'var(--color-primary)',  color: '#07111f', border: 'none', fontWeight: 700 },
  danger:    { background: 'var(--color-danger)',   color: '#fff',    border: 'none' },
  secondary: { background: 'transparent', color: 'var(--color-primary)', border: '1px solid var(--color-primary)' },
  ghost:     { background: 'transparent', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' },
}

export default function Button({ children, onClick, variant = 'primary', disabled = false, fullWidth = false, size = 'md', style = {} }) {
  const sizes = { sm: '0.4rem 0.75rem', md: '0.6rem 1.25rem', lg: '0.8rem 1.75rem' }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...variants[variant],
        padding: sizes[size],
        borderRadius: 'var(--radius-md)',
        fontSize: size === 'lg' ? '1rem' : '0.875rem',
        fontWeight: 500,
        width: fullWidth ? '100%' : 'auto',
        opacity: disabled ? 0.5 : 1,
        transition: 'opacity 0.15s, background 0.15s',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.4rem',
        ...style,
      }}
    >
      {children}
    </button>
  )
}
