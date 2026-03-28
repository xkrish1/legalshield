import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const links = [
  { to: '/',          label: 'Upload'       },
  { to: '/results',   label: 'Analysis'     },
  { to: '/letter',    label: 'Exit Letter'  },
  { to: '/simulator', label: 'Landlord Sim' },
  { to: '/map',       label: 'Compare Map'  },
]

export default function Navbar() {
  const { pathname } = useLocation()

  return (
    <nav style={{
      background: 'linear-gradient(180deg, #091829 0%, #07111f 100%)',
      borderBottom: '1px solid #1e3554',
      padding: '0 2rem',
      display: 'flex',
      alignItems: 'center',
      gap: '2.5rem',
      height: '60px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 20px rgba(0,0,0,0.5)',
    }}>
      {/* Logo */}
      <Link to="/" style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        textDecoration: 'none',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '1.15rem' }}>⚖️</span>
        <span style={{
          fontFamily: 'Georgia, serif',
          fontWeight: 700,
          fontSize: '1.15rem',
          color: '#c8a84b',
          letterSpacing: '0.01em',
        }}>
          LeaseShield
        </span>
      </Link>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: '0.15rem', flex: 1, flexWrap: 'wrap' }}>
        {links.map(l => {
          const active = pathname === l.to
          return (
            <Link key={l.to} to={l.to} style={{
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              fontWeight: active ? 600 : 400,
              color: active ? '#c8a84b' : '#6e8fa8',
              background: active ? 'rgba(200,168,75,0.1)' : 'transparent',
              borderBottom: active ? '2px solid #c8a84b' : '2px solid transparent',
              whiteSpace: 'nowrap',
              textDecoration: 'none',
              transition: 'color 0.15s, background 0.15s',
            }}>
              {l.label}
            </Link>
          )
        })}
      </div>

      {/* Disclaimer badge */}
      <span style={{
        fontSize: '0.7rem',
        color: '#3a5570',
        whiteSpace: 'nowrap',
        border: '1px solid #1e3554',
        padding: '0.2rem 0.6rem',
        borderRadius: '999px',
        letterSpacing: '0.02em',
        textTransform: 'uppercase',
      }}>
        Not legal advice
      </span>
    </nav>
  )
}
