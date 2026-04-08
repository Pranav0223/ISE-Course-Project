// ─────────────────────────────────────────────────────────
//  API SERVICE  –  connects to your Node.js + Express backend
//  Local dev: http://localhost:5000 (set in .env as VITE_API_URL)
// ─────────────────────────────────────────────────────────

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

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
  } catch (networkErr) {
    throw new Error(
      `Cannot reach backend at ${BASE_URL}. ` +
      `Make sure your Backend server is running (node app.js) and CORS is added. ` +
      `(${networkErr.message})`
    )
  }

  if (res.status === 401) {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/login'
    return
  }

  let data
  try {
    data = await res.json()
  } catch {
    throw new Error(`Server returned non-JSON response (status ${res.status})`)
  }

  if (!res.ok) {
    throw new Error(data.message || data.error || `Request failed (${res.status})`)
  }

  return data
}

// ── AUTH ────────────────────────────────────────────────
// Your backend signup returns: { message, data: userObject }
// Your backend login returns:  { message, token }
// We normalise both into { token, user } for the frontend.

export const authApi = {
  // POST /api/users/signup  →  { message, data: {...user} }
  register: async (payload) => {
    const res = await request('/api/users/signup', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    // After signup, auto-login to get a token
    const loginRes = await request('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ email: payload.email, password: payload.password }),
    })
    return {
      token: loginRes.token,
      user: res.data || { name: payload.name, email: payload.email, department: payload.department },
    }
  },

  // POST /api/users/login  →  { message, token }
  login: async (payload) => {
    const res = await request('/api/users/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    // Backend only returns token; build a minimal user object from the payload
    // so the sidebar can show the name after login
    const user = { email: payload.email, name: payload.email.split('@')[0] }
    return { token: res.token, user }
  },
}

// ── POLICY PARSING ──────────────────────────────────────
export const policyApi = {
  // POST /api/parse-policy  →  { rules: [{field, operator, value}] }
  parseText: (policyText) =>
    request('/api/parse-policy', {
      method: 'POST',
      body: JSON.stringify({ policyText }),
    }),

  // POST /api/parse-policy  (multipart with file) →  { rules }
  parseFile: async (file) => {
    const token = getToken()
    const form = new FormData()
    form.append('file', file)
    let res
    try {
      res = await fetch(`${BASE_URL}/api/parse-policy`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      })
    } catch (networkErr) {
      throw new Error(`Cannot reach backend at ${BASE_URL}. Make sure your server is running.`)
    }
    if (res.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
      return
    }
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'File parse failed')
    return data
  },
}

// ── SIMULATION ──────────────────────────────────────────
export const simulationApi = {
  run: (rules) =>
    request('/api/simulate', {
      method: 'POST',
      body: JSON.stringify({ rules }),
    }),
}

// ── CITIZENS ────────────────────────────────────────────
export const citizenApi = {
  getAll: () => request('/api/citizens'),
  getById: (id) => request(`/api/citizens/${id}`),
  getLimited: (limit = 20) => request(`/api/citizens?limit=${limit}`),
}
