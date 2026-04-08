import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ResultsScreen() {
  const navigate = useNavigate()
  const [results, setResults] = useState(null)
  const [rules, setRules] = useState([])
  const [animCount, setAnimCount] = useState(0)
  const [progress, setProgress] = useState(0)
  const countRef = useRef(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('simResults')
    const storedRules = sessionStorage.getItem('parsedRules')
    if (stored) {
      try {
        const r = JSON.parse(stored)
        setResults(r)
        if (storedRules) setRules(JSON.parse(storedRules))

        // Animate counter
        const eligible = r.eligible || r.eligibleCount || 0
        const total = r.total || 150
        const pct = Math.round((eligible / total) * 100)

        let c = 0
        const inc = Math.max(1, Math.floor(eligible / 40))
        countRef.current = setInterval(() => {
          c = Math.min(c + inc, eligible)
          setAnimCount(c)
          if (c >= eligible) {
            clearInterval(countRef.current)
            setAnimCount(eligible)
          }
        }, 40)

        setTimeout(() => setProgress(pct), 200)
      } catch { /* ignore */ }
    }
    return () => { if (countRef.current) clearInterval(countRef.current) }
  }, [])

  if (!results) {
    return (
      <div className="fade-in" style={{ maxWidth:760 }}>
        <div className="card">
          <div className="card-body" style={{ textAlign:'center', padding:'3rem' }}>
            <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>📊</div>
            <div style={{ fontWeight:700, marginBottom:'0.5rem' }}>No results yet</div>
            <div style={{ color:'var(--ink-3)', fontSize:'0.88rem', marginBottom:'1.5rem' }}>
              Run a simulation first to see results here.
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/policy')}>
              Start a simulation
            </button>
          </div>
        </div>
      </div>
    )
  }

  const eligible = results.eligible ?? results.eligibleCount ?? animCount
  const total = results.total ?? 150
  const pct = Math.round((eligible / total) * 100)

  // Breakdown data from backend or fallback
  const breakdown = results.breakdown || results.demographics || {}
  const stateBreakdown = results.stateBreakdown || results.byState || {}
  const citizens = results.results || results.eligibleCitizens || []

  // Indian states for map view
  const ALL_STATES = [
    'Andhra Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana',
    'Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra',
    'Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim',
    'Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'
  ]

  const eligibleStates = Object.keys(stateBreakdown).filter(s => stateBreakdown[s] > 0)

  return (
    <div className="fade-in" style={{ maxWidth: 900 }}>
      {/* Step wizard */}
      <div className="step-wizard" style={{ marginBottom:'2rem' }}>
        {['Policy Input','Run Simulation','View Results'].map((label, i) => (
          <React.Fragment key={label}>
            {i > 0 && <div className="step-connector" />}
            <div className="step-item done">
              <div className="step-circle">✓</div>
              <span className="step-label">{label}</span>
            </div>
          </React.Fragment>
        ))}
      </div>

      {/* SUCCESS BANNER */}
      <div className="alert alert-success" style={{ marginBottom:'1.5rem' }}>
        <span>✓</span>
        <span>Simulation complete — <strong>{eligible}</strong> eligible citizens found out of <strong>{total}</strong> records ({pct}%).</span>
      </div>

      {/* TOP STATS */}
      <div className="stat-grid" style={{ marginBottom:'1.5rem' }}>
        <div className="stat-card">
          <div className="stat-label">Eligible Citizens</div>
          <div className="stat-value">{animCount}</div>
          <div className="stat-change">of {total} total records</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Coverage Rate</div>
          <div className="stat-value">{pct}<span className="stat-unit">%</span></div>
          <div style={{ marginTop:'0.6rem' }}>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Rules Applied</div>
          <div className="stat-value">{rules.length}</div>
          <div className="stat-change">AND logic</div>
        </div>
        {breakdown.gender?.female !== undefined && (
          <div className="stat-card">
            <div className="stat-label">Female Eligible</div>
            <div className="stat-value">{breakdown.gender.female ?? '—'}</div>
            <div className="stat-change">of eligible citizens</div>
          </div>
        )}
      </div>

      {/* RULES RECAP */}
      {rules.length > 0 && (
        <div className="card" style={{ marginBottom:'1.5rem' }}>
          <div className="card-header">
            <div className="card-title">Rules Used</div>
            <span className="badge badge-blue">{rules.length}</span>
          </div>
          <div className="card-body">
            <div className="rule-list">
              {rules.map((rule, i) => (
                <div key={i} className="rule-item">
                  {i > 0 && <span className="rule-connector">AND</span>}
                  <span className="rule-field">{rule.field}</span>
                  <span className="rule-op">{rule.operator || rule.op}</span>
                  <span className="rule-val">
                    {typeof rule.value === 'string' ? `"${rule.value}"` : rule.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* STATE MAP */}
      <div className="card" style={{ marginBottom:'1.5rem' }}>
        <div className="card-header">
          <div>
            <div className="card-title">State-wise Distribution</div>
            <div className="card-sub">
              {eligibleStates.length > 0
                ? `Eligible citizens found in ${eligibleStates.length} state(s)`
                : 'Showing all Indian states — eligible states highlighted'}
            </div>
          </div>
        </div>
        <div className="card-body">
          <div className="state-chips">
            {ALL_STATES.map(state => {
              const count = stateBreakdown[state] || 0
              const isElig = count > 0 || (eligibleStates.length === 0)
              return (
                <div
                  key={state}
                  className={`state-chip${isElig && eligibleStates.length > 0 ? ' eligible' : ''}`}
                  title={count > 0 ? `${count} eligible` : state}
                >
                  {state}
                  {count > 0 && (
                    <span style={{ marginLeft:4, background:'rgba(10,124,78,0.15)', borderRadius:100, padding:'0 4px', fontSize:'0.68rem', fontWeight:700 }}>
                      {count}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          {eligibleStates.length === 0 && (
            <div style={{ marginTop:'0.8rem', fontSize:'0.78rem', color:'var(--ink-3)' }}>
              State breakdown will be shown here when your backend returns <code style={{ fontFamily:'var(--font-mono)', fontSize:'0.75rem' }}>byState</code> or <code style={{ fontFamily:'var(--font-mono)', fontSize:'0.75rem' }}>stateBreakdown</code> in the response.
            </div>
          )}
        </div>
      </div>

      {/* CITIZEN TABLE */}
      {citizens.length > 0 && (
        <div className="card" style={{ marginBottom:'1.5rem' }}>
          <div className="card-header">
            <div>
              <div className="card-title">Eligible Citizens</div>
              <div className="card-sub">First {Math.min(citizens.length, 50)} results</div>
            </div>
            <span className="badge badge-green">{citizens.length} found</span>
          </div>
          <div style={{ overflowX:'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Age</th>
                  <th>State</th>
                  <th>Occupation</th>
                  <th>Income (₹)</th>
                  <th>Rural/Urban</th>
                  <th>Eligible</th>
                </tr>
              </thead>
              <tbody>
                {citizens.slice(0, 50).map((c, i) => (
                  <tr key={c._id || c.id || i}>
                    <td style={{ color:'var(--ink-4)' }}>{i + 1}</td>
                    <td style={{ fontWeight:500, color:'var(--ink)' }}>{c.name || '—'}</td>
                    <td>{c.age ?? '—'}</td>
                    <td>{c.state || '—'}</td>
                    <td>{c.occupation || '—'}</td>
                    <td>{c.income_annual != null ? c.income_annual.toLocaleString('en-IN') : '—'}</td>
                    <td>
                      <span className={`badge ${c.rural_urban === 'Rural' ? 'badge-green' : 'badge-amber'}`}>
                        {c.rural_urban || '—'}
                      </span>
                    </td>
                    <td className="check-col">✓</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ACTIONS */}
      <div style={{ display:'flex', gap:'0.8rem', flexWrap:'wrap' }}>
        <button className="btn btn-primary" onClick={() => navigate('/policy')}>
          ← Parse another policy
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/citizens')}>
          Browse all citizens
        </button>
      </div>
    </div>
  )
}
