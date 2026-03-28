import React from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useLease } from '../context/LeaseContext'
import RiskGauge from '../components/risk/RiskGauge'
import RiskBreakdown from '../components/risk/RiskBreakdown'
import ClauseList from '../components/analysis/ClauseList'
import Button from '../components/ui/Button'

// ─── per-clause-type tips ────────────────────────────────────────────────────

const CLAUSE_TIPS = {
  automatic_renewal:  'Set a calendar reminder 60–90 days before your lease end date so an auto-renewal doesn\'t lock you in.',
  early_termination:  'Your early termination penalty is significant. Negotiate it down before signing, or ensure you understand the duty-to-mitigate rule.',
  late_fees:          'Your late fee clause may be disproportionate. NJ courts void fees that function as penalties rather than actual-cost compensation.',
  security_deposit:   'Confirm your deposit doesn\'t exceed 1.5× monthly rent (NJ cap). Get an itemized condition report at move-in.',
  maintenance_repairs:'Document the unit\'s condition thoroughly at move-in. Request all repair commitments in writing.',
  landlord_entry:     'Your landlord\'s entry clause is broad. NJ law still requires reasonable notice — typically 24 hours — regardless of what the lease says.',
  subletting:         'If subletting is a possibility, negotiate explicit written permission into the lease before signing.',
  guest_restrictions: 'Guest restrictions are often broadly written. Clarify what "long-term guest" means in writing before you sign.',
}

// ─── NextSteps component ─────────────────────────────────────────────────────

function NextSteps({ bucket, flags }) {
  const navigate = useNavigate()

  const highFlags = (flags || []).filter(f => f.severity === 'high')
  const medFlags  = (flags || []).filter(f => f.severity === 'medium')

  // Clause-specific tips for any high or medium flag
  const clauseTips = [...highFlags, ...medFlags]
    .map(f => CLAUSE_TIPS[f.clause_type])
    .filter(Boolean)
    .filter((t, i, a) => a.indexOf(t) === i)   // dedupe
    .slice(0, 3)

  const config = {
    Low: {
      accent:  '#34c97a',
      bgColor: 'rgba(52,201,122,0.07)',
      border:  'rgba(52,201,122,0.25)',
      icon:    '✅',
      headline: 'This lease looks low risk — you\'re likely safe to sign.',
      steps: [
        { icon: '📋', text: 'Read through the flagged clauses above so you understand all your obligations before signing.' },
        { icon: '🗺️', text: <span>Compare this lease against others in your area on the <Link to="/map" style={{ color: 'var(--color-primary)' }}>Compare Leases</Link> tab.</span> },
        { icon: '💬', text: <span>Want to feel prepared for move-in conversations? Try the <Link to="/simulator" style={{ color: 'var(--color-primary)' }}>Negotiation Practice</Link> game.</span> },
      ],
    },
    Moderate: {
      accent:  '#f0a832',
      bgColor: 'rgba(240,168,50,0.07)',
      border:  'rgba(240,168,50,0.3)',
      icon:    '⚠️',
      headline: 'This lease has clauses worth negotiating before you sign.',
      steps: [
        { icon: '🤝', text: <span>Focus on the medium-severity clauses above and ask your landlord to revise or clarify them. Use the <Link to="/simulator" style={{ color: 'var(--color-primary)' }}>Negotiation Practice</Link> tool to prepare for that conversation.</span> },
        { icon: '✉️', text: <span>If you\'ve already signed and need to exit, <Link to="/letter" style={{ color: 'var(--color-primary)' }}>generate an exit letter</Link> that references your specific lease terms.</span> },
        { icon: '🗺️', text: <span>Not happy with the terms? Browse comparable leases on the <Link to="/map" style={{ color: 'var(--color-primary)' }}>Compare Leases</Link> tab to see if better options exist nearby.</span> },
      ],
    },
    High: {
      accent:  '#e05555',
      bgColor: 'rgba(224,85,85,0.07)',
      border:  'rgba(224,85,85,0.3)',
      icon:    '🚨',
      headline: 'This lease has serious red flags. Do not sign without addressing these first.',
      steps: [
        { icon: '⚖️', text: 'Several clauses may conflict with NJ law or expose you to significant financial risk. Review the high-severity flags above carefully.' },
        { icon: '🤝', text: <span>Practice negotiating the problem clauses on the <Link to="/simulator" style={{ color: 'var(--color-primary)' }}>Negotiation Practice</Link> tab before approaching your landlord.</span> },
        { icon: '✉️', text: <span>If you\'ve already signed and need to exit, <Link to="/letter" style={{ color: 'var(--color-primary)' }}>generate an exit letter</Link> that references your exact lease terms.</span> },
        { icon: '🗺️', text: <span>Consider exploring other leases in your area on the <Link to="/map" style={{ color: 'var(--color-primary)' }}>Compare Leases</Link> tab — there may be lower-risk options nearby.</span> },
        { icon: '👨‍⚖️', text: 'We strongly recommend consulting a tenant rights attorney or legal aid organization before signing this lease.' },
      ],
    },
  }

  const c = config[bucket] || config.Moderate

  return (
    <div style={{
      marginTop: '2rem',
      border: `1px solid ${c.border}`,
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        background: c.bgColor,
        borderBottom: `1px solid ${c.border}`,
        padding: '0.85rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
      }}>
        <span style={{ fontSize: '1rem' }}>{c.icon}</span>
        <span style={{ fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: '0.95rem', color: c.accent }}>
          Recommended Next Steps
        </span>
      </div>

      <div style={{ padding: '1.1rem 1.25rem', background: 'var(--color-surface-subtle)', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {/* Headline */}
        <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text-heading)', marginBottom: '0.25rem' }}>
          {c.headline}
        </p>

        {/* Clause-specific tips (derived from actual flags) */}
        {clauseTips.length > 0 && (
          <div style={{
            padding: '0.65rem 0.85rem',
            background: `${c.bgColor}`,
            border: `1px solid ${c.border}`,
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
          }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, color: c.accent, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.1rem' }}>
              Based on your lease
            </div>
            {clauseTips.map((tip, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.55 }}>
                <span style={{ color: c.accent, flexShrink: 0 }}>→</span>
                {tip}
              </div>
            ))}
          </div>
        )}

        {/* Action steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', marginTop: '0.1rem' }}>
          {c.steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--color-text)', lineHeight: 1.6, alignItems: 'flex-start' }}>
              <span style={{ flexShrink: 0, fontSize: '0.9rem' }}>{step.icon}</span>
              <span>{step.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

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

      <NextSteps bucket={risk_bucket} flags={flags} />

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
