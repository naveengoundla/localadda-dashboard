import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081',
  headers: { 'Content-Type': 'application/json' },
});

// Attach the right JWT — admin routes use adminToken, everything else uses token
api.interceptors.request.use((config) => {
  const url = config.url || '';
  const isAdminRoute = url.startsWith('/api/admin');
  const token = isAdminRoute
    ? localStorage.getItem('adminToken')
    : localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401/403 — redirect to the right login page
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 || err.response?.status === 403) {
      const url = err.config?.url || '';
      if (url.startsWith('/api/admin')) {
        localStorage.removeItem('adminToken');
        window.location.href = '/admin/login';
      } else {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
