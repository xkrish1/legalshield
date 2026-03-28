import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const links = [
  { to: '/',          label: 'Upload'      },
  { to: '/results',   label: 'Analysis'    },
  { to: '/letter',    label: 'Exit Letter' },
  { to: '/simulator', label: 'Landlord Sim'},
  { to: '/map',       label: 'Compare Map' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  return (
    <nav style={{
      background: 'var(--color-surface)',
      borderBottom: '1px solid var(--color-border)',
      padding: '0 1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '2rem',
      height: '56px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <Link to="/" style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary)', whiteSpace: 'nowrap' }}>
        🛡 LeaseShield
      </Link>
      <div style={{ display: 'flex', gap: '0.25rem', flex: 1, flexWrap: 'wrap' }}>
        {links.map(l => (
          <Link key={l.to} to={l.to} style={{
            padding: '0.4rem 0.75rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.875rem',
            fontWeight: pathname === l.to ? 600 : 400,
            color: pathname === l.to ? 'var(--color-primary)' : 'var(--color-text-muted)',
            background: pathname === l.to ? '#eff6ff' : 'transparent',
            whiteSpace: 'nowrap',
          }}>
            {l.label}
          </Link>
        ))}
      </div>
      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
        Not legal advice
      </span>
    </nav>
  )
}
