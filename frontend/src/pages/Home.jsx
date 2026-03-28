import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useLease } from '../context/LeaseContext'
import { analyzeLease } from '../services/api'
import DropZone from '../components/upload/DropZone'
import UploadProgress from '../components/upload/UploadProgress'

export default function Home() {
  const navigate = useNavigate()
  const {
    setAnalysisResult, setIsLoading, isLoading,
    setError, error, setUploadedFileName,
  } = useLease()

  async function handleFile(file) {
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file.')
      return
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('File too large. Max 20MB.')
      return
    }

    setError(null)
    setIsLoading(true)
    setUploadedFileName(file.name)

    try {
      const result = await analyzeLease(file)
      setAnalysisResult(result)
      navigate('/results')
    } catch (err) {
      setError(err.message || 'Analysis failed. Make sure Ollama is running.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fade-in">
      <h1 className="page-title">Know Before You Sign</h1>
      <p className="page-subtitle">
        Upload your lease PDF and we'll flag risky clauses in plain English — free, private, and instant.
      </p>

      {error && <div className="error-message">{error}</div>}

      {isLoading ? (
        <UploadProgress />
      ) : (
        <DropZone onFile={handleFile} />
      )}

      <div style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[
          { icon: '🔍', title: 'Clause Detection', desc: '8 risky clause types detected automatically' },
          { icon: '📊', title: 'Risk Scoring',     desc: 'Transparent severity scoring with plain-English summaries' },
          { icon: '🔒', title: '100% Private',     desc: 'Runs locally on your machine — nothing sent to external servers' },
        ].map(f => (
          <div key={f.title} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{f.icon}</div>
            <p style={{ fontWeight: 600, marginBottom: '0.3rem' }}>{f.title}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{f.desc}</p>
          </div>
        ))}
      </div>

      <p style={{ marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', textAlign: 'center' }}>
        LeaseShield is informational only and is not a substitute for legal advice.
      </p>
    </div>
  )
}
