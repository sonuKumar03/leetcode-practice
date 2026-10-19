const BASE_URL = import.meta.env.VITE_API_URL || '';

export const AUTH_TOKEN_KEY = 'auth_token';

export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    clearAuthToken();
    window.dispatchEvent(new Event('auth:unauthorized'));
  }

  if (!response.ok) {
    let errorDetail = `API Error ${response.status}`;
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson);
    } catch {
      const errorBody = await response.text();
      if (errorBody) errorDetail = errorBody;
    }
    throw new Error(errorDetail);
  }

  return response.json();
}
