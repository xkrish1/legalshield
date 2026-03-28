import React, { useState } from 'react'
import { fetchLawyers } from '../../services/api'
import LawyerCard from './LawyerCard'
import Button from '../ui/Button'
import Spinner from '../ui/Spinner'

export default function LawyerFinder() {
  const [zip, setZip]         = useState('')
  const [lawyers, setLawyers] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [searched, setSearched] = useState(false)

  async function handleSearch() {
    const trimmed = zip.trim()
    if (!trimmed || trimmed.length < 5) {
      setError('Enter a valid 5-digit ZIP code.')
      return
    }
    setError('')
    setLoading(true)
    setSearched(false)
    try {
      const data = await fetchLawyers(trimmed)
      setLawyers(data.lawyers || [])
      setSearched(true)
    } catch (e) {
      setError(e.message || 'Search failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2 style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
        ⚖️ Find Legal Help Near You
      </h2>
      <p style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
        Find tenant rights attorneys and free legal aid in your area.
      </p>

      <div style={{ display: 'flex', gap: '0.75rem', maxWidth: 400 }}>
        <input
          value={zip}
          onChange={e => setZip(e.target.value.replace(/\D/g, '').slice(0, 5))}
          placeholder="Enter ZIP code"
          maxLength={5}
          style={{
            flex: 1,
            padding: '0.5rem 0.75rem',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.875rem',
            outline: 'none',
          }}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <Button onClick={handleSearch} disabled={loading}>
          {loading ? <><Spinner size={16} color="#fff" /> Searching...</> : 'Search'}
        </Button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {searched && lawyers.length === 0 && (
        <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          No results found for ZIP {zip}.
        </p>
      )}

      {lawyers.length > 0 && (
        <div className="fade-in" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {lawyers.map((l, i) => <LawyerCard key={i} lawyer={l} />)}
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem' }}>
            * Results are for demonstration purposes. Always verify contact information independently.
          </p>
        </div>
      )}
    </div>
  )
}
