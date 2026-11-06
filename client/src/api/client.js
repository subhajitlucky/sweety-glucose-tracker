const configuredBase = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const API_BASE = configuredBase ? `${configuredBase}/api` : '/api';

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body, headers } = {}) {
  const options = {
    method,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...headers,
    },
  };

  if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, options);
  } catch {
    throw new ApiError(
      'Could not reach the server. Check your connection and try again.',
      0,
    );
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  let payload = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    if (response.status === 401 && !path.startsWith('/auth/login')) {
      window.dispatchEvent(new Event('sweety:unauthorized'));
    }
    throw new ApiError(
      payload?.message || 'Something went wrong. Please try again.',
      response.status,
      payload?.details,
    );
  }

  return payload;
}

export const api = {
  auth: {
    me: () => request('/auth/me'),
    login: (credentials) => request('/auth/login', {
      method: 'POST',
      body: credentials,
    }),
    register: (details) => request('/auth/register', {
      method: 'POST',
      body: details,
    }),
    logout: () => request('/auth/logout', { method: 'POST' }),
  },
  readings: {
    list: ({ page = 1, limit = 8 } = {}) => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      return request(`/readings?${params.toString()}`);
    },
    create: (reading) => request('/readings', {
      method: 'POST',
      body: reading,
    }),
    update: (id, reading) => request(`/readings/${id}`, {
      method: 'PUT',
      body: reading,
    }),
    remove: (id) => request(`/readings/${id}`, { method: 'DELETE' }),
  },
  reports: {
    get: (date) => request(`/reports?date=${encodeURIComponent(date)}`),
  },
};
