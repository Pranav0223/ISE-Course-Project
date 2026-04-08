import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function DashboardScreen() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const name = user?.name?.split(' ')[0] || user?.email?.split('@')[0] || 'there'

  return (
    <div className="fade-in" style={{ maxWidth: 1050 }}>
      {/* Page Header */}
      <div className="page-header">
        <h1>{greeting}, {name} 👋</h1>
        <p>Welcome to the Policy Impact Simulator dashboard.</p>
      </div>

      

      {/* Quick Actions */}
      <div className="section-label">Quick Actions</div>
      <div className="action-grid" style={{ marginBottom: '2rem' }}>
        {[
          { icon: '🧠', title: 'Parse a Policy', desc: 'Paste government policy text or upload PDF/DOCX. AI extracts structured eligibility rules automatically.', cta: 'Start parsing →', to: '/policy' },
          { icon: '▶', title: 'Run Simulation', desc: 'Apply extracted rules to the citizen dataset. Get eligible count, breakdowns by state, gender, and category.', cta: 'Run now →', to: '/simulate' },
          { icon: '👥', title: 'Browse Citizens', desc: 'Explore 150+ citizen records with full attributes — income, state, occupation, BPL status, and more.', cta: 'View dataset →', to: '/citizens' },
          { icon: '📊', title: 'View Results', desc: 'See previous simulation results with demographic breakdowns, state-wise distribution and coverage charts.', cta: 'View results →', to: '/results' },
        ].map(a => (
          <div className="action-card" key={a.title} onClick={() => navigate(a.to)}>
            <div className="action-icon">{a.icon}</div>
            <div>
              <div className="action-title">{a.title}</div>
              <div className="action-desc">{a.desc}</div>
              <span className="action-cta">{a.cta}</span>
            </div>
          </div>
        ))}
      </div>

      {/* How it Works */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <div>
            <div className="card-title">How the Simulator Works</div>
            <div className="card-sub">Four steps from policy text to impact analysis</div>
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="steps-grid">
            {[
              { num: '01', title: 'Input Policy', desc: 'Paste text or upload PDF/DOCX document' },
              { num: '02', title: 'AI Extracts Rules', desc: 'Groq LLM returns structured JSON rules' },
              { num: '03', title: 'Validate Rules', desc: 'Schema check against citizen dataset fields' },
              { num: '04', title: 'Simulate & Analyse', desc: 'Match rules to citizens, compute metrics' },
            ].map(s => (
              <div className="step-box" key={s.num}>
                <div className="step-box-num">{s.num}</div>
                <div className="step-box-title">{s.title}</div>
                <div className="step-box-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Dataset Schema */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <div>
            <div className="card-title">Citizen Dataset Schema</div>
            <div className="card-sub">11 fields the AI maps policy text to when extracting rules</div>
          </div>
        </div>
        <div className="card-body">
          <div className="schema-grid">
            {[
              { field: 'age', type: 'integer', range: '18 – 80' },
              { field: 'gender', type: 'string', range: 'Male / Female / Other' },
              { field: 'income_annual', type: 'integer', range: '₹0 – ₹5,00,000' },
              { field: 'state', type: 'string', range: 'All Indian states' },
              { field: 'rural_urban', type: 'string', range: 'Rural / Urban' },
              { field: 'social_category', type: 'string', range: 'General / OBC / SC / ST' },
              { field: 'occupation', type: 'string', range: 'Farmer, Salaried, Daily Wage…' },
              { field: 'marital_status', type: 'string', range: 'Married / Single / Widowed / Divorced' },
              { field: 'disability', type: 'boolean', range: 'true / false' },
              { field: 'education_level', type: 'string', range: 'No Schooling → Post-Graduate' },
              { field: 'bpl_status', type: 'string', range: 'BPL / APL / AAY' },
            ].map(f => (
              <div className="schema-row" key={f.field}>
                <span className="schema-field">{f.field}</span>
                <span className="schema-type">{f.type}</span>
                <span className="schema-range">{f.range}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      
    </div>
  )
}
