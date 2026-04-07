import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function LoginScreen() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }))
    if (error) setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.email || !form.password) {
      setError('Please fill in all fields.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await authApi.login(form)
      login(data.token, data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      {/* LEFT PANEL */}
      <div className="auth-left">
        <div className="auth-left-logo">
          <div className="auth-left-logo-icon">📋</div>
          <div className="auth-left-logo-text">PolicySim</div>
        </div>

        <div>
          <h1 className="auth-left-headline">
            Turn policy text into <em>structured impact</em>
          </h1>
          <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'0.9rem', marginTop:'1rem', maxWidth:380, lineHeight:1.7 }}>
            An AI-powered platform that extracts eligibility rules from government policies
            and simulates their real-world impact across citizen datasets.
          </p>

          <div style={{ marginTop:'2rem', display:'flex', flexDirection:'column', gap:'0.8rem' }}>
            {[
              'Parse policies from text or PDF/DOCX',
              'AI-extracted, schema-validated rules',
              'Simulate impact on 100+ citizen records',
              'State-wise breakdown across India',
            ].map(f => (
              <div key={f} style={{ display:'flex', alignItems:'center', gap:'0.6rem', color:'rgba(255,255,255,0.85)', fontSize:'0.85rem' }}>
                <span style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.5)' }}>✓</span>
                {f}
              </div>
            ))}
          </div>
        </div>

        <div className="auth-left-footer">
          ISE Course Project · Team 6 · 2025
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="auth-right">
        <div className="auth-form-card fade-in">
          <h2 className="auth-form-title">Sign in</h2>
          <p className="auth-form-sub">Enter your credentials to access the simulator</p>

          {error && (
            <div className="alert alert-error">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className={`btn btn-primary btn-full btn-lg${loading ? ' btn-loading' : ''}`}
              disabled={loading}
              style={{ marginTop:'0.5rem' }}
            >
              {loading ? '' : 'Sign in'}
            </button>
          </form>

          <div className="divider-text">or</div>

          <p style={{ textAlign:'center', fontSize:'0.88rem', color:'var(--ink-3)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color:'var(--accent)', fontWeight:600, textDecoration:'none' }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
