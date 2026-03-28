import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useLease } from '../context/LeaseContext'
import RiskGauge from '../components/risk/RiskGauge'
import RiskBreakdown from '../components/risk/RiskBreakdown'
import ClauseList from '../components/analysis/ClauseList'
import Button from '../components/ui/Button'

export default function Results() {
  const navigate = useNavigate()
  const { analysisResult, uploadedFileName, reset } = useLease()

  if (!analysisResult) {
    return (
      <div className="fade-in" style={{ textAlign: 'center', paddingTop: '3rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
        <h2 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>No analysis yet</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
          Upload a lease to see your results here.
        </p>
        <Button onClick={() => navigate('/')}>Upload a Lease</Button>
      </div>
    )
  }

  const { overall_risk_score, risk_bucket, summary, flags, disclaimer } = analysisResult

  return (
    <div className="fade-in">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <div>
          <h1 className="page-title">Lease Analysis</h1>
          <p className="page-subtitle" style={{ marginBottom: 0 }}>
            {uploadedFileName || 'Uploaded lease'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Button variant="secondary" onClick={() => navigate('/letter')}>
            ✉️ Generate Exit Letter
          </Button>
          <Button variant="ghost" onClick={() => { reset(); navigate('/') }}>
            Analyze New Lease
          </Button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(180px, 220px) 1fr',
        gap: '1.5rem',
        marginBottom: '1.5rem',
      }}>
        <RiskGauge score={overall_risk_score} bucket={risk_bucket} />
        <RiskBreakdown flags={flags} summary={summary} />
      </div>

      <h2 style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '1rem' }}>
        Flagged Clauses ({flags?.length || 0})
      </h2>
      <ClauseList flags={flags} />

      <p style={{
        marginTop: '2rem',
        fontSize: '0.8rem',
        color: 'var(--color-text-muted)',
        fontStyle: 'italic',
        textAlign: 'center',
      }}>
        {disclaimer}
      </p>
    </div>
  )
}
