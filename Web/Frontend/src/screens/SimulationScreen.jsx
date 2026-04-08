import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { simulationApi } from '../services/api'

const OP_LABEL = { equals:'=', not_equals:'≠', greater_than:'>', less_than:'<', greater_than_or_equal:'≥', less_than_or_equal:'≤', in_list:'IN', not_in_list:'NOT IN', is_true:'= true', is_false:'= false' }

export default function SimulationScreen() {
  const navigate = useNavigate()
  const [rules, setRules] = useState([])
  const [policyText, setPolicyText] = useState('')
  const [understoodAs, setUnderstoodAs] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    try {
      const r = sessionStorage.getItem('parsedRules')
      const t = sessionStorage.getItem('policyText')
      const u = sessionStorage.getItem('understoodAs')
      if (r) setRules(JSON.parse(r))
      if (t) setPolicyText(t)
      if (u) setUnderstoodAs(u)
    } catch { }
  }, [])

  function removeRule(idx) { setRules(prev => prev.filter((_, i) => i !== idx)) }

  async function runSimulation() {
    if (!rules.length) { setError('No rules to simulate.'); return }
    setLoading(true); setError('')
    try {
      const result = await simulationApi.run(policyText, rules)
      sessionStorage.setItem('simResults', JSON.stringify(result))
      navigate('/results')
    } catch (err) {
      setError(err.message || 'Simulation failed.')
    } finally { setLoading(false) }
  }

  if (!rules.length) return (
    <div className="fade-in" style={{ maxWidth: 760 }}>
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No rules loaded</h3>
          <p>Parse a policy first before running a simulation.</p>
          <button className="btn btn-primary" onClick={() => navigate('/policy')}>← Go to Policy Input</button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="fade-in" style={{ maxWidth: 760 }}>
      <div className="page-header">
        <h1>Run Simulation</h1>
        <p>Review extracted rules and apply them against the citizen dataset</p>
      </div>

      {/* Step Wizard */}
      <div className="step-wizard">
        {['Policy Input','Review Rules','Run Simulation','View Results'].map((s, i) => (
          <React.Fragment key={s}>
            <div className={`step-item${i < 2 ? ' done' : i === 2 ? ' active' : ''}`}>
              <div className="step-circle">{i < 2 ? '✓' : i + 1}</div>
              <span className="step-label">{s}</span>
            </div>
            {i < 3 && <div className="step-connector" />}
          </React.Fragment>
        ))}
      </div>

      {/* Understood As */}
      {understoodAs && (
        <div className="understood-box" style={{ marginBottom: '1rem' }}>
          <div className="understood-label">Policy understood as</div>
          <div className="understood-text">{understoodAs}</div>
        </div>
      )}

      {/* Rules Card */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Eligibility Rules</div>
            <div className="card-sub">Hover a rule and click ✕ to remove it from the simulation</div>
          </div>
          <span className="badge badge-blue">{rules.length} active</span>
        </div>
        <div className="card-body">
          <div className="rule-list">
            {rules.map((rule, i) => (
              <React.Fragment key={i}>
                {i > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.2rem 0' }}>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    <span className="rule-connector">AND</span>
                    <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  </div>
                )}
                <div className="rule-item" style={{ justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="rule-number">#{i+1}</span>
                    <span className="rule-field">{rule.field}</span>
                    <span className="rule-op">{OP_LABEL[rule.operator] || rule.operator}</span>
                    <span className="rule-val">{Array.isArray(rule.value) ? rule.value.join(', ') : String(rule.value)}</span>
                  </div>
                  <button onClick={() => removeRule(i)} title="Remove rule"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', fontSize: '1rem', padding: '0 4px', lineHeight: 1 }}>✕</button>
                </div>
                {rule.label && <div style={{ fontSize: '0.75rem', color: 'var(--ink-3)', marginLeft: '0.5rem' }}>{rule.label}</div>}
              </React.Fragment>
            ))}
          </div>
          <div style={{ marginTop: '1rem' }}>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/policy')} style={{ paddingLeft: 0 }}>← Re-parse policy</button>
          </div>
        </div>
      </div>

      {/* Dataset Info */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Target Dataset</div>
            <div className="card-sub">Citizen records the rules will be applied against</div>
          </div>
          <span className="badge badge-green">Ready</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1rem' }}>
            {[{ label: 'Total Records', value: '150+' }, { label: 'Attributes', value: '11' }, { label: 'State Coverage', value: 'All India' }].map(s => (
              <div key={s.label} style={{ textAlign: 'center', background: 'var(--paper)', borderRadius: 'var(--radius)', padding: '1rem' }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--ink)' }}>{s.value}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: '0.25rem' }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--ink-3)', lineHeight: 1.8 }}>
            Fields: age · gender · income_annual · state · rural_urban · social_category · occupation · marital_status · disability · education_level · bpl_status
          </div>
        </div>
      </div>

      {error && <div className="alert alert-error"><span>⚠</span>{error}</div>}

      <button className={`btn btn-success btn-full btn-lg${loading ? ' btn-loading' : ''}`} onClick={runSimulation} disabled={loading}>
        {loading ? '' : `▶  Run Simulation on ${rules.length} Rule${rules.length !== 1 ? 's' : ''}`}
      </button>
    </div>
  )
}
