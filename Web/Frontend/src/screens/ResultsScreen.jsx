import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

function BarChart({ data, color = '#0052cc', title }) {
  if (!data || !Object.keys(data).length) return <div style={{ color: 'var(--ink-4)', fontSize: '0.8rem' }}>No data</div>
  const max = Math.max(...Object.values(data))
  return (
    <div>
      {title && <div className="section-label" style={{ marginBottom: '0.8rem' }}>{title}</div>}
      {Object.entries(data).sort((a,b) => b[1]-a[1]).map(([label, val]) => (
        <div className="chart-bar-row" key={label}>
          <div className="chart-bar-label">{label}</div>
          <div className="chart-bar-track">
            <div className="chart-bar-fill" style={{ width: `${(val/max)*100}%`, background: color }}>
              <span>{val}</span>
            </div>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--ink-3)', width: 32, textAlign: 'right', flexShrink: 0 }}>
            {max > 0 ? Math.round((val/max)*100) : 0}%
          </div>
        </div>
      ))}
    </div>
  )
}

function AnimatedNum({ target }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const start = performance.now()
    const step = (now) => {
      const p = Math.min((now - start) / 800, 1)
      const e = 1 - Math.pow(1 - p, 3)
      setVal(Math.round(e * target))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target])
  return <>{val.toLocaleString()}</>
}

export default function ResultsScreen() {
  const navigate = useNavigate()
  const [results, setResults] = useState(null)
  const [rules, setRules] = useState([])
  const [understoodAs, setUnderstoodAs] = useState('')
  const [pct, setPct] = useState(0)

  useEffect(() => {
    try {
      const r = sessionStorage.getItem('simResults')
      const ru = sessionStorage.getItem('parsedRules')
      const u = sessionStorage.getItem('understoodAs')
      if (r) { const d = JSON.parse(r); setResults(d); setTimeout(() => setPct(d.coverage_percent || 0), 300) }
      if (ru) setRules(JSON.parse(ru))
      if (u) setUnderstoodAs(u)
    } catch { }
  }, [])

  if (!results) return (
    <div className="fade-in" style={{ maxWidth: 760 }}>
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <h3>No results yet</h3>
          <p>Run a simulation first to see results here.</p>
          <button className="btn btn-primary" onClick={() => navigate('/policy')}>Start a simulation</button>
        </div>
      </div>
    </div>
  )

  const { total_population, eligible_count, excluded_count, coverage_percent, breakdowns = {} } = results
  const { social_category = {}, rural_urban = {}, gender = {}, all_states = [] } = breakdowns

  return (
    <div className="fade-in" style={{ maxWidth: 1050 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Simulation Results</h1>
          <p>Impact analysis across the citizen dataset</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={() => navigate('/citizens')}>Browse Dataset</button>
          <button className="btn btn-primary" onClick={() => navigate('/policy')}>← New Policy</button>
        </div>
      </div>

      {/* Step Wizard */}
      <div className="step-wizard">
        {['Policy Input','Run Simulation','View Results'].map((s, i) => (
          <React.Fragment key={s}>
            <div className="step-item done">
              <div className="step-circle">✓</div>
              <span className="step-label">{s}</span>
            </div>
            {i < 2 && <div className="step-connector" />}
          </React.Fragment>
        ))}
      </div>

      {/* Success Banner */}
      <div className="alert alert-success" style={{ marginBottom: '1.5rem' }}>
        <span>✓</span>
        <span>Simulation complete — <strong>{eligible_count}</strong> eligible citizens found out of <strong>{total_population}</strong> records (<strong>{coverage_percent}%</strong> coverage).</span>
      </div>

      {/* Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card"><div className="stat-label">Total Population</div><div className="stat-value"><AnimatedNum target={total_population} /></div><div className="stat-change">citizen records</div></div>
        <div className="stat-card"><div className="stat-label">Eligible Citizens</div><div className="stat-value green"><AnimatedNum target={eligible_count} /></div><div className="stat-change">match all rules</div></div>
        <div className="stat-card"><div className="stat-label">Excluded</div><div className="stat-value red"><AnimatedNum target={excluded_count} /></div><div className="stat-change">do not qualify</div></div>
        <div className="stat-card">
          <div className="stat-label">Coverage Rate</div>
          <div className="stat-value blue">{coverage_percent}%</div>
          <div style={{ marginTop: '0.6rem' }}>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Insight + Rules */}
      <div className="results-layout" style={{ marginBottom: '1.5rem' }}>
        <div className="insight-card">
          <div className="insight-label">🔍 Policy Insight</div>
          {understoodAs && <div className="insight-text" style={{ marginBottom: '1rem' }}>{understoodAs}</div>}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '1rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>Rural / Urban Split</div>
            {Object.entries(rural_urban).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', width: 55 }}>{k}</span>
                <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#fff', borderRadius: 3, width: `${eligible_count > 0 ? (v/eligible_count)*100 : 0}%`, transition: 'width 0.8s ease' }} />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#fff' }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.2)', fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)' }}>
            {coverage_percent < 20 ? '🎯 Targeted policy — narrow eligibility' : coverage_percent < 50 ? '📊 Moderate coverage' : '🌐 Broad policy — wide coverage'}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div className="card-title">Rules Applied</div>
            <span className="badge badge-blue">{rules.length}</span>
          </div>
          <div className="card-body">
            <div className="rule-list">
              {rules.map((r, i) => (
                <div className="rule-item" key={i}>
                  <span className="rule-number">#{i+1}</span>
                  <span className="rule-field">{r.field}</span>
                  <span className="rule-op">{r.operator}</span>
                  <span className="rule-val">{Array.isArray(r.value) ? r.value.join(', ') : String(r.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card"><div className="card-body"><BarChart data={gender} color="#ec4899" title="By Gender" /></div></div>
        <div className="card"><div className="card-body"><BarChart data={social_category} color="#f97316" title="By Social Category" /></div></div>
        <div className="card"><div className="card-body"><BarChart data={rural_urban} color="#14b8a6" title="By Rural / Urban" /></div></div>
      </div>

      {/* State Table */}
      {all_states.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div>
              <div className="card-title">State-wise Distribution</div>
              <div className="card-sub">{all_states.length} states with eligible citizens</div>
            </div>
            <span className="badge badge-blue">All India</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th><th>State</th><th>Eligible</th><th>State Total</th><th style={{ minWidth: 160 }}>Coverage</th>
                </tr>
              </thead>
              <tbody>
                {all_states.slice(0, 20).map(({ state, count, state_total }, i) => {
                  const p = state_total > 0 ? Math.round((count/state_total)*100) : 0
                  return (
                    <tr key={state}>
                      <td style={{ color: 'var(--ink-4)', fontSize: '0.75rem' }}>{i+1}</td>
                      <td style={{ fontWeight: 500 }}>{state}</td>
                      <td><span className="badge badge-green">{count}</span></td>
                      <td style={{ color: 'var(--ink-3)', fontSize: '0.8rem' }}>{state_total}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div className="progress-track" style={{ flex: 1, height: 6 }}>
                            <div className="progress-fill" style={{ width: `${p}%` }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--ink-3)', width: 32 }}>{p}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => navigate('/policy')}>← Try Another Policy</button>
        <button className="btn btn-secondary" onClick={() => navigate('/citizens')}>Browse Citizen Dataset</button>
        <button className="btn btn-secondary" onClick={() => navigate('/simulate')}>← Back to Simulation</button>
      </div>
    </div>
  )
}
