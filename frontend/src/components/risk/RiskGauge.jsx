import React from 'react'

const BUCKET_COLORS = { Low: '#16a34a', Moderate: '#d97706', High: '#dc2626' }
const MAX_SCORE = 80

export default function RiskGauge({ score, bucket }) {
  const pct          = Math.min(100, (score / MAX_SCORE) * 100)
  const color        = BUCKET_COLORS[bucket] || '#6b7280'
  const circumference = 2 * Math.PI * 54
  const offset       = circumference - (pct / 100) * circumference

  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <p style={{ fontWeight: 600, marginBottom: '1rem' }}>Risk Score</p>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="54" fill="none" stroke="#e5e7eb" strokeWidth="12" />
        <circle
          cx="70" cy="70" r="54"
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x="70" y="66" textAnchor="middle" fontSize="26" fontWeight="700" fill={color}>{score}</text>
        <text x="70" y="84" textAnchor="middle" fontSize="11" fill="#6b7280">points</text>
      </svg>
      <div style={{
        display: 'inline-block',
        marginTop: '0.75rem',
        padding: '0.3rem 1rem',
        background: `${color}18`,
        color,
        borderRadius: '999px',
        fontWeight: 700,
        fontSize: '0.9rem',
      }}>
        {bucket} Risk
      </div>
    </div>
  )
}
