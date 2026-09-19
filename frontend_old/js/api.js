/**
 * api.js — Typed fetch wrapper for Karigar AI backend
 * When served via FastAPI at http://localhost:8000, all paths are relative.
 */

const API_BASE = '';  // served from same origin as backend

const api = {
  async get(path) {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) throw new Error(`GET ${path} → ${res.status} ${res.statusText}`);
    return res.json();
  },

  async post(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `POST ${path} → ${res.status}`);
    }
    return res.json();
  },

  async postForm(path, formData) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `POST ${path} → ${res.status}`);
    }
    return res.json();
  },

  async put(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `PUT ${path} → ${res.status}`);
    }
    return res.json();
  },

  async delete(path) {
    const res = await fetch(`${API_BASE}${path}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `DELETE ${path} → ${res.status}`);
    }
    return res.status === 204 ? null : res.json();
  },

  // --- Specific API methods ---

  health: () => api.get('/health'),
  dashboard: (artisanId) => api.get('/api/dashboard' + (artisanId ? `?artisan_id=${artisanId}` : '')),
  orders: (artisanId) => api.get('/api/orders' + (artisanId ? `?artisan_id=${artisanId}` : '')),
  earnings: (artisanId) => api.get('/api/earnings' + (artisanId ? `?artisan_id=${artisanId}` : '')),

  listArtisans: () => api.get('/api/artisans'),
  getArtisan: (id) => api.get(`/api/artisans/${id}`),
  createArtisan: (payload) => api.post('/api/artisans', payload),

  listProducts: (artisanId, status) => {
    const params = new URLSearchParams();
    if (artisanId) params.set('artisan_id', artisanId);
    if (status)    params.set('status_filter', status);
    const qs = params.toString();
    return api.get('/api/products' + (qs ? `?${qs}` : ''));
  },
  getProduct: (id) => api.get(`/api/products/${id}`),
  createProduct: (payload) => api.post('/api/products', payload),
  updateProduct: (id, payload) => api.put(`/api/products/${id}`, payload),
  deleteProduct: (id) => api.delete(`/api/products/${id}`),

  enhanceImage: (formData) => api.postForm('/api/image/enhance', formData),

  transcribeSpeech: (formData) => api.postForm('/api/speech/transcribe', formData),

  translate: (text, sourceLang, targetLang, productId) =>
    api.post('/api/translate', { text, source_lang: sourceLang, target_lang: targetLang, product_id: productId || null }),

  imageUrl: (path) => path ? `${path}` : null,
};
