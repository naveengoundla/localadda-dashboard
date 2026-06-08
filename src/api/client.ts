import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8081',
  headers: { 'Content-Type': 'application/json' },
});

// Decode JWT payload and check if it's expired (client-side, no crypto needed)
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // exp is in seconds, Date.now() is in ms
    return payload.exp * 1000 < Date.now();
  } catch {
    return true; // malformed token → treat as expired
  }
}

// Attach the right JWT — admin routes use adminToken, everything else uses token
// Clears token and redirects before making the request if already expired
api.interceptors.request.use((config) => {
  const url = config.url || '';
  const isAdminRoute = url.startsWith('/api/admin');
  const storageKey = isAdminRoute ? 'adminToken' : 'token';
  const loginPath = isAdminRoute ? '/admin/login' : '/login';
  const token = localStorage.getItem(storageKey);

  if (token) {
    if (isTokenExpired(token)) {
      localStorage.removeItem(storageKey);
      window.location.href = loginPath;
      return Promise.reject(new Error('Session expired. Please log in again.'));
    }
    config.headers.Authorization = `Bearer ${token}`;
  }
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
