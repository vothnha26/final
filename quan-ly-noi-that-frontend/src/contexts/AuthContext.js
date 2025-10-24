import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const normalizeRole = (r) => String(r || '').toUpperCase().replace(/^ROLE_/, '').trim();

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Do NOT auto-initialize `user` from localStorage to avoid treating a cached
  // profile as an authenticated session. We'll only populate `user` after
  // verifying a token or session with the backend.
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem('authToken'); } catch (e) { return null; }
  });
  const [loading, setLoading] = useState(true);

  const hasSessionCookie = () => {
    if (typeof document === 'undefined') return false;
    try {
      const ck = document.cookie || '';
      return ck.includes('JSESSIONID') || ck.includes('SESSION') || ck.includes('SESSIONID') || ck.includes('AUTH');
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      const storedToken = (() => { try { return localStorage.getItem('authToken'); } catch (e) { return null; } })();

      if (hasSessionCookie()) {
        try {
          const resp = await api.get('/api/v1/auth/me');
          const data = resp?.data ?? resp;
          if (data) {
            setUser(data);
            try { localStorage.setItem('user', JSON.stringify(data)); } catch (e) { }
            if (data.vaiTro) try { localStorage.setItem('userRole', normalizeRole(data.vaiTro)); } catch (e) { }
            setLoading(false);
            return;
          }
        } catch (e) {
          // ignore and fall through to token path
        }
      }

      if (storedToken) {
        try {
          const cached = (() => { try { return JSON.parse(localStorage.getItem('user')); } catch (e) { return null; } })();
          if (cached) setUser(cached);

          // Call /auth/me first (works for all roles)
          const resp = await api.get('/api/v1/auth/me');
          const data = resp?.data ?? resp;
          if (data) {
            let finalData = data;

            // If USER role, fetch additional customer details
            const role = normalizeRole(data.vaiTro);
            if (role === 'USER') {
              try {
                const customerResp = await api.get('/api/v1/khach-hang/me');
                const customerData = customerResp?.data ?? customerResp;
                // Merge account + customer data
                finalData = { ...data, ...customerData };
              } catch (custErr) {
                console.warn('[AuthContext] startup: failed to fetch customer details:', custErr);
              }
            }

            // Normalize customer ID to both formats
            const customerId = finalData.maKhachHang || finalData.ma_khach_hang || finalData.id;
            const normalizedData = { 
              ...finalData, 
              ma_khach_hang: customerId,
              maKhachHang: customerId 
            };
            setUser(normalizedData);
            try { localStorage.setItem('user', JSON.stringify(normalizedData)); } catch (e) { }
            if (finalData.vaiTro) try { localStorage.setItem('userRole', normalizeRole(finalData.vaiTro)); } catch (e) { }
          }
        } catch (e) {
          try { localStorage.removeItem('authToken'); localStorage.removeItem('user'); localStorage.removeItem('userRole'); } catch (er) { }
          setToken(null);
          setUser(null);
        }
      }

      setLoading(false);
    };

    fetchUser();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await api.post('/api/v1/auth/authenticate', credentials);

      const authToken = response?.data?.token || response?.data?.accessToken || response?.data?.access_token || response?.data?.jwt || response?.data?.idToken || response?.token || null;
      // console.debug('[AuthContext] login: extracted token:', !!authToken);
      
      // CRITICAL: Set token in memory AND localStorage synchronously BEFORE any profile calls
      if (authToken) {
        try { 
          localStorage.setItem('authToken', authToken);
          api.setAuthToken(authToken); // set in-memory immediately
          setToken(authToken);
          // console.debug('[AuthContext] login: token set in localStorage and api cache');
        } catch (e) {
          console.error('[AuthContext] login: failed to set token:', e);
        }
      }

      const roleFromResp = response?.data?.vaiTro || response?.vaiTro || response?.data?.role || response?.role || null;
      if (roleFromResp) {
        try { localStorage.setItem('userRole', normalizeRole(roleFromResp)); } catch (e) { }
      }

  const sessionPresent = hasSessionCookie();
  // console.debug('[AuthContext] login: session cookie present?', sessionPresent);
      
      // If we have neither token nor session, return minimal user from response
      if (!authToken && !sessionPresent) {
        const minimalUser = {
          maTaiKhoan: response?.data?.maTaiKhoan || response?.maTaiKhoan || null,
          tenDangNhap: response?.data?.tenDangNhap || response?.tenDangNhap || credentials.tenDangNhap || credentials.username || null,
          email: response?.data?.email || response?.email || null,
          vaiTro: roleFromResp || null
        };
        setUser(minimalUser);
        try { localStorage.setItem('user', JSON.stringify(minimalUser)); } catch (e) { }
        return { success: true, data: minimalUser };
      }

      // Now fetch profile - token is already set, so Authorization header will be present
      try {
        if (sessionPresent) {
          // console.debug('[AuthContext] login: calling /api/v1/auth/me (session)');
          const authMe = await api.get('/api/v1/auth/me');
          const authMeData = authMe?.data ?? authMe;
          // console.debug('[AuthContext] login: /api/v1/auth/me returned', !!authMeData);
          if (authMeData) {
            setUser(authMeData);
            // persist ma_khach_hang early if present so checkout and voucher logic can read it
            try {
              const raw = localStorage.getItem('user');
              const parsed = raw ? JSON.parse(raw) : {};
              const customerId = authMeData.maKhachHang || authMeData.ma_khach_hang || authMeData.id;
              if (customerId) {
                parsed.ma_khach_hang = parsed.ma_khach_hang || customerId;
                parsed.maKhachHang = parsed.maKhachHang || customerId;
              }
              // merge basic fields too
              parsed.hoTen = parsed.hoTen || authMeData.hoTen || authMeData.name;
              parsed.soDienThoai = parsed.soDienThoai || authMeData.soDienThoai || authMeData.phone;
              localStorage.setItem('user', JSON.stringify(parsed));
            } catch (e) { /* ignore */ }
            try { localStorage.setItem('userRole', normalizeRole(authMeData.vaiTro)); } catch (e) { }
            return { success: true, data: authMeData };
          }
        }

  // Token path: call /auth/me first to get account info (works for all roles)
  // console.debug('[AuthContext] login: calling /api/v1/auth/me (token already set)');
  const userResp = await api.get('/api/v1/auth/me');
  const userData = userResp?.data ?? userResp;
  // console.debug('[AuthContext] login: /api/v1/auth/me returned', !!userData, 'role:', userData?.vaiTro);

        if (userData) {
          // If USER role, fetch additional customer details from /khach-hang/me
          const userRole = normalizeRole(userData.vaiTro);
          let finalUserData = userData;

          if (userRole === 'USER') {
            try {
              // console.debug('[AuthContext] login: USER role detected, fetching customer details from /api/v1/khach-hang/me');
              const customerResp = await api.get('/api/v1/khach-hang/me');
              const customerData = customerResp?.data ?? customerResp;
              // console.debug('[AuthContext] login: /api/v1/khach-hang/me returned', !!customerData);
              // Merge: account info + customer details
              finalUserData = { ...userData, ...customerData };
            } catch (custErr) {
              console.warn('[AuthContext] login: failed to fetch customer details, using account data only:', custErr);
            }
          }

          setUser(finalUserData);
          // persist ma_khach_hang early - support both camelCase and snake_case
          try {
            const raw = localStorage.getItem('user');
            const parsed = raw ? JSON.parse(raw) : {};
            const customerId = finalUserData.maKhachHang || finalUserData.ma_khach_hang || finalUserData.id;
            parsed.ma_khach_hang = parsed.ma_khach_hang || customerId;
            parsed.maKhachHang = parsed.maKhachHang || customerId;
            parsed.hoTen = parsed.hoTen || finalUserData.hoTen || finalUserData.name;
            parsed.soDienThoai = parsed.soDienThoai || finalUserData.soDienThoai || finalUserData.phone;
            parsed.vaiTro = finalUserData.vaiTro;
            localStorage.setItem('user', JSON.stringify(parsed));
          } catch (e) { /* ignore */ }
          if (finalUserData.vaiTro) try { localStorage.setItem('userRole', normalizeRole(finalUserData.vaiTro)); } catch (e) { }
          return { success: true, data: finalUserData };
        }
      } catch (err) {
        console.error('[AuthContext] login: profile fetch failed:', err);
        const minimalUser = {
          maTaiKhoan: response?.data?.maTaiKhoan || response?.maTaiKhoan || null,
          tenDangNhap: response?.data?.tenDangNhap || response?.tenDangNhap || credentials.tenDangNhap || credentials.username || null,
          email: response?.data?.email || response?.email || null,
          vaiTro: roleFromResp || null
        };
        setUser(minimalUser);
        try { localStorage.setItem('user', JSON.stringify(minimalUser)); } catch (e) { }
        if (roleFromResp) try { localStorage.setItem('userRole', normalizeRole(roleFromResp)); } catch (e) { }
        return { success: true, data: minimalUser };
      }
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message || 'Đăng nhập thất bại' };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/api/v1/auth/register', userData);
      return { success: true, data: response.data || response };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message || 'Đăng ký thất bại' };
    }
  };

  const logout = () => {
    // Try to call a backend logout endpoint if available so server-side sessions/cookies are invalidated.
    (async () => {
      try {
        // Try a few common logout endpoints; ignore errors
        await Promise.all([
          api.post('/api/v1/auth/logout').catch(() => null),
          api.post('/api/logout').catch(() => null),
          api.get('/api/v1/auth/logout').catch(() => null),
          api.get('/api/logout').catch(() => null)
        ]);
      } catch (e) {
        // ignore
      } finally {
        try { localStorage.removeItem('authToken'); localStorage.removeItem('user'); localStorage.removeItem('userRole'); } catch (e) {}
        try { api.clearAuthToken(); } catch (e) {}
        setToken(null);
        setUser(null);
        // Also broadcast storage change so other tabs update
        try { window.dispatchEvent(new Event('storage')); } catch (e) {}
      }
    })();
  };

  const updateProfile = async (profileData) => {
    try {
      // Use /me endpoint for customer self-update
      const response = await api.put('/api/v1/khach-hang/me', profileData);
      const userData = response.data || response;
      
      // Merge with existing user data to preserve other fields
      const mergedUser = { ...user, ...userData };
      setUser(mergedUser);
      try { localStorage.setItem('user', JSON.stringify(mergedUser)); } catch (e) { }
      return { success: true, data: mergedUser };
    } catch (error) {
      return { success: false, error: error.response?.data?.message || error.message || 'Cập nhật thất bại' };
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/api/v1/khach-hang/me');
      const userData = response.data || response;
      setUser(userData);
      try { localStorage.setItem('user', JSON.stringify(userData)); } catch (e) { }
      return { success: true, data: userData };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      token: null,
      loading: false,
      isAuthenticated: false,
      login: async () => ({ success: false, error: 'AuthContext not found' }),
      register: async () => ({ success: false, error: 'AuthContext not found' }),
      logout: () => { },
      updateProfile: async () => ({ success: false, error: 'AuthContext not found' }),
      refreshUser: async () => ({ success: false, error: 'AuthContext not found' })
    };
  }
  return context;
};

export default AuthContext;
