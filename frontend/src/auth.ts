export type AuthUser = {
  user_id: string;
  email: string;
  name: string;
  picture?: string | null;
  custom_username?: string | null;
  program?: string | null;
  role?: 'Estudiante' | 'Monitor' | 'Profesor' | null;
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

export async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(typeof body.detail === 'string' ? body.detail : 'Revisa los campos e intenta de nuevo.');
  }
  return res.json();
}

export const authApi = {
  me: () => req<AuthUser>('/api/auth/me'),
  exchangeSession: (session_id: string) =>
    req<{ user: AuthUser }>('/api/auth/session', { method: 'POST', body: JSON.stringify({ session_id }) }),
  setUsername: (custom_username: string, program?: string, role?: AuthUser['role']) =>
    req<AuthUser>('/api/auth/username', { method: 'POST', body: JSON.stringify({ custom_username, program, role }) }),
  logout: () => req<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),
};
