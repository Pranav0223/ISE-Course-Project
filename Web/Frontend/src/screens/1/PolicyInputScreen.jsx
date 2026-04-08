import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { policyApi } from '../services/api'

const EXAMPLES = [
  {
    label: 'Rural income support',
    text: 'Financial assistance for rural households with annual income below ₹1,00,000 and at least one elderly member above 60 years of age.',
  },
  {
    label: 'Farmer land subsidy',
    text: 'Agricultural subsidy for farmers in Maharashtra with land holdings under 2 hectares and annual income below ₹80,000.',
  },
  {
    label: 'BPL housing scheme',
    text: 'Housing support for Below Poverty Line (BPL) families in rural areas with no existing government housing allocation.',
  },
]

export default function PolicyInputScreen() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('text') // 'text' | 'file'
  const [policyText, setPolicyText] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [drag, setDrag] = useState(false)
  const fileRef = useRef()

  function handleDrop(e) {
    e.preventDefault()
    setDrag(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) setFile(dropped)
  }

  async function handleSubmit() {
    if (mode === 'text' && !policyText.trim()) {
      setError('Please enter a policy description.')
      return
    }
    if (mode === 'file' && !file) {
      setError('Please upload a PDF or DOCX file.')
      return
    }

    setLoading(true)
    setError('')
    try {
      let result
      if (mode === 'text') {
        result = await policyApi.parseText(policyText)
      } else {
        result = await policyApi.parseFile(file)
      }

      // Store parsed rules in sessionStorage to pass to simulate screen
      sessionStorage.setItem('parsedRules', JSON.stringify(result.rules || result))
      sessionStorage.setItem('policyText', policyText || (file?.name ?? ''))
      navigate('/simulate')
    } catch (err) {
      setError(err.message || 'Failed to parse policy. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in" style={{ maxWidth: 760 }}>
      {/* Step wizard */}
      <div className="step-wizard">
        <div className="step-item active">
          <div className="step-circle">1</div>
          <span className="step-label">Policy Input</span>
        </div>
        <div className="step-connector" />
        <div className="step-item">
          <div className="step-circle">2</div>
          <span className="step-label">Run Simulation</span>
        </div>
        <div className="step-connector" />
        <div className="step-item">
          <div className="step-circle">3</div>
          <span className="step-label">View Results</span>
        </div>
      </div>

      {/* MAIN CARD */}
      <div className="card" style={{ marginBottom:'1.5rem' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Enter Policy Description</div>
            <div className="card-sub">The AI will extract structured eligibility rules from your input</div>
          </div>
          {/* Mode toggle */}
          <div style={{ display:'flex', background:'var(--paper)', borderRadius:6, padding:3, gap:2 }}>
            {['text', 'file'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError('') }}
                style={{
                  background: mode === m ? 'var(--white)' : 'transparent',
                  border: mode === m ? '1px solid var(--border)' : '1px solid transparent',
                  borderRadius:4, padding:'0.3rem 0.8rem',
                  fontSize:'0.78rem', fontWeight:600,
                  color: mode === m ? 'var(--ink)' : 'var(--ink-3)',
                  cursor:'pointer', boxShadow: mode === m ? 'var(--shadow-sm)' : 'none',
                  fontFamily:'var(--font-sans)',
                }}
              >
                {m === 'text' ? '✏ Text' : '📄 Upload'}
              </button>
            ))}
          </div>
        </div>

        <div className="card-body">
          {error && <div className="alert alert-error"><span>⚠</span>{error}</div>}

          {mode === 'text' ? (
            <>
              <div className="form-group">
                <label className="form-label">Policy Text</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: 160, fontFamily: 'var(--font-sans)' }}
                  placeholder="Paste the full government policy description here. The AI will identify eligibility conditions such as income thresholds, location, age, occupation, and more."
                  value={policyText}
                  onChange={e => { setPolicyText(e.target.value); if(error) setError('') }}
                />
                <div className="form-hint">
                  Supports any plain-language policy description. The more specific, the better the rule extraction.
                </div>
              </div>

              {/* Quick examples */}
              <div style={{ marginBottom:'1.5rem' }}>
                <div style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--ink-4)', marginBottom:'0.5rem' }}>
                  Try an example
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
                  {EXAMPLES.map(ex => (
                    <button
                      key={ex.label}
                      className="btn btn-secondary btn-sm"
                      onClick={() => { setPolicyText(ex.text); if(error) setError('') }}
                    >
                      {ex.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={{ marginBottom:'1.5rem' }}>
              <div
                className={`upload-zone${drag ? ' drag' : ''}`}
                onDragOver={e => { e.preventDefault(); setDrag(true) }}
                onDragLeave={() => setDrag(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept=".pdf,.docx,.doc"
                  style={{ display:'none' }}
                  onChange={e => { setFile(e.target.files[0]); if(error) setError('') }}
                />
                <div className="upload-icon">📤</div>
                {file ? (
                  <>
                    <div className="upload-text" style={{ color:'var(--accent)' }}>📎 {file.name}</div>
                    <div className="upload-sub">{(file.size / 1024).toFixed(1)} KB — click to change</div>
                  </>
                ) : (
                  <>
                    <div className="upload-text">Drop your PDF or DOCX here</div>
                    <div className="upload-sub">or click to browse — max 10 MB</div>
                  </>
                )}
              </div>
            </div>
          )}

          <button
            className={`btn btn-primary btn-lg btn-full${loading ? ' btn-loading' : ''}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? '' : '⚡ Extract Rules with AI'}
          </button>
        </div>
      </div>

      {/* INFO BOX */}
      <div className="alert alert-info" style={{ alignItems:'flex-start' }}>
        <span style={{ fontSize:'1rem' }}>💡</span>
        <div>
          <strong>How it works:</strong> Your policy text is sent to the Groq API (LLaMA 3.3 70B) which extracts
          eligibility criteria in structured JSON — fields like <code style={{ fontFamily:'var(--font-mono)', fontSize:'0.8rem', background:'rgba(0,82,204,0.1)', padding:'0 4px', borderRadius:3 }}>income_annual</code>, <code style={{ fontFamily:'var(--font-mono)', fontSize:'0.8rem', background:'rgba(0,82,204,0.1)', padding:'0 4px', borderRadius:3 }}>rural_urban</code>, <code style={{ fontFamily:'var(--font-mono)', fontSize:'0.8rem', background:'rgba(0,82,204,0.1)', padding:'0 4px', borderRadius:3 }}>age</code> — that map to citizen dataset attributes.
        </div>
      </div>
    </div>
  )
}
