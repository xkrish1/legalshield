import React, { useState, useEffect } from 'react'
import Spinner from '../ui/Spinner'

const steps = [
  'Extracting text from PDF...',
  'Breaking lease into sections...',
  'Detecting clause types...',
  'Analyzing with AI...',
  'Scoring risk level...',
]

export default function UploadProgress() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => (s < steps.length - 1 ? s + 1 : s))
    }, 2200)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="card fade-in" style={{ textAlign: 'center', padding: '3rem' }}>
      <Spinner size={48} />
      <p style={{ marginTop: '1.5rem', fontWeight: 600, fontSize: '1rem' }}>
        Analyzing your lease...
      </p>
      <p className="pulsing" style={{ color: 'var(--color-text-muted)', marginTop: '0.5rem', fontSize: '0.875rem' }}>
        {steps[step]}
      </p>
      <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'flex-start', display: 'inline-flex' }}>
        {steps.map((s, i) => (
          <div key={s} style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            color: i <= step ? 'var(--color-text)' : 'var(--color-border)',
            fontSize: '0.8rem',
          }}>
            <span>{i < step ? '✅' : i === step ? '⏳' : '○'}</span>
            {s}
          </div>
        ))}
      </div>
    </div>
  )
}
