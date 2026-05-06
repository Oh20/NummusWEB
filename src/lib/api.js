const BASE_URL = import.meta.env.VITE_API_URL

async function request(path, options = {}, token) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Erro inesperado')
  }

  if (res.status === 204) return null
  return res.json()
}

// ── Earnings ──────────────────────────────────────────────────────────────────

export const earningsApi = {
  list:   (token, month)        => request(`/earnings${month ? `?month=${month}` : ''}`, {}, token),
  get:    (token, id)           => request(`/earnings/${id}`, {}, token),
  create: (token, body)         => request('/earnings', { method: 'POST', body: JSON.stringify(body) }, token),
  update: (token, id, body)     => request(`/earnings/${id}`, { method: 'PUT', body: JSON.stringify(body) }, token),
  remove: (token, id)           => request(`/earnings/${id}`, { method: 'DELETE' }, token),
}

// ── Expenses ──────────────────────────────────────────────────────────────────

export const expensesApi = {
  list:    (token, month, cat)  => request(`/expenses${buildQuery({ month, category: cat })}`, {}, token),
  get:     (token, id)          => request(`/expenses/${id}`, {}, token),
  create:  (token, body)        => request('/expenses', { method: 'POST', body: JSON.stringify(body) }, token),
  update:  (token, id, body)    => request(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(body) }, token),
  remove:  (token, id)          => request(`/expenses/${id}`, { method: 'DELETE' }, token),
  summary: (token, month)       => request(`/expenses/summary?month=${month}`, {}, token),
}

function buildQuery(params) {
  const q = Object.entries(params)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&')
  return q ? `?${q}` : ''
}