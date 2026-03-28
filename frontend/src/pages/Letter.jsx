import React, { useState } from 'react'
import { generateLetter } from '../services/api'
import LetterPreview from '../components/letter/LetterPreview'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'

const EMPTY = {
  tenant_name: '',
  landlord_name: '',
  property_address: '',
  move_out_date: '',
  reason: '',
}

export default function Letter() {
  const [form, setForm]       = useState(EMPTY)
  const [letter, setLetter]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  function update(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function handleGenerate() {
    const missing = ['tenant_name', 'landlord_name', 'property_address', 'move_out_date']
      .filter(k => !form[k].trim())
    if (missing.length) {
      setError(`Please fill in: ${missing.map(k => k.replace(/_/g, ' ')).join(', ')}`)
      return
    }
    setError('')
    setLoading(true)
    try {
      const data = await generateLetter(form)
      setLetter(data.letter)
    } catch (e) {
      setError(e.message || 'Generation failed.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    padding: '0.5rem 0.75rem',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    fontSize: '0.875rem',
    outline: 'none',
    width: '100%',
  }

  return (
    <div className="fade-in">
      <h1 className="page-title">Exit Letter Generator</h1>
      <p className="page-subtitle">
        Generate a formal notice-to-vacate letter ready to send to your landlord.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '2rem',
      }}>
        {/* Form */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '0.25rem' }}>Your Details</h2>

          {[
            { label: 'Your Full Name',      key: 'tenant_name',      placeholder: 'Jane Smith'                   },
            { label: 'Landlord Name',        key: 'landlord_name',    placeholder: 'John Doe'                     },
            { label: 'Property Address',     key: 'property_address', placeholder: '123 Main St, City, State ZIP' },
          ].map(({ label, key, placeholder }) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>{label} *</label>
              <input
                type="text"
                value={form[key]}
                onChange={e => update(key, e.target.value)}
                placeholder={placeholder}
                style={inputStyle}
              />
            </div>
          ))}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Move-Out Date *</label>
            <input
              type="date"
              value={form.move_out_date}
              onChange={e => update('move_out_date', e.target.value)}
              style={inputStyle}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Reason for Leaving (optional)</label>
            <textarea
              value={form.reason}
              onChange={e => update('reason', e.target.value)}
              placeholder="personal reasons"
              rows={2}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <Button onClick={handleGenerate} disabled={loading} fullWidth size="lg">
            {loading
              ? <><Spinner size={16} color="#fff" /> Generating...</>
              : '✉️ Generate Letter'
            }
          </Button>
        </div>

        {/* Preview */}
        <div>
          {letter
            ? <LetterPreview letter={letter} />
            : (
              <div className="card" style={{
                textAlign: 'center',
                padding: '3rem 2rem',
                color: 'var(--color-text-muted)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
              }}>
                <div style={{ fontSize: '2.5rem' }}>✉️</div>
                <p style={{ fontWeight: 500 }}>Your letter will appear here</p>
                <p style={{ fontSize: '0.85rem' }}>Fill in the form and click Generate Letter</p>
              </div>
            )
          }
        </div>
      </div>
    </div>
  )
}
