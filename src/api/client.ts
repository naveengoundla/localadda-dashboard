import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8081';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // send/receive the httpOnly refresh cookie
});

// Decode JWT payload and check if it's expired (client-side, no crypto needed)
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now(); // exp is seconds, Date.now() is ms
  } catch {
    return true; // malformed → treat as expired
  }
}

// Pick the storage slot from the token's role claim (admin vs owner).
function storeKeyForToken(token: string): 'adminToken' | 'token' {
  try {
    return JSON.parse(atob(token.split('.')[1])).role === 'ADMIN' ? 'adminToken' : 'token';
  } catch {
    return 'token';
  }
}

// Exchange the refresh cookie for a fresh access token. Deduped so concurrent
// 401s trigger a single refresh. Uses a bare axios call to avoid interceptor recursion.
let refreshing: Promise<string | null> | null = null;
function refreshAccess(): Promise<string | null> {
  if (!refreshing) {
    refreshing = axios
      .post(`${baseURL}/api/auth/refresh`, {}, { withCredentials: true })
      .then((res) => {
        const token: string = res.data.token;
        localStorage.setItem(storeKeyForToken(token), token);
        return token;
      })
      .catch(() => null)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

// Attach the right access token. (Presence-based; expiry is handled reactively
// on 401/403 so a still-valid refresh cookie can transparently renew it.)
api.interceptors.request.use((config) => {
  const isAdminRoute = (config.url || '').startsWith('/api/admin');
  const token = localStorage.getItem(isAdminRoute ? 'adminToken' : 'token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On an auth failure, try refresh-and-retry once; otherwise clear and go to login.
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const config = err.config || {};
    const status = err.response?.status;
    const url: string = config.url || '';
    const isAuthCall = url.includes('/api/auth/refresh') || url.includes('/api/auth/logout');
    const isAdminRoute = url.startsWith('/api/admin');
    const loginPath = isAdminRoute ? '/admin/login' : '/login';

    if ((status === 401 || status === 403) && !config._retry && !isAuthCall) {
      const current = localStorage.getItem(isAdminRoute ? 'adminToken' : 'token');
      // Only an expired/missing token is a refresh candidate; a valid token that
      // is still forbidden is a genuine 403 → don't loop, just bounce to login.
      if (!current || isTokenExpired(current)) {
        config._retry = true;
        const token = await refreshAccess();
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
          return api(config);
        }
      }
    }

    if (status === 401 || status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('adminToken');
      if (!isAuthCall) window.location.href = loginPath;
    }
    return Promise.reject(err);
  }
);

export default api;
