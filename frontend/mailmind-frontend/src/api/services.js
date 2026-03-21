import api from './axios'

// ─── Auth ────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login:    (data) => api.post('/api/auth/login', data),
  health:   ()     => api.get('/api/auth/health'),
}

// ─── Campaigns ───────────────────────────────────────────
export const campaignAPI = {
  create:          (data)        => api.post('/api/campaigns', data),
  getAll:          ()            => api.get('/api/campaigns'),
  getById:         (id)          => api.get(`/api/campaigns/${id}`),
  getVariations:   (id)          => api.get(`/api/campaigns/${id}/variations`),
  selectVariation: (variationId) => api.put(`/api/campaigns/variations/${variationId}/select`),
  updateStatus:    (id, status)  => api.put(`/api/campaigns/${id}/status`, { status }),
  delete:          (id)          => api.delete(`/api/campaigns/${id}`),
}

// ─── Smart Reply ─────────────────────────────────────────
export const smartReplyAPI = {
  generate: (data) => api.post('/api/smart-reply/generate', data),
  history:  ()     => api.get('/api/smart-reply/history'),
  delete:   (id)   => api.delete(`/api/smart-reply/${id}`),
}

// ─── Analytics ───────────────────────────────────────────
export const analyticsAPI = {
  overview: () => api.get('/api/analytics/overview'),
}
