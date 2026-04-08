import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { policyApi } from '../services/api'

const EXAMPLES = [
  { label: '🌾 Rural Farmer Support', text: 'Financial assistance for farmers in rural areas with annual income below ₹1,00,000 and land holding under 2 hectares.' },
  { label: '👵 Senior Citizen Pension', text: 'Monthly pension for BPL citizens aged above 60 years who are widowed or disabled.' },
  { label: '🎓 SC/ST Education Grant', text: 'Education scholarship for SC and ST students with family income below ₹2,50,000 per year who have completed at least secondary schooling.' },
  { label: '🏥 Disability Support', text: 'Monthly allowance for disabled individuals with annual income below ₹50,000 who are unemployed or daily wage labourers.' },
]

const OP_LABEL = { equals:'=', not_equals:'≠', greater_than:'>', less_than:'<', greater_than_or_equal:'≥', less_than_or_equal:'≤', in_list:'IN', not_in_list:'NOT IN', is_true:'= true', is_false:'= false' }

export default function PolicyInputScreen() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('text')
  const [policyText, setPolicyText] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [parsed, setParsed] = useState(null)
  const [drag, setDrag] = useState(false)
  const fileRef = useRef()

  async function handleSubmit() {
    if (mode === 'text' && policyText.trim().length < 10) { setError('Please enter at least 10 characters.'); return }
    if (mode === 'file' && !file) { setError('Please upload a PDF or DOCX file.'); return }
    setLoading(true); setError(''); setParsed(null)
    try {
      const result = mode === 'text' ? await policyApi.parseText(policyText) : await policyApi.parseFile(file)
      setParsed(result)
      sessionStorage.setItem('parsedRules', JSON.stringify(result.rules))
      sessionStorage.setItem('policyText', policyText || file?.name || '')
      sessionStorage.setItem('understoodAs', result.understood_as || '')
    } catch (err) {
      setError(err.message || 'Failed to parse policy. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const allFields = ['age','gender','income_annual','state','rural_urban','social_category','occupation','marital_status','disability','education_level','bpl_status']

  return (
    <div className="fade-in" style={{ maxWidth: 1050 }}>
      <div className="page-header">
        <h1>Policy Input</h1>
        <p>Paste a government policy and extract structured eligibility rules using AI (LLaMA 3.3 via Groq)</p>
      </div>

      {/* Step Wizard */}
      <div className="step-wizard">
        {['Policy Input','Review Rules','Run Simulation','View Results'].map((s, i) => (
          <React.Fragment key={s}>
            <div className={`step-item${i === 0 ? ' active' : ''}`}>
              <div className="step-circle">{i + 1}</div>
              <span className="step-label">{s}</span>
            </div>
            {i < 3 && <div className="step-connector" />}
          </React.Fragment>
        ))}
      </div>

      <div className="policy-layout">
        {/* LEFT — Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div className="card-header">
              <div>
                <div className="card-title">Policy Description</div>
                <div className="card-sub">AI will extract eligibility conditions from your input</div>
              </div>
              <div className="mode-toggle">
                <button className={`mode-btn${mode === 'text' ? ' active' : ''}`} onClick={() => { setMode('text'); setError('') }}>✏ Text</button>
                <button className={`mode-btn${mode === 'file' ? ' active' : ''}`} onClick={() => { setMode('file'); setError('') }}>📄 Upload</button>
              </div>
            </div>
            <div className="card-body">
              {error && <div className="alert alert-error"><span>⚠</span><span>{error}</span></div>}

              {mode === 'text' ? (
                <>
                  <div className="form-group">
                    <label className="form-label">Policy Text</label>
                    <textarea
                      className="form-input"
                      style={{ minHeight: 160 }}
                      placeholder="e.g. Financial assistance for rural households with annual income below ₹1,00,000 and at least one elderly member above 60 years of age who belong to SC or ST category..."
                      value={policyText}
                      onChange={e => { setPolicyText(e.target.value); setError(''); setParsed(null) }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="form-hint">{policyText.length} characters {policyText.length < 10 && policyText.length > 0 ? '(min 10)' : ''}</span>
                      {policyText && <button onClick={() => { setPolicyText(''); setParsed(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', color: 'var(--ink-3)' }}>Clear</button>}
                    </div>
                  </div>
                </>
              ) : (
                <div
                  className={`upload-zone${drag ? ' drag' : ''}`}
                  style={{ marginBottom: '1rem' }}
                  onDragOver={e => { e.preventDefault(); setDrag(true) }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) { setFile(f); setError('') } }}
                  onClick={() => fileRef.current?.click()}
                >
                  <input ref={fileRef} type="file" accept=".pdf,.docx,.doc" style={{ display: 'none' }} onChange={e => { setFile(e.target.files[0]); setError('') }} />
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{file ? '📎' : '📤'}</div>
                  {file ? (
                    <>
                      <div style={{ fontWeight: 600, color: 'var(--accent)', fontSize: '0.88rem' }}>{file.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ink-3)', marginTop: '0.2rem' }}>{(file.size/1024).toFixed(1)} KB · click to change</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontWeight: 500, fontSize: '0.88rem', color: 'var(--ink-2)' }}>Drop your PDF or DOCX here</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--ink-3)', marginTop: '0.2rem' }}>or click to browse · max 10 MB</div>
                    </>
                  )}
                </div>
              )}

              <button className={`btn btn-primary btn-full btn-lg${loading ? ' btn-loading' : ''}`} onClick={handleSubmit} disabled={loading}>
                {loading ? '' : '⚡ Extract Rules with AI'}
              </button>
            </div>
          </div>

          {/* Examples */}
          <div className="card">
            <div className="card-header"><div className="card-title">💡 Try an example policy</div></div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {EXAMPLES.map(ex => (
                <button key={ex.label} className="example-btn" onClick={() => { setMode('text'); setPolicyText(ex.text); setParsed(null); setError('') }}>
                  <div className="example-btn-label">{ex.label}</div>
                  <div className="example-btn-text">{ex.text}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Results */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {!parsed && !loading && (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon">🧠</div>
                <h3>Waiting for policy input</h3>
                <p>Enter a policy description on the left and click "Extract Rules" to see structured eligibility criteria here.</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Analysing with AI...</div>
                  <div className="card-sub">LLaMA 3.3 via Groq API</div>
                </div>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {[140, 120, 100].map((w, i) => (
                  <div key={i} className="skeleton" style={{ height: 40, width: '100%' }} />
                ))}
              </div>
            </div>
          )}

          {parsed && (
            <>
              {/* Understood As */}
              <div className="understood-box">
                <div className="understood-label">Policy understood as</div>
                <div className="understood-text">{parsed.understood_as}</div>
              </div>

              {/* Rules */}
              <div className="card">
                <div className="card-header">
                  <div>
                    <div className="card-title">Extracted Eligibility Rules</div>
                    <div className="card-sub">Combined with AND logic</div>
                  </div>
                  <span className="badge badge-blue">{parsed.rules?.length} rules</span>
                </div>
                <div className="card-body">
                  <div className="rule-list">
                    {parsed.rules?.map((rule, i) => (
                      <React.Fragment key={i}>
                        {i > 0 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0.2rem 0' }}>
                            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                            <span className="rule-connector">AND</span>
                            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                          </div>
                        )}
                        <div className="rule-item">
                          <span className="rule-number">#{i+1}</span>
                          <span className="rule-field">{rule.field}</span>
                          <span className="rule-op">{OP_LABEL[rule.operator] || rule.operator}</span>
                          <span className="rule-val">{Array.isArray(rule.value) ? rule.value.join(', ') : String(rule.value)}</span>
                        </div>
                        {rule.label && <div style={{ fontSize: '0.75rem', color: 'var(--ink-3)', marginLeft: '0.5rem' }}>{rule.label}</div>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>

              {/* Fields matched */}
              <div className="card">
                <div className="card-header"><div className="card-title">Dataset Fields Used</div></div>
                <div className="card-body">
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {allFields.map(f => {
                      const used = parsed.rules?.some(r => r.field === f)
                      return (
                        <span key={f} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: 4, border: '1px solid', fontWeight: used ? 600 : 400, background: used ? 'var(--success-bg)' : 'var(--paper)', color: used ? 'var(--success)' : 'var(--ink-4)', borderColor: used ? 'rgba(10,124,78,0.25)' : 'var(--border)' }}>
                          {used ? '✓ ' : ''}{f}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <button className="btn btn-success btn-full btn-lg" onClick={() => navigate('/simulate')}>
                ▶ Run Simulation on {parsed.rules?.length} Rules →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
