const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

function getToken() {
  return localStorage.getItem('token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  } catch (err) {
    throw new Error(`Cannot reach backend at ${BASE_URL}. Make sure your server is running. (${err.message})`)
  }

  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    return
  }

  let data
  try { data = await res.json() } catch { throw new Error(`Non-JSON response (${res.status})`) }
  if (!res.ok) throw new Error(data.message || data.error || `Request failed (${res.status})`)
  return data
}

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const authApi = {
  register: async (payload) => {
    const res = await request('/api/users/signup', { method: 'POST', body: JSON.stringify(payload) })
    const loginRes = await request('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ email: payload.email, password: payload.password }),
    })
    return {
      token: loginRes.token,
      user: res.data || { name: payload.name, email: payload.email, department: payload.department },
    }
  },

  login: async (payload) => {
    const res = await request('/api/users/login', { method: 'POST', body: JSON.stringify(payload) })
    const user = { email: payload.email, name: payload.email.split('@')[0] }
    return { token: res.token, user }
  },
}

// ── POLICY PARSING ────────────────────────────────────────────────────────────
// Backend expects: { policy_text }
// Backend returns: { understood_as, rules: [{field, operator, value, label}] }
export const policyApi = {
  parseText: (policy_text) =>
    request('/api/parse-policy', {
      method: 'POST',
      body: JSON.stringify({ policy_text }),
    }),

  parseFile: async (file) => {
    const token = getToken()
    const form = new FormData()
    form.append('document', file)
    let res
    try {
      res = await fetch(`${BASE_URL}/api/parse-policy/document`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
    } catch (err) {
      throw new Error(`Cannot reach backend. (${err.message})`)
    }
    if (res.status === 401) { localStorage.removeItem('token'); window.location.href = '/login'; return }
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'File parse failed')
    return data
  },
}

// ── SIMULATION ────────────────────────────────────────────────────────────────
// Backend expects: { policy_text, rules }
// Backend returns: { total_population, eligible_count, excluded_count, coverage_percent, breakdowns }
export const simulationApi = {
  run: (policy_text, rules) =>
    request('/api/simulate', {
      method: 'POST',
      body: JSON.stringify({ policy_text, rules }),
    }),
}

// ── CITIZENS ──────────────────────────────────────────────────────────────────
export const citizenApi = {
  getAll: () => request('/api/citizens/citizen'),
  getLimited: (limit = 50) => request(`/api/citizens/limitedCitizens?limit=${limit}`),
}
