import api from './api';   // your Axios instance with JWT interceptor

// ── POST /api/parse-policy ─────────────────────────────────────────────────
// Sends plain text → backend calls Claude API → returns parsed rules
// Returns: { understood_as: string, rules: Rule[] }
export const parsePolicy = async (policy_text) => {
  const { data } = await api.post('/api/parse-policy', { policy_text });
  return data;
};

// ── POST /api/parse-policy/document ───────────────────────────────────────
// Sends a PDF or DOCX file as FormData → backend extracts text, calls Claude API
// formData must contain: document (file), notes (string, optional)
// Returns: { understood_as: string, rules: Rule[] }
export const parsePolicyDocument = async (formData) => {
  const { data } = await api.post('/api/parse-policy/document', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
};

// ── POST /api/simulate ─────────────────────────────────────────────────────
// Sends confirmed rules → runs simulation on 10,000 citizen records
// Returns: { simulation_id, policy_title, total_population,
//            eligible_count, excluded_count, coverage_percent, created_at }
export const runSimulation = async (policy_title, rules) => {
  const { data } = await api.post('/api/simulate', { policy_title, rules });
  return data;
};

// ── GET /api/simulations/:id ───────────────────────────────────────────────
// Fetches a previously saved simulation result by ID
export const getSimulation = async (id) => {
  const { data } = await api.get(`/api/simulations/${id}`);
  return data;
};