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

export async function uploadImage(file) {
  if (!file?.type.startsWith('image/')) throw new Error('Please choose an image file.');
  if (file.size > 10 * 1024 * 1024) throw new Error('Images must be 10 MB or smaller.');

  const credentials = await request('uploads/signature', { method: 'POST' });
  const form = new FormData();
  form.append('file', file);
  form.append('api_key', credentials.api_key);
  form.append('timestamp', String(credentials.timestamp));
  form.append('folder', credentials.folder);
  form.append('signature', credentials.signature);
  const response = await fetch(`https://api.cloudinary.com/v1_1/${credentials.cloud_name}/image/upload`, { method: 'POST', body: form });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error?.message || 'Image upload failed.');
  return data.secure_url;
}
