import React, { useState } from 'react'
import { simulateLandlord } from '../../services/api'
import ScenarioSelector from './ScenarioSelector'
import Button from '../ui/Button'
import Spinner from '../ui/Spinner'

const SCENARIOS = [
  'I want to terminate my lease early',
  'My landlord entered without notice',
  'My rent payment was late',
  'I need to sublet my apartment',
  'I want to dispute a repair charge',
  'I have a guest staying long-term',
]

export default function LandlordSim() {
  const [scenario, setScenario] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function handleSimulate() {
    if (!scenario.trim()) { setError('Select or describe a scenario first.'); return }
    setError('')
    setLoading(true)
    setResponse('')
    try {
      const data = await simulateLandlord({ scenario })
      setResponse(data.response)
    } catch (e) {
      setError(e.message || 'Simulation failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
        🏠 Landlord Response Simulator
      </h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
        See how your landlord might respond based on common lease terms.
      </p>

      <ScenarioSelector scenarios={SCENARIOS} selected={scenario} onSelect={setScenario} />

      <textarea
        value={scenario}
        onChange={e => setScenario(e.target.value)}
        placeholder="Or describe your situation in your own words..."
        rows={3}
        style={{
          width: '100%',
          marginTop: '0.75rem',
          padding: '0.5rem 0.75rem',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          fontSize: '0.875rem',
          resize: 'vertical',
          outline: 'none',
        }}
      />

      {error && <div className="error-message">{error}</div>}

      <Button onClick={handleSimulate} disabled={loading} style={{ marginTop: '0.75rem' }}>
        {loading ? <><Spinner size={16} color="#fff" /> Simulating...</> : 'Simulate Response'}
      </Button>

      {response && (
        <div className="fade-in" style={{
          marginTop: '1rem',
          padding: '1rem',
          background: '#eff6ff',
          borderRadius: 'var(--radius-md)',
          borderLeft: '4px solid var(--color-primary)',
          fontSize: '0.9rem',
          lineHeight: 1.6,
        }}>
          <strong style={{ display: 'block', marginBottom: '0.4rem', color: 'var(--color-primary)' }}>
            Landlord response:
          </strong>
          {response}
        </div>
      )}
    </div>
  )
}
