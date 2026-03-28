import React from 'react'

export default function Spinner({ size = 24, color = 'var(--color-primary)' }) {
  return (
    <div className="spinning" style={{
      width: size,
      height: size,
      border: `3px solid ${color}22`,
      borderTop: `3px solid ${color}`,
      borderRadius: '50%',
      display: 'inline-block',
      flexShrink: 0,
    }} />
  )
}
