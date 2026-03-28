import React from 'react'
import Button from '../ui/Button'

export default function LetterPreview({ letter }) {
  function handleCopy() {
    navigator.clipboard.writeText(letter).catch(() => {
      // fallback for older browsers
      const ta = document.createElement('textarea')
      ta.value = letter
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    })
  }

  function handlePrint() {
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`
      <html>
        <head><title>LeaseShield — Notice to Vacate</title></head>
        <body>
          <pre style="font-family:Georgia,serif;white-space:pre-wrap;padding:2rem;max-width:700px;line-height:1.8">${letter}</pre>
        </body>
      </html>
    `)
    w.document.close()
    w.print()
  }

  return (
    <div className="card fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={{ fontWeight: 600 }}>Generated Letter</p>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <Button variant="ghost" size="sm" onClick={handleCopy}>Copy</Button>
          <Button variant="secondary" size="sm" onClick={handlePrint}>Print</Button>
        </div>
      </div>
      <pre style={{
        whiteSpace: 'pre-wrap',
        fontFamily: 'Georgia, serif',
        fontSize: '0.875rem',
        lineHeight: 1.8,
        background: '#f9fafb',
        padding: '1.25rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--color-border)',
        maxHeight: '500px',
        overflowY: 'auto',
        margin: 0,
      }}>
        {letter}
      </pre>
    </div>
  )
}
