import React, { useState, useEffect } from 'react'
import { citizenApi } from '../services/api'

export default function CitizensScreen() {
  const [citizens, setCitizens] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterRural, setFilterRural] = useState('all')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const data = await citizenApi.getAll()
        // Handle array directly or wrapped in { citizens: [...] }
        setCitizens(Array.isArray(data) ? data : (data.citizens || data.data || []))
      } catch (err) {
        setError(err.message || 'Failed to load citizens. Is your backend running?')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filtered = citizens.filter(c => {
    const matchSearch = !search ||
      (c.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.state || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.occupation || '').toLowerCase().includes(search.toLowerCase())
    const matchRural = filterRural === 'all' || c.rural_urban === filterRural
    return matchSearch && matchRural
  })

  return (
    <div className="fade-in">
      {/* FILTERS */}
      <div style={{ display:'flex', gap:'0.8rem', marginBottom:'1.5rem', flexWrap:'wrap', alignItems:'center' }}>
        <input
          type="text"
          className="form-input"
          style={{ maxWidth:280, marginBottom:0 }}
          placeholder="Search by name, state, occupation…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div style={{ display:'flex', background:'var(--white)', border:'1px solid var(--border)', borderRadius:6, overflow:'hidden' }}>
          {[['all','All'],['Rural','Rural'],['Urban','Urban']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilterRural(val)}
              style={{
                background: filterRural === val ? 'var(--accent)' : 'transparent',
                border:'none', borderRight:'1px solid var(--border)',
                color: filterRural === val ? '#fff' : 'var(--ink-2)',
                padding:'0.45rem 1rem', fontSize:'0.8rem', fontWeight:600,
                cursor:'pointer', fontFamily:'var(--font-sans)',
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ marginLeft:'auto', fontSize:'0.8rem', color:'var(--ink-3)' }}>
          {loading ? 'Loading…' : `${filtered.length} of ${citizens.length} citizens`}
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>⚠</span>
          <div>
            {error}
            <div style={{ marginTop:'0.3rem', fontSize:'0.78rem' }}>
              Make sure your backend is running and the <code style={{ fontFamily:'var(--font-mono)' }}>VITE_API_URL</code> is set correctly in <code style={{ fontFamily:'var(--font-mono)' }}>.env</code>.
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card">
          <div className="card-body" style={{ textAlign:'center', padding:'3rem', color:'var(--ink-3)', fontSize:'0.88rem' }}>
            Loading citizens from backend…
          </div>
        </div>
      ) : citizens.length === 0 && !error ? (
        <div className="card">
          <div className="card-body" style={{ textAlign:'center', padding:'3rem' }}>
            <div style={{ fontSize:'2rem', marginBottom:'0.8rem' }}>👥</div>
            <div style={{ fontWeight:600, marginBottom:'0.4rem' }}>No citizens found</div>
            <div style={{ color:'var(--ink-3)', fontSize:'0.85rem' }}>
              Your backend returned an empty dataset. Check your MongoDB collection.
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div style={{ overflowX:'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Gender</th>
                  <th>State</th>
                  <th>Occupation</th>
                  <th>Income (₹/yr)</th>
                  <th>Rural/Urban</th>
                  <th>BPL</th>
                  <th>Family Size</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 100).map((c, i) => (
                  <tr key={c._id || c.id || i}>
                    <td style={{ color:'var(--ink-4)' }}>{i + 1}</td>
                    <td style={{ fontWeight:500, color:'var(--ink)' }}>{c.name || '—'}</td>
                    <td>{c.age ?? '—'}</td>
                    <td>{c.gender || '—'}</td>
                    <td>{c.state || '—'}</td>
                    <td>{c.occupation || '—'}</td>
                    <td>{c.income_annual != null ? c.income_annual.toLocaleString('en-IN') : '—'}</td>
                    <td>
                      <span className={`badge ${c.rural_urban === 'Rural' ? 'badge-green' : 'badge-amber'}`}>
                        {c.rural_urban || '—'}
                      </span>
                    </td>
                    <td>
                      {c.bpl_status === true || c.bpl_status === 'true'
                        ? <span className="badge badge-red">BPL</span>
                        : <span style={{ color:'var(--ink-4)', fontSize:'0.8rem' }}>—</span>
                      }
                    </td>
                    <td>{c.family_size ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filtered.length > 100 && (
            <div style={{ padding:'0.8rem 1rem', borderTop:'1px solid var(--border)', fontSize:'0.78rem', color:'var(--ink-3)' }}>
              Showing first 100 of {filtered.length} results. Use search to narrow down.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
