// Utility helpers for per-user favorites storage
export const getFavoritesKey = (user) => {
  try {
    if (!user) return 'favorites:anon';
    const id = user.maKhachHang || user.ma_khach_hang || user.id || user.maTaiKhoan || user.ma_tai_khoan || user.username || user.tenDangNhap;
    return `favorites:user:${String(id)}`;
  } catch (e) {
    return 'favorites:anon';
  }
};

export const readFavoritesLocal = (user) => {
  const key = getFavoritesKey(user);
  try {
    const raw = localStorage.getItem(key) || '[]';
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

export const writeFavoritesLocal = (user, arr) => {
  const key = getFavoritesKey(user);
  try {
    localStorage.setItem(key, JSON.stringify(Array.isArray(arr) ? arr : []));
    try { window.dispatchEvent(new CustomEvent('favorites:changed', { detail: { count: (Array.isArray(arr) ? arr.length : 0) } })); } catch (e) {}
  } catch (e) {
    // ignore
  }
};

// Backward compatibility: expose legacy global key for unauthenticated setups
export const LEGACY_GLOBAL_KEY = 'favorites';

export const readFavoritesWithLegacy = (user) => {
  // Try per-user key first, then fallback to legacy global key
  const per = readFavoritesLocal(user);
  if (per && per.length > 0) return per;
  try {
    const raw = localStorage.getItem(LEGACY_GLOBAL_KEY) || '[]';
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};
