export const sessionKey = 'ivy-session';

export const getSession = () => JSON.parse(localStorage.getItem(sessionKey) || 'null');
export const saveSession = session => localStorage.setItem(sessionKey, JSON.stringify(session));
export const clearSession = () => localStorage.removeItem(sessionKey);

async function refreshSession(session) {
  const response = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: session.refresh_token })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.access_token) throw new Error(data.detail || 'Your session has expired. Please sign in again.');
  saveSession(data);
  return data;
}

export async function request(path, options = {}, retried = false) {
  const session = getSession();
  const response = await fetch(`/api/${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...options.headers
    }
  });
  const data = await response.json().catch(() => ({}));
  if (response.status === 401 && session?.refresh_token && !retried) {
    await refreshSession(session);
    return request(path, options, true);
  }
  if (!response.ok) throw new Error(Array.isArray(data.detail) ? data.detail.map(x => x.msg).join(', ') : data.detail || 'Request failed');
  return data;
}
