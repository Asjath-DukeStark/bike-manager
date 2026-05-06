/**
 * api.ts — Centralized API client for the Bike Manager backend.
 *
 * All requests automatically attach the JWT token from localStorage.
 * The base URL switches between local dev and production automatically.
 */

// In production (Vercel), set VITE_API_URL to your Railway backend URL.
// e.g. https://bike-manager-backend.up.railway.app
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const TOKEN_KEY = 'bikeManager_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.error || `Request failed with status ${response.status}`);
  }

  return json.data as T;
}

// ─── Auth ──────────────────────────────────────────────────────────────────────
export const auth = {
  login: (username: string, pin: string) =>
    request<{ token: string }>('POST', '/api/auth/login', { username, pin }),
};

// ─── Bikes ─────────────────────────────────────────────────────────────────────
export const bikes = {
  getAll: () => request<unknown[]>('GET', '/api/bikes'),
  getOne: (id: string) => request<unknown>('GET', `/api/bikes/${id}`),
  create: (bike: unknown) => request<unknown>('POST', '/api/bikes', bike),
  update: (id: string, bike: unknown) => request<unknown>('PUT', `/api/bikes/${id}`, bike),
  delete: (id: string) => request<{ message: string }>('DELETE', `/api/bikes/${id}`),
  sell: (id: string, saleData: unknown) => request<unknown>('POST', `/api/bikes/${id}/sell`, saleData),
};

// ─── Images ────────────────────────────────────────────────────────────────────
export const images = {
  upload: async (file: File): Promise<string> => {
    const token = getToken();
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/api/images/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });

    const json = await response.json();
    if (!response.ok) throw new Error(json.error || 'Image upload failed.');
    return (json.data as { url: string }).url;
  },
};

// ─── Reports ───────────────────────────────────────────────────────────────────
export const reports = {
  getSummary: () => request<unknown>('GET', '/api/reports/summary'),
};
