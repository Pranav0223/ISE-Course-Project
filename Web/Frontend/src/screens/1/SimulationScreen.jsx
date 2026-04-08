import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { simulationApi } from '../services/api'

export default function SimulationScreen() {
  const navigate = useNavigate()
  const [rules, setRules] = useState([])
  const [policyText, setPolicyText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const stored = sessionStorage.getItem('parsedRules')
    const text = sessionStorage.getItem('policyText')
    if (stored) {
      try { setRules(JSON.parse(stored)) } catch { setRules([]) }
    }
    if (text) setPolicyText(text)
  }, [])

  async function runSimulation() {
    if (!rules.length) {
      setError('No rules to simulate. Please parse a policy first.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await simulationApi.run(rules)
      sessionStorage.setItem('simResults', JSON.stringify(result))
      navigate('/results')
    } catch (err) {
      setError(err.message || 'Simulation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function removeRule(idx) {
    setRules(r => r.filter((_, i) => i !== idx))
  }

  const noRules = rules.length === 0

  return (
    <div className="fade-in" style={{ maxWidth: 760 }}>
      {/* Step wizard */}
      <div className="step-wizard">
        <div className="step-item done">
          <div className="step-circle">✓</div>
          <span className="step-label">Policy Input</span>
        </div>
        <div className="step-connector" />
        <div className="step-item active">
          <div className="step-circle">2</div>
          <span className="step-label">Run Simulation</span>
        </div>
        <div className="step-connector" />
        <div className="step-item">
          <div className="step-circle">3</div>
          <span className="step-label">View Results</span>
        </div>
      </div>

      {noRules ? (
        <div className="card">
          <div className="card-body" style={{ textAlign:'center', padding:'3rem' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>📋</div>
            <div style={{ fontWeight:700, marginBottom:'0.5rem' }}>No rules loaded</div>
            <div style={{ color:'var(--ink-3)', fontSize:'0.88rem', marginBottom:'1.5rem' }}>
              You need to parse a policy first before running a simulation.
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/policy')}>
              Go to Policy Input
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* EXTRACTED RULES */}
          <div className="card" style={{ marginBottom:'1.5rem' }}>
            <div className="card-header">
              <div>
                <div className="card-title">Extracted Eligibility Rules</div>
                <div className="card-sub">Review and remove rules before running the simulation</div>
              </div>
              <span className="badge badge-blue">{rules.length} rule{rules.length !== 1 ? 's' : ''}</span>
            </div>
            <div className="card-body">
              {policyText && (
                <div style={{ background:'var(--paper)', border:'1px solid var(--border)', borderRadius:6, padding:'0.75rem 1rem', marginBottom:'1.2rem', fontSize:'0.83rem', color:'var(--ink-2)', fontStyle:'italic', lineHeight:1.6 }}>
                  "{policyText.length > 180 ? policyText.slice(0, 180) + '…' : policyText}"
                </div>
              )}

              <div className="rule-list">
                {rules.map((rule, i) => (
                  <div key={i} className="rule-item" style={{ justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap' }}>
                      {i > 0 && <span className="rule-connector">AND</span>}
                      <span className="rule-field">{rule.field}</span>
                      <span className="rule-op">{rule.operator || rule.op}</span>
                      <span className="rule-val">
                        {typeof rule.value === 'string' ? `"${rule.value}"` : rule.value}
                      </span>
                    </div>
                    <button
                      onClick={() => removeRule(i)}
                      style={{ background:'none', border:'none', cursor:'pointer', color:'var(--ink-4)', padding:'0 4px', fontSize:'1rem', lineHeight:1 }}
                      title="Remove rule"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ marginTop:'1.2rem', display:'flex', gap:'0.8rem', alignItems:'center', flexWrap:'wrap' }}>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/policy')}>
                  ← Re-parse policy
                </button>
                <div style={{ fontSize:'0.75rem', color:'var(--ink-3)' }}>
                  Rules are combined with AND logic
                </div>
              </div>
            </div>
          </div>

          {/* DATASET INFO */}
          <div className="card" style={{ marginBottom:'1.5rem' }}>
            <div className="card-header">
              <div>
                <div className="card-title">Target Dataset</div>
                <div className="card-sub">Citizen records the rules will be applied against</div>
              </div>
              <span className="badge badge-green">Ready</span>
            </div>
            <div className="card-body">
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem' }}>
                {[
                  { label:'Total Records', value:'150+' },
                  { label:'Attributes per Citizen', value:'10+' },
                  { label:'State Coverage', value:'All India' },
                ].map(s => (
                  <div key={s.label} style={{ textAlign:'center', background:'var(--paper)', borderRadius:6, padding:'1rem' }}>
                    <div style={{ fontFamily:'var(--font-serif)', fontSize:'1.5rem', fontWeight:700, color:'var(--ink)' }}>{s.value}</div>
                    <div style={{ fontSize:'0.72rem', color:'var(--ink-3)', textTransform:'uppercase', letterSpacing:'0.05em', marginTop:'0.25rem' }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:'1rem', fontSize:'0.78rem', color:'var(--ink-3)', fontFamily:'var(--font-mono)' }}>
                Fields: name · age · income_annual · rural_urban · state · occupation · bpl_status · land_holding_ha · gender · family_size
              </div>
            </div>
          </div>

          {error && <div className="alert alert-error"><span>⚠</span>{error}</div>}

          <button
            className={`btn btn-primary btn-lg btn-full${loading ? ' btn-loading' : ''}`}
            onClick={runSimulation}
            disabled={loading}
          >
            {loading ? '' : `▶  Run Simulation on ${rules.length} Rule${rules.length !== 1 ? 's' : ''}`}
          </button>
        </>
      )}
    </div>
  )
}
