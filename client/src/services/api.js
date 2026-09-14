const rawApiUrl = import.meta.env.VITE_API_URL;
const API_BASE = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl.replace(/\/+$/, '')}/api`)
  : '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('secureshield_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, config);
    
    // Handle 401 Unauthorized
    if (res.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/demo')) {
      localStorage.removeItem('secureshield_token');
      localStorage.removeItem('secureshield_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP error ${res.status}`);
    }
    return data;
  } catch (err) {
    console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err.message);
    throw err;
  }
}

export const api = {
  // Auth
  login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  register: (userData) => request('/auth/register', { method: 'POST', body: JSON.stringify(userData) }),
  demoLogin: (role) => request(`/auth/demo/${role}`, { method: 'POST' }),
  getMe: () => request('/auth/me'),
  getUsers: () => request('/auth/users'),

  // Projects
  getProjects: () => request('/projects'),
  getProjectById: (id) => request(`/projects/${id}`),
  createProject: (data) => request('/projects', { method: 'POST', body: JSON.stringify(data) }),
  updateProject: (id, data) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteProject: (id) => request(`/projects/${id}`, { method: 'DELETE' }),

  // Reviews
  getReviews: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/reviews${query ? `?${query}` : ''}`);
  },
  getReviewById: (id) => request(`/reviews/${id}`),
  createReview: (data) => request('/reviews', { method: 'POST', body: JSON.stringify(data) }),
  updateReviewItem: (reviewId, itemId, data) => 
    request(`/reviews/${reviewId}/items/${itemId}`, { method: 'PUT', body: JSON.stringify(data) }),
  bulkUpdateReviewItems: (reviewId, data) => 
    request(`/reviews/${reviewId}/bulk-update`, { method: 'POST', body: JSON.stringify(data) }),
  updateReviewStatus: (id, data) => 
    request(`/reviews/${id}/status`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteReview: (id) => request(`/reviews/${id}`, { method: 'DELETE' }),
  getReviewAuditLogs: (id) => request(`/reviews/${id}/audit`),

  // Dashboard
  getAdminDashboard: () => request('/dashboard/admin'),
  getReviewerDashboard: () => request('/dashboard/reviewer'),

  // Master Checklist
  getMasterChecklist: () => request('/checklist/master'),
};
