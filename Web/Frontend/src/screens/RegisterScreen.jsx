import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function RegisterScreen() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }))
    if (error) setError('')
  }

  async function handleSubmit(e) {
  e.preventDefault()
  if (!form.name || !form.email || !form.password) {
    setError('Name, email and password are required.')
    return
  }
  if (form.password.length < 6) {
    setError('Password must be at least 6 characters.')
    return
  }
  setLoading(true)
  setError('')
  try {
    const payload = { ...form }
    if (!payload.department) payload.department = 'General'  // ← add this
    const data = await authApi.register(payload)
    login(data.token, data.user)
    navigate('/dashboard')
  } catch (err) {
    setError(err.message || 'Registration failed. Please try again.')
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="auth-shell">
      <div className="auth-left">
        <div className="auth-left-logo">
          <div className="auth-left-logo-icon">📋</div>
          <div className="auth-left-logo-text">PolicySim</div>
        </div>
        <div>
          <h1 className="auth-left-headline">
            Join the platform for <em>smarter governance</em>
          </h1>
          <p style={{ color:'rgba(255,255,255,0.7)', fontSize:'0.9rem', marginTop:'1rem', lineHeight:1.7, maxWidth:360 }}>
            Create your account and start simulating the real-world impact of government policies in minutes.
          </p>
        </div>
        <div className="auth-left-footer">ISE Course Project · Team 6 · 2025</div>
      </div>

      <div className="auth-right">
        <div className="auth-form-card fade-in">
          <h2 className="auth-form-title">Create account</h2>
          <p className="auth-form-sub">Register to access the Policy Impact Simulator</p>

          {error && (
            <div className="alert alert-error">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full name</label>
              <input
                id="name"
                type="text"
                className="form-input"
                placeholder="Dr. Priya Sharma"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-email">Email address</label>
              <input
                id="reg-email"
                type="email"
                className="form-input"
                placeholder="priya@gov.in"
                value={form.email}
                onChange={e => set('email', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="department">Department <span style={{ fontWeight:400, textTransform:'none', letterSpacing:0, color:'var(--ink-4)' }}>(optional)</span></label>
              <input
                id="department"
                type="text"
                className="form-input"
                placeholder="e.g. Ministry of Rural Development"
                value={form.department}
                onChange={e => set('department', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-password">Password</label>
              <input
                id="reg-password"
                type="password"
                className="form-input"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={e => set('password', e.target.value)}
              />
            </div>

            <button
              type="submit"
              className={`btn btn-primary btn-full btn-lg${loading ? ' btn-loading' : ''}`}
              disabled={loading}
              style={{ marginTop:'0.5rem' }}
            >
              {loading ? '' : 'Create account'}
            </button>
          </form>

          <div className="divider-text">or</div>
          <p style={{ textAlign:'center', fontSize:'0.88rem', color:'var(--ink-3)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'var(--accent)', fontWeight:600, textDecoration:'none' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
