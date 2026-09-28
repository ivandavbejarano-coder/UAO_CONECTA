export type AuthUser = {
  user_id: string;
  email: string;
  name: string;
  picture?: string | null;
  custom_username?: string | null;
  program?: string | null;
};

export const PROGRAMS = [
  'Ingeniería Ambiental',
  'Ingeniería Biomédica',
  'Ingeniería de Datos e Inteligencia Artificial',
  'Ingeniería Eléctrica',
  'Ingeniería Industrial',
  'Ingeniería Informática',
  'Ingeniería Mecánica',
  'Ingeniería Mecatrónica',
];

export const API = process.env.REACT_APP_BACKEND_URL as string;

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    ...init,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).detail || `HTTP ${res.status}`);
  return res.json();
}

export const authApi = {
  me: () => req<AuthUser>('/api/auth/me'),
  exchangeSession: (session_id: string) =>
    req<{ user: AuthUser }>('/api/auth/session', { method: 'POST', body: JSON.stringify({ session_id }) }),
  setUsername: (custom_username: string, program?: string) =>
    req<AuthUser>('/api/auth/username', { method: 'POST', body: JSON.stringify({ custom_username, program }) }),
  logout: () => req<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
};
