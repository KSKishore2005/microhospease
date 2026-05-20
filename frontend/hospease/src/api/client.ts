import axios from 'axios';

/** Lazily read token from Zustand persist store to avoid circular imports */
function getToken(): string | null {
  try {
    const raw = localStorage.getItem('hospease-auth');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state?.token ?? null;
  } catch {
    return null;
  }
}

const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,   // 15s — services may be slow to start
});

// ── Request interceptor — attach JWT ─────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    // Guard against stale mock tokens from dev sessions
    if (token === 'mock-jwt-token') {
      localStorage.removeItem('hospease-auth');
      window.location.href = '/login';
      return Promise.reject(new Error('Stale mock token cleared'));
    }
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (err) => Promise.reject(err)
);

// ── Response interceptor — handle 401 / extract errors ───
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('hospease-auth');
      window.location.href = '/login';
    }
    // Provide a friendlier error message
    const message =
      err.response?.data?.message ??
      err.response?.data?.error ??
      err.message ??
      'An unexpected error occurred';
    err.userMessage = message;
    return Promise.reject(err);
  }
);

export default apiClient;
