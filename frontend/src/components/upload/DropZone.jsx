import React, { useRef, useState } from 'react'
import Button from '../ui/Button'

export default function DropZone({ onFile }) {
  const inputRef  = useRef()
  const [dragging, setDragging] = useState(false)

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) onFile(file)
  }

  function handleChange(e) {
    const file = e.target.files?.[0]
    if (file) onFile(file)
    // reset so same file can be re-uploaded
    e.target.value = ''
  }

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current.click()}
      style={{
        border: `2px dashed ${dragging ? 'var(--color-primary)' : 'var(--color-border)'}`,
        borderRadius: 'var(--radius-xl)',
        padding: '4rem 2rem',
        textAlign: 'center',
        cursor: 'pointer',
        background: dragging ? '#eff6ff' : 'var(--color-surface)',
        transition: 'all 0.2s',
      }}
    >
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
      <p style={{ fontWeight: 600, fontSize: '1.1rem', marginBottom: '0.5rem' }}>
        Drop your lease PDF here
      </p>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        or click to browse — PDF only, max 20MB
      </p>
      <Button
        variant="primary"
        onClick={e => { e.stopPropagation(); inputRef.current.click() }}
      >
        Choose File
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        style={{ display: 'none' }}
        onChange={handleChange}
      />
    </div>
  )
}
