import React, { useState } from 'react'
import ZipSearch from '../components/map/ZipSearch'
import LeaseMap from '../components/map/LeaseMap'
import { fetchNearbyLeases, fetchLeaseDetail, leaseDownloadUrl } from '../services/api'

const RISK_COLORS = { High: '#dc2626', Moderate: '#d97706', Low: '#16a34a' }
const RISK_BG     = { High: '#fee2e2', Moderate: '#fef3c7', Low: '#dcfce7' }
const SEV_COLOR   = { high: '#dc2626', medium: '#d97706', low: '#16a34a', unclear: '#6b7280' }
const SEV_BG      = { high: '#fee2e2', medium: '#fef3c7', low: '#dcfce7', unclear: '#f3f4f6' }

function ClausePill({ severity, label }) {
  return (
    <span style={{
      fontSize: '0.72rem', fontWeight: 600, padding: '0.15rem 0.55rem',
      borderRadius: '999px',
      background: SEV_BG[severity] || '#f3f4f6',
      color: SEV_COLOR[severity] || '#6b7280',
      border: `1px solid ${SEV_COLOR[severity] || '#6b7280'}33`,
      textTransform: 'capitalize',
      whiteSpace: 'nowrap',
    }}>
      {label.replace(/_/g, ' ')}
    </span>
  )
}

function LeaseCard({ lease, onExpand, expanded, detail, loadingDetail }) {
  const hasAnalysis = !!lease.has_analysis

  return (
    <div className="card" style={{ padding: '1rem 1.25rem' }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.95rem' }}>{lease.address}</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '0.15rem' }}>ZIP: {lease.zip}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
          <p style={{ fontWeight: 700, fontSize: '1.05rem' }}>
            ${lease.avg_rent.toLocaleString()}
            <span style={{ fontSize: '0.78rem', fontWeight: 400, color: 'var(--color-text-muted)' }}>/mo</span>
          </p>
          <span style={{
            fontSize: '0.78rem', padding: '0.25rem 0.75rem', borderRadius: '999px',
            background: RISK_BG[lease.risk_bucket] || '#f3f4f6',
            color: RISK_COLORS[lease.risk_bucket] || '#6b7280',
            fontWeight: 700,
          }}>
            {lease.risk_bucket} Risk
          </span>
        </div>
      </div>

      {/* Action row */}
      {hasAnalysis && (
        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => onExpand(lease.id)}
            style={{
              fontSize: '0.78rem', padding: '0.3rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              background: expanded ? 'var(--color-primary)' : 'transparent',
              color: expanded ? 'white' : 'var(--color-text)',
              cursor: 'pointer', fontWeight: 600,
            }}
          >
            {loadingDetail ? 'Loading...' : expanded ? 'Hide Analysis' : 'Why this score?'}
          </button>
          <a
            href={leaseDownloadUrl(lease.id)}
            download
            style={{
              fontSize: '0.78rem', padding: '0.3rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-text)',
              textDecoration: 'none', fontWeight: 600,
              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
            }}
          >
            Download PDF
          </a>
        </div>
      )}

      {/* Expanded analysis */}
      {expanded && detail && (
        <div style={{ marginTop: '1rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '0.6rem' }}>
            Risk score: <strong>{detail.overall_risk_score}</strong> — {detail.flags.length} clause{detail.flags.length !== 1 ? 's' : ''} flagged
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {detail.flags.map((flag, i) => (
              <div key={i} style={{
                padding: '0.6rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                background: SEV_BG[flag.severity] || '#f9fafb',
                border: `1px solid ${SEV_COLOR[flag.severity] || '#e5e7eb'}33`,
                fontSize: '0.8rem',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                  <span style={{ fontWeight: 700, textTransform: 'capitalize' }}>
                    {flag.clause_type.replace(/_/g, ' ')}
                  </span>
                  <ClausePill severity={flag.severity} label={flag.severity} />
                </div>
                <p style={{ color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: '0.3rem' }}>
                  "{flag.excerpt}"
                </p>
                <p style={{ color: 'var(--color-text)' }}>{flag.why_it_matters}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function MapComparison() {
  const [leases, setLeases]         = useState([])
  const [zip, setZip]               = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [searched, setSearched]     = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [detailMap, setDetailMap]   = useState({})
  const [loadingId, setLoadingId]   = useState(null)

  async function handleSearch(zipcode) {
    if (!zipcode || zipcode.length < 5) {
      setError('Please enter a valid 5-digit ZIP code.')
      return
    }
    setError('')
    setLoading(true)
    setZip(zipcode)
    setSearched(false)
    setExpandedId(null)
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

  async function handleExpand(id) {
    if (expandedId === id) {
      setExpandedId(null)
      return
    }
    setExpandedId(id)
    if (detailMap[id]) return
    setLoadingId(id)
    try {
      const data = await fetchLeaseDetail(id)
      setDetailMap(m => ({ ...m, [id]: data }))
    } catch (e) {
      // silently fail — button stays visible but detail won't expand
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="fade-in">
      <h1 className="page-title">Lease Comparison Map</h1>
      <p className="page-subtitle">
        See nearby lease risk levels and average rents by ZIP code.
        Try <strong>08901</strong> for a New Brunswick, NJ demo with full clause analysis.
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
            {leases.map((l) => (
              <LeaseCard
                key={l.id || l.address}
                lease={l}
                onExpand={handleExpand}
                expanded={expandedId === l.id}
                detail={detailMap[l.id]}
                loadingDetail={loadingId === l.id}
              />
            ))}
          </div>

          <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            * New Brunswick leases are mock contracts analyzed by the LeaseShield pipeline.
            Other ZIP codes show illustrative data only.
          </p>
        </div>
      )}
    </div>
  )
}
