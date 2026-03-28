import React, { useState } from 'react'
import Button from '../ui/Button'
import Spinner from '../ui/Spinner'

export default function ZipSearch({ onSearch, loading }) {
  const [zip, setZip] = useState('')

  function handleSubmit() {
    if (zip.trim().length === 5) onSearch(zip.trim())
  }

  return (
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
        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
      />
      <Button onClick={handleSubmit} disabled={loading || zip.length < 5}>
        {loading ? <><Spinner size={16} color="#fff" /> Searching...</> : 'Search'}
      </Button>
    </div>
  )
}
