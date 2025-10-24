// Simple API wrapper using fetch
// - Attaches JSON headers and optional Authorization header from localStorage('authToken')
// - Exposes helper functions: get, post, put, del
// BASE_URL priority:
//   1) REACT_APP_API_BASE_URL (if set at build time via .env or Vercel)
//   2) If running on localhost -> http://localhost:8081
//   3) Otherwise -> production backend URL https://furniture-backend-bege.onrender.com
export const BASE_URL = (() => {
  try {
    // Priority 1: Check if REACT_APP_API_BASE_URL is set (from .env or Vercel)
    const env = (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE_URL) || null;
    if (env && String(env).trim()) {
      return String(env).trim().replace(/\/$/, '');
    }
  } catch (_) {
    // ignore
  }
  
  // Priority 2: Auto-detect based on hostname
  try {
    const host = window.location?.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1' || (host && host.endsWith('.local'));
    return isLocal ? 'http://localhost:8081' : 'https://furniture-backend-bege.onrender.com';
  } catch (_) {
    // Priority 3: Fallback to production URL if window is not available (e.g. during build)
    return 'https://furniture-backend-bege.onrender.com';
  }
})();

function buildUrl(path, query) {
  try {
    // Normalize path to string
    if (path == null) return '';
    if (typeof path !== 'string') {
      if (Array.isArray(path)) {
        // If array, take the first element
        path = path[0] ?? '';
      } else if (typeof path === 'object') {
        // Common fields that may contain URL/path
        path = path.url || path.href || path.duongDanHinhAnh || path.path || String(path);
      } else {
        path = String(path);
      }
    }

    if (!path) return '';

    const cleanedBase = String(BASE_URL || '').replace(/\/$/, '');
    const cleanedPath = String(path).replace(/^\//, '');
    const url = cleanedPath.startsWith('http') ? cleanedPath : `${cleanedBase}/${cleanedPath}`;
    if (!query) return url;
    const params = new URLSearchParams(query).toString();
    return params ? `${url}?${params}` : url;
  } catch (e) {
    // On any failure, return empty to avoid throwing in render paths like <img src="">
    return '';
  }
}

let _cachedAuthToken = null;

function authHeader() {
  try {
    const token = _cachedAuthToken ?? localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch (e) {
    return {};
  }
}

function setAuthToken(token) {
  _cachedAuthToken = token;
}

function clearAuthToken() {
  _cachedAuthToken = null;
}

async function request(method, path, { body, query, headers } = {}) {
  const url = buildUrl(path, query);

  // Kiểm tra nếu body là FormData thì không set Content-Type (browser tự set)
  const isFormData = body instanceof FormData;

  const baseHeaders = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...authHeader(),
    ...headers
  };

  const opts = {
    method,
    headers: baseHeaders,
    // include credentials so session cookies set by backend are stored by the browser
    credentials: 'include'
  };

  if (body !== undefined && body !== null) {
    // Nếu là FormData hoặc string thì gửi trực tiếp, không thì JSON.stringify
    opts.body = isFormData || typeof body === 'string' ? body : JSON.stringify(body);
  }

  // Tắt debug logging để giảm lag - chỉ bật khi cần debug
  // console.debug('[api] ->', method, url, { headers: opts.headers, credentials: opts.credentials });

  const res = await fetch(url, opts);

  const contentType = res.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch (e) {
      // Invalid JSON returned despite JSON content-type. Fall back to raw text so callers can inspect.
      try {
        const text = await res.text();
        data = text;
        // console.debug('[api] Warning: invalid JSON response, raw text:', text);
      } catch (tErr) {
        data = null;
      }
    }
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const err = new Error(`HTTP ${res.status} ${res.statusText}`);
    err.status = res.status;
    err.data = data;
    // Chỉ log error khi cần debug
    // console.debug('[api] <- ERROR', method, url, { status: res.status, body: data });
    throw err;
  }

  // Tắt success logging
  // console.debug('[api] <-', method, url, { status: res.status, body: data });

  return data;
}

function normalizeOpts(bodyOrOpts) {
  // If caller passed an options object with keys like body/query/headers, use it.
  if (!bodyOrOpts) return {};
  if (typeof bodyOrOpts === 'object' && ('body' in bodyOrOpts || 'query' in bodyOrOpts || 'headers' in bodyOrOpts)) {
    return bodyOrOpts;
  }
  // Otherwise treat the argument as the request body directly
  return { body: bodyOrOpts };
}

export const api = {
  get: (path, opts) => request('GET', path, opts),
  post: (path, bodyOrOpts) => request('POST', path, normalizeOpts(bodyOrOpts)),
  put: (path, bodyOrOpts) => request('PUT', path, normalizeOpts(bodyOrOpts)),
  patch: (path, bodyOrOpts) => request('PATCH', path, normalizeOpts(bodyOrOpts)),
  del: (path, opts) => request('DELETE', path, opts),
  // Download binary content (returns a Blob). This helper includes auth headers and credentials.
  download: async (path, { query, headers, method } = {}) => {
    const url = buildUrl(path, query);
    const opts = {
      method: method || 'GET',
      headers: {
        ...(headers || {}),
        ...authHeader()
      },
      credentials: 'include'
    };
    const res = await fetch(url, opts);
    const contentType = res.headers.get('content-type') || '';
    let data = null;
    if (!res.ok) {
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }
      const err = new Error(`HTTP ${res.status} ${res.statusText}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    const blob = await res.blob();
    return blob;
  },
  // helpers to set/clear in-memory token used by authHeader()
  setAuthToken,
  clearAuthToken,
  buildUrl
};

export default api;
