import React, { useState, useEffect } from 'react'
import { citizenApi } from '../services/api'

export default function CitizensScreen() {
  const [citizens, setCitizens] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterRural, setFilterRural] = useState('all')
  const [filterBPL, setFilterBPL] = useState('all')
  const [sortField, setSortField] = useState('citizen_id')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
  const PER_PAGE = 15

  useEffect(() => {
    citizenApi.getAll()
      .then(data => setCitizens(Array.isArray(data) ? data : (data.citizens || data.data || [])))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  function handleSort(f) {
    if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(f); setSortDir('asc') }
    setPage(1)
  }

  const filtered = citizens
    .filter(c => {
      const s = search.toLowerCase()
      const ms = !s || String(c.citizen_id||'').includes(s) || (c.state||'').toLowerCase().includes(s) || (c.occupation||'').toLowerCase().includes(s) || (c.social_category||'').toLowerCase().includes(s)
      return ms && (filterRural === 'all' || c.rural_urban === filterRural) && (filterBPL === 'all' || c.bpl_status === filterBPL)
    })
    .sort((a, b) => {
      const av = a[sortField], bv = b[sortField]
      if (typeof av === 'number') return sortDir === 'asc' ? av - bv : bv - av
      return sortDir === 'asc' ? String(av||'').localeCompare(String(bv||'')) : String(bv||'').localeCompare(String(av||''))
    })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const rows = filtered.slice((page-1)*PER_PAGE, page*PER_PAGE)

  const Th = ({ field, children }) => (
    <th onClick={() => handleSort(field)} style={{ cursor: 'pointer' }}>
      {children} {sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : <span style={{ opacity: 0.3 }}>↕</span>}
    </th>
  )

  return (
    <div className="fade-in" style={{ maxWidth: 1100 }}>
      <div className="page-header">
        <h1>Citizens Dataset</h1>
        <p>Browse and filter the citizen records used for policy simulation</p>
      </div>

      {/* Quick Stats */}
      {!loading && citizens.length > 0 && (
        <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: '1rem' }}>
          {[
            { label: 'Total Records', value: citizens.length },
            { label: 'Rural', value: citizens.filter(c => c.rural_urban === 'Rural').length },
            { label: 'BPL', value: citizens.filter(c => c.bpl_status === 'BPL').length },
            { label: 'Showing', value: filtered.length },
          ].map(s => (
            <div className="stat-card" key={s.label}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value" style={{ fontSize: '1.5rem' }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="filter-bar">
        <input className="search-input" placeholder="Search by ID, state, occupation, category..." value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} />
        <div className="filter-group">
          {[['all','All Areas'],['Rural','🌾 Rural'],['Urban','🏙 Urban']].map(([v,l]) => (
            <button key={v} className={`filter-btn${filterRural===v?' active':''}`} onClick={() => { setFilterRural(v); setPage(1) }}>{l}</button>
          ))}
        </div>
        <div className="filter-group">
          {[['all','All Status'],['BPL','BPL'],['APL','APL']].map(([v,l]) => (
            <button key={v} className={`filter-btn${filterBPL===v?' active':''}`} onClick={() => { setFilterBPL(v); setPage(1) }}>{l}</button>
          ))}
        </div>
        <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--ink-3)' }}>{filtered.length} of {citizens.length} records</span>
      </div>

      {error && <div className="alert alert-error"><span>⚠</span><div>{error}<div style={{ marginTop: '0.3rem', fontSize: '0.75rem', opacity: 0.8 }}>Make sure your backend is running.</div></div></div>}

      <div className="card">
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-3)', fontSize: '0.9rem' }}>
            Loading citizen records...
          </div>
        ) : citizens.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">👥</div>
            <h3>No citizens found</h3>
            <p>Check your MongoDB collection has data seeded.</p>
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <Th field="citizen_id">ID</Th>
                    <Th field="age">Age</Th>
                    <Th field="gender">Gender</Th>
                    <Th field="state">State</Th>
                    <Th field="occupation">Occupation</Th>
                    <Th field="income_annual">Income (₹/yr)</Th>
                    <Th field="rural_urban">Area</Th>
                    <Th field="social_category">Category</Th>
                    <Th field="bpl_status">BPL</Th>
                    <Th field="education_level">Education</Th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c, i) => (
                    <tr key={c._id || c.citizen_id || i}>
                      <td style={{ color: 'var(--ink-4)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>#{c.citizen_id}</td>
                      <td style={{ fontWeight: 500 }}>{c.age}</td>
                      <td>{c.gender}</td>
                      <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.state}</td>
                      <td style={{ maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.8rem' }}>{c.occupation}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{c.income_annual != null ? `₹${c.income_annual.toLocaleString('en-IN')}` : '—'}</td>
                      <td><span className={`badge ${c.rural_urban === 'Rural' ? 'badge-green' : 'badge-amber'}`}>{c.rural_urban}</span></td>
                      <td style={{ fontSize: '0.8rem' }}>{c.social_category}</td>
                      <td><span className={`badge ${c.bpl_status === 'BPL' ? 'badge-red' : 'badge-gray'}`}>{c.bpl_status}</span></td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--ink-3)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.education_level}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination">
                <span style={{ fontSize: '0.78rem', color: 'var(--ink-3)', marginRight: 'auto' }}>
                  {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}
                </span>
                <button className="page-text-btn" onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}>← Prev</button>
                {[...Array(Math.min(5, totalPages))].map((_,i) => (
                  <button key={i+1} className={`page-btn${page===i+1?' active':''}`} onClick={() => setPage(i+1)}>{i+1}</button>
                ))}
                {totalPages > 5 && <span style={{ fontSize: '0.75rem', color: 'var(--ink-4)', padding: '0 4px' }}>…{totalPages}</span>}
                <button className="page-text-btn" onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
