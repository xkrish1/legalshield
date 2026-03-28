import React, { useState } from 'react'
import ZipSearch from '../components/map/ZipSearch'
import LeaseMap from '../components/map/LeaseMap'
import { fetchNearbyLeases } from '../services/api'

const RISK_COLORS = { High: '#dc2626', Moderate: '#d97706', Low: '#16a34a' }
const RISK_BG     = { High: '#fee2e2', Moderate: '#fef3c7', Low: '#dcfce7' }

export default function MapComparison() {
  const [leases, setLeases]   = useState([])
  const [zip, setZip]         = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [searched, setSearched] = useState(false)

  async function handleSearch(zipcode) {
    if (!zipcode || zipcode.length < 5) {
      setError('Please enter a valid 5-digit ZIP code.')
      return
    }
    setError('')
    setLoading(true)
    setZip(zipcode)
    setSearched(false)
    try {
      const data = await fetchNearbyLeases(zipcode)
      setLeases(data.leases || [])
      setSearched(true)
    } catch (e) {
      setError(e.message || 'Search failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in">
      <h1 className="page-title">Lease Comparison Map</h1>
      <p className="page-subtitle">
        See nearby lease risk levels and average rents by ZIP code.
      </p>

      <ZipSearch onSearch={handleSearch} loading={loading} />

      {error && <div className="error-message">{error}</div>}

      {searched && leases.length === 0 && (
        <p style={{ marginTop: '1rem', color: 'var(--color-text-muted)' }}>
          No lease data found for ZIP {zip}.
        </p>
      )}

      {leases.length > 0 && (
        <div className="fade-in" style={{ marginTop: '1.5rem' }}>
          <LeaseMap leases={leases} zip={zip} />

          <h2 style={{ fontWeight: 600, fontSize: '1rem', margin: '1.5rem 0 0.75rem' }}>
            Nearby Leases — ZIP {zip}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {leases.map((l, i) => (
              <div key={i} className="card" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}>
                <div>
                  <p style={{ fontWeight: 600 }}>{l.address}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    ZIP: {l.zip}
                  </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                    ${l.avg_rent.toLocaleString()}<span style={{ fontSize: '0.8rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>/mo</span>
                  </p>
                  <span style={{
                    fontSize: '0.8rem',
                    padding: '0.25rem 0.7rem',
                    borderRadius: '999px',
                    background: RISK_BG[l.risk_bucket] || '#f3f4f6',
                    color: RISK_COLORS[l.risk_bucket] || '#6b7280',
                    fontWeight: 600,
                  }}>
                    {l.risk_bucket} Risk
                  </span>
                </div>
              </div>
            ))}
          </div>

          <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            * Map data is for demonstration purposes. Coordinates and risk values are illustrative.
          </p>
        </div>
      )}
    </div>
  )
}
