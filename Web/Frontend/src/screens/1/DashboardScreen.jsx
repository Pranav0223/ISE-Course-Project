import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function DashboardScreen() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  return (
    <div className="fade-in">
      {/* PAGE HEADER */}
      <div style={{ marginBottom:'2rem' }}>
        <h1 style={{ fontFamily:'var(--font-serif)', fontSize:'1.7rem', fontWeight:700, color:'var(--ink)', marginBottom:'0.3rem' }}>
          {greeting}, {user?.name?.split(' ')[0] || 'there'}.
        </h1>
        <p style={{ color:'var(--ink-3)', fontSize:'0.9rem' }}>
          Here's a summary of the Policy Impact Simulator.
        </p>
      </div>

      {/* STAT CARDS */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-label">Citizen Records</div>
          <div className="stat-value">150<span className="stat-unit">+</span></div>
          <div className="stat-change">↑ Dataset loaded</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Rule Operators</div>
          <div className="stat-value">8<span className="stat-unit">+</span></div>
          <div className="stat-change">equals, lt, gt, in_list…</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Parse Accuracy</div>
          <div className="stat-value">90<span className="stat-unit">%+</span></div>
          <div className="stat-change">↑ LLaMA 3.3 70B</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">AI Engine</div>
          <div className="stat-value" style={{ fontSize:'1.1rem', paddingTop:'0.5rem' }}>Groq API</div>
          <div className="stat-change">LLaMA 3.3 · Active</div>
        </div>
      </div>

      {/* QUICK ACTIONS */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem', marginBottom:'2rem' }}>

        <div className="card" style={{ cursor:'pointer' }} onClick={() => navigate('/policy')}>
          <div className="card-body" style={{ display:'flex', gap:'1.2rem', alignItems:'flex-start' }}>
            <div style={{ width:44, height:44, background:'var(--accent-light)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem', flexShrink:0 }}>
              🧠
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:'0.95rem', marginBottom:'0.3rem' }}>Parse a Policy</div>
              <div style={{ color:'var(--ink-3)', fontSize:'0.82rem', lineHeight:1.6 }}>
                Paste government policy text or upload a PDF/DOCX. The AI extracts structured eligibility rules automatically.
              </div>
              <button className="btn btn-ghost btn-sm" style={{ marginTop:'0.8rem', paddingLeft:0 }}>
                Start parsing →
              </button>
            </div>
          </div>
        </div>

        <div className="card" style={{ cursor:'pointer' }} onClick={() => navigate('/simulate')}>
          <div className="card-body" style={{ display:'flex', gap:'1.2rem', alignItems:'flex-start' }}>
            <div style={{ width:44, height:44, background:'var(--success-bg)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem', flexShrink:0 }}>
              ▶
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:'0.95rem', marginBottom:'0.3rem' }}>Run Simulation</div>
              <div style={{ color:'var(--ink-3)', fontSize:'0.82rem', lineHeight:1.6 }}>
                Apply extracted rules to the citizen dataset. Get eligible count, demographic breakdowns, and state-wise analysis.
              </div>
              <button className="btn btn-ghost btn-sm" style={{ marginTop:'0.8rem', paddingLeft:0 }}>
                Run now →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">How the Simulator Works</div>
            <div className="card-sub">Four steps from policy text to impact analysis</div>
          </div>
        </div>
        <div className="card-body">
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'1px', background:'var(--border)', borderRadius:6, overflow:'hidden' }}>
            {[
              { num:'01', title:'Input Policy', desc:'Paste text or upload PDF/DOCX document' },
              { num:'02', title:'AI Extracts Rules', desc:'Groq LLM returns structured JSON rules' },
              { num:'03', title:'Validate Rules', desc:'Schema check against citizen dataset fields' },
              { num:'04', title:'Simulate & Analyse', desc:'Match rules to citizens, compute metrics' },
            ].map(s => (
              <div key={s.num} style={{ background:'var(--white)', padding:'1.3rem 1rem' }}>
                <div style={{ fontFamily:'var(--font-serif)', fontSize:'1.6rem', color:'var(--paper-3)', lineHeight:1, marginBottom:'0.6rem' }}>{s.num}</div>
                <div style={{ fontWeight:700, fontSize:'0.85rem', marginBottom:'0.3rem' }}>{s.title}</div>
                <div style={{ color:'var(--ink-3)', fontSize:'0.78rem', lineHeight:1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TECH STACK */}
      <div style={{ marginTop:'1.5rem' }}>
        <div style={{ fontSize:'0.72rem', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', color:'var(--ink-4)', marginBottom:'0.8rem' }}>
          Built with
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:'0.5rem' }}>
          {[
            { name:'React Native / Expo', color:'#61dafb' },
            { name:'Node.js + Express', color:'#68a063' },
            { name:'MongoDB', color:'#4db33d' },
            { name:'Groq API (LLaMA 3.3)', color:'#f97316' },
            { name:'JWT Auth', color:'#0052cc' },
            { name:'React + Vite', color:'#a78bfa' },
            { name:'pdf2json', color:'#888' },
            { name:'mammoth', color:'#e11d48' },
          ].map(t => (
            <div key={t.name} style={{ display:'flex', alignItems:'center', gap:'0.4rem', background:'var(--white)', border:'1px solid var(--border)', borderRadius:100, padding:'0.3rem 0.8rem', fontSize:'0.78rem', color:'var(--ink-2)' }}>
              <span style={{ width:7, height:7, borderRadius:'50%', background:t.color, display:'inline-block', flexShrink:0 }} />
              {t.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
