import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const CART_STORAGE_KEY = 'cart';

// Session id for anonymous cart to avoid collisions across browsers/users
const getOrCreateSessionId = () => {
  try {
    let sid = sessionStorage.getItem('cart:sessionId');
    if (!sid) {
      sid = `s_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem('cart:sessionId', sid);
    }
    return sid;
  } catch (e) { return `s_${Math.random().toString(36).slice(2, 8)}`; }
};

// Each user will have a canonical storage key `cart:user:<uid>`.
// For backwards compatibility we may have older keys like `cartid:user:<uid>` -> `cart:<cartId>`.
// The helpers below prefer the canonical key and will migrate old storage when found.
const getOrCreateCartIdForUser = (user) => {
  try {
    const uid = getUserId(user);
    if (!uid) return null;
    const key = `cartid:user:${uid}`;
    let cartId = localStorage.getItem(key);
    if (!cartId) {
      cartId = `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      try { localStorage.setItem(key, cartId); } catch (e) { /* ignore */ }
    }
    return cartId;
  } catch (e) { return null; }
};

const getCanonicalUserCartKey = (user) => {
  const uid = getUserId(user);
  return uid ? `cart:user:${uid}` : null;
};

const getCartStorageKey = (user) => {
  try {
    if (!user) return `cart:anon:${getOrCreateSessionId()}`;
    // Prefer the canonical per-user key
    const canonical = getCanonicalUserCartKey(user);
    if (!canonical) return `cart:anon:${getOrCreateSessionId()}`;

    // If new-style key already exists, use it
    if (localStorage.getItem(canonical)) return canonical;

    // Otherwise check for legacy cartId mapping and migrate if present
    const legacyCartIdKey = `cartid:user:${getUserId(user)}`;
    const legacyCartId = localStorage.getItem(legacyCartIdKey);
    if (legacyCartId) {
      const legacyCartKey = `cart:${legacyCartId}`;
      const legacyRaw = localStorage.getItem(legacyCartKey);
      if (legacyRaw) {
        try {
          // Move legacy cart into the canonical key so future loads are predictable
          localStorage.setItem(canonical, legacyRaw);
          try { localStorage.removeItem(legacyCartKey); } catch (e) { }
        } catch (e) { /* ignore */ }
        return canonical;
      }
    }

    // No existing cart found, return canonical key to be used for storage
    return canonical;
  } catch (e) { return `cart:anon:${getOrCreateSessionId()}`; }
};

// Compute a stable user id used for cart key generation. If canonical ids are missing,
// produce a deterministic fallback based on the serialized user object so different
// users don't collide on a single 'unknown' key.
const getUserId = (user) => {
  if (!user) return null;
  const id = user.maKhachHang || user.ma_khach_hang || user.id || user.maTaiKhoan || user.ma_tai_khoan || user.username || user.tenDangNhap || user.email || null;
  if (id) return String(id);
  try {
    const s = JSON.stringify(user || {});
    // simple deterministic hash to keep id short
    let h = 0;
    for (let i = 0; i < s.length; i++) { h = ((h << 5) - h) + s.charCodeAt(i); h = h & h; }
    return `generated_${Math.abs(h)}`;
  } catch (e) {
    return 'generated_unknown';
  }
};

const getCartKeyForUser = (user) => {
  try {
    if (!user) return 'cart:anon';
    const uid = getUserId(user);
    return uid ? `cart:user:${uid}` : 'cart:user:generated_unknown';
  } catch (e) { return 'cart:anon'; }
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const prevUserRef = useRef(null);
  const mergedForUserRef = useRef(null);

  const [items, setItems] = useState(() => {
    try {
      // On initial load prefer per-user key when user info was already available
      const key = getCartStorageKey(user) || CART_STORAGE_KEY;

      const raw = localStorage.getItem(key) || localStorage.getItem(CART_STORAGE_KEY) || null;

      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);

      // Support legacy array format or new object format { customerId, items }
      const arr = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.items) ? parsed.items : []);

      const migrated = arr.map(i => {
        const variant = i.variant || {};
        const variantId = i.variantId || i.id || variant.id || variant.maBienThe || null;
        const productName = i.name || i.displayName || (i.product && (i.product.tenSanPham || i.product.name)) || 'Sản phẩm';
        const variantName = variant.name || variant.tenBienThe || (variant.attributes && Array.isArray(variant.attributes) ? variant.attributes.map(a => a.giaTri).join(' - ') : null) || null;
        return {
          ...i,
          id: i.id || variantId,
          variantId: variantId,
          displayName: i.displayName || (variantName ? `${productName} - ${variantName}` : productName),
          quantity: typeof i.quantity === 'number' ? i.quantity : 1
        };
      });

      return migrated;
    } catch (err) {
      console.error('❌ [CartContext] Failed to read cart from localStorage', err);
      return [];
    }
  });

  // Persist to per-user localStorage whenever items change
  const userIdRef = useRef(null);

  useEffect(() => {
    const currentUserId = getUserId(user);

    // Skip persistence on initial mount when items array might be stale
    // This prevents overwriting stored cart with empty initial state
    if (items.length === 0) {
      const key = getCartStorageKey(user) || CART_STORAGE_KEY;
      const existing = localStorage.getItem(key);
      if (!existing) {
        return;
      }
    }

    try {
      const key = getCartStorageKey(user) || CART_STORAGE_KEY;

      // For logged-in users persist canonical object with customerId to keep mapping explicit
      try {
        if (user) {
          const customerId = currentUserId;
          const payload = { customerId, items };
          localStorage.setItem(key, JSON.stringify(payload));
        } else {
          // anonymous users keep legacy array shape for compatibility
          localStorage.setItem(key, JSON.stringify(items));
        }
      } catch (e) {
        // fallback to simple array persistence
        localStorage.setItem(key, JSON.stringify(items));
      }
    } catch (err) {
      console.error('❌ [CartContext] Failed to persist cart to localStorage', err);
    }

    userIdRef.current = currentUserId;
  }, [items]); // Remove 'user' from dependencies to avoid infinite loop

  // When auth user changes, load appropriate cart and optionally merge anon cart
  useEffect(() => {
    try {
      const prevUser = prevUserRef.current;
      const currUser = user;
      // Detect a real login transition (prevUser falsy -> currUser truthy)
      // and only perform the anon->user merge once per user id to avoid duplicate merges.
      // Use the same deterministic id generator we use for storage keys so the
      // mergedForUserRef matches the cart:user:<id> key (avoids 'unknown' collisions).
      const currUserId = getUserId(currUser);
      if (!prevUser && currUser && currUserId && mergedForUserRef.current !== currUserId) {
        // user logged in: try to merge anon cart into user's cart
        const anonKey = `cart:anon:${getOrCreateSessionId()}`;
        const userStorageKey = getCartStorageKey(currUser);
        const anonRaw = localStorage.getItem(anonKey) || localStorage.getItem(CART_STORAGE_KEY) || null;
        const userRaw = localStorage.getItem(userStorageKey) || null;
        let anonArr = [];
        let userArr = [];
        try {
          const parsedAnon = anonRaw ? JSON.parse(anonRaw) : null;
          anonArr = Array.isArray(parsedAnon) ? parsedAnon : (parsedAnon && Array.isArray(parsedAnon.items) ? parsedAnon.items : []);
        } catch (e) { anonArr = []; }
        try {
          const parsedUser = userRaw ? JSON.parse(userRaw) : null;
          userArr = Array.isArray(parsedUser) ? parsedUser : (parsedUser && Array.isArray(parsedUser.items) ? parsedUser.items : []);
        } catch (e) { userArr = []; }

        // Normalize function used earlier
        const normalize = (arr) => (Array.isArray(arr) ? arr.map(i => {
          const variant = i.variant || {};
          const variantId = i.variantId || i.id || variant.id || variant.maBienThe || null;
          const productName = i.name || i.displayName || (i.product && (i.product.tenSanPham || i.product.name)) || 'Sản phẩm';
          const variantName = variant.name || variant.tenBienThe || (variant.attributes && Array.isArray(variant.attributes) ? variant.attributes.map(a => a.giaTri).join(' - ') : null) || null;
          return {
            ...i,
            id: i.id || variantId,
            variantId: variantId,
            displayName: i.displayName || (variantName ? `${productName} - ${variantName}` : productName),
            quantity: typeof i.quantity === 'number' ? i.quantity : 1
          };
        }) : []);

        const anonNorm = normalize(anonArr);
        const userNorm = normalize(userArr);

        // Merge strategy: prefer existing user cart quantities for duplicate items.
        // We'll start from the user's cart (userNorm) and only add anon items that are not present in user cart.
        const mergedMap = new Map();
        // Seed with user's cart (preserve user's quantities)
        userNorm.forEach(it => {
          const key = it.variantId || it.id;
          if (!key) return;
          mergedMap.set(key, { ...it });
        });
        // Add anon items only if they don't exist in user's cart to avoid doubling quantities
        anonNorm.forEach(it => {
          const key = it.variantId || it.id;
          if (!key) return;
          if (!mergedMap.has(key)) mergedMap.set(key, { ...it });
          // if user already has the item, do not sum quantities to avoid accidental duplication
        });
        const merged = Array.from(mergedMap.values());
        if (merged.length > 0) {
          setItems(merged);
          try {
            // persist canonical shape with customerId
            const customerId = currUserId;
            localStorage.setItem(userStorageKey, JSON.stringify({ customerId, items: merged }));
          } catch (e) { }
        } else if (userNorm.length > 0) {
          setItems(userNorm);
        }
        // clear anon saved cart to avoid duplicate merge later
        try { localStorage.removeItem(anonKey); localStorage.removeItem(CART_STORAGE_KEY); } catch (e) { }
        // mark that we've merged for this user id (prevents re-merge on re-renders)
        try { mergedForUserRef.current = currUserId; } catch (e) { }
      } else if (prevUser && !currUser) {
        // user logged out: load anon cart or leave empty. Support both legacy array and canonical object.
        const anonKey = `cart:anon:${getOrCreateSessionId()}`;
        const raw = localStorage.getItem(anonKey) || localStorage.getItem(CART_STORAGE_KEY) || null;
        try {
          const parsed = raw ? JSON.parse(raw) : [];
          const arr = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.items) ? parsed.items : []);
          setItems(arr);
        } catch (e) { setItems([]); }
        // clear merged marker on logout so next login can re-evaluate merge
        try { mergedForUserRef.current = null; } catch (e) { }
      } else if (currUser) {
        // user changed (different account): load that user's cart by its storage key
        const userStorageKey = getCartStorageKey(currUser);
        const raw = localStorage.getItem(userStorageKey) || null;
        try {
          const parsed = raw ? JSON.parse(raw) : [];
          const arr = Array.isArray(parsed) ? parsed : (parsed && Array.isArray(parsed.items) ? parsed.items : []);
          setItems(arr);
        } catch (e) { /* ignore */ }
      }
      prevUserRef.current = user;
    } catch (err) {
      console.warn('CartContext: error handling user change', err);
    }
  }, [user]);

  const addToCart = (product, variant, quantity = 1) => {

    // Require authentication to add to cart. Redirect unauthenticated users to login.
    if (!user) {
      console.warn('⚠️ [addToCart] No user logged in, redirecting to login');
      try { window.location.href = '/login'; } catch (e) { /* fallback no-op */ }
      return false;
    }

    const customerId = getUserId(user); // Get customer ID

    const variantId = variant?.id ?? variant?.maBienThe ?? product?.id ?? product?.maSanPham ?? Math.random().toString(36).slice(2, 9);

    setItems(prev => {

      if (prev.length > 0) {
        prev.forEach((item, index) => {
        });
      }

      const existing = prev.find(i => i.variantId === variantId);
      if (existing) {
        const updated = prev.map(i => i.variantId === variantId ? { ...i, quantity: i.quantity + quantity } : i);

        return updated;
      }

      const item = {
        // Customer ID
        customerId: customerId,
        maKhachHang: customerId,
        // Prefer variantId for uniqueness when a variant is selected. Fall back to product id.
        id: variantId ?? product?.id ?? product?.maSanPham ?? Math.random().toString(36).slice(2, 9),
        variantId,
        // Prefer a variant-aware display name so different variants don't appear identical in the cart
        displayName: variant?.name ? `${product?.tenSanPham ?? product?.name ?? 'Sản phẩm'} - ${variant.name}` : (product?.tenSanPham ?? product?.name ?? 'Sản phẩm'),
        name: product?.tenSanPham ?? product?.name ?? 'Sản phẩm',
        image: (variant?.image || (product?.hinhAnh && Array.isArray(product.hinhAnh) ? product.hinhAnh[0] : (product?.image || product?.images?.[0]))) ?? null,
        price: Number(variant?.price ?? variant?.giaSauGiam ?? variant?.giaBan ?? product?.giaBan ?? product?.price ?? 0),
        quantity,
        product,
        variant
      };

      const newCart = [...prev, item];

      return newCart;
    });

    return true;
  };

  const updateQuantity = (variantIdOrId, newQuantity) => {
    setItems(prev => prev.map(i => (i.variantId === variantIdOrId || i.id === variantIdOrId) ? { ...i, quantity: Math.max(1, newQuantity) } : i));
  };

  const removeItem = (variantIdOrId) => {
    setItems(prev => prev.filter(i => !(i.variantId === variantIdOrId || i.id === variantIdOrId)));
  };

  const isInCart = (variantId) => items.some(i => i.variantId === variantId || i.id === variantId);

  const getItemQuantity = (variantId) => {
    const it = items.find(i => i.variantId === variantId || i.id === variantId);
    return it ? it.quantity : 0;
  };

  const getTotalItems = () => items.reduce((s, i) => s + i.quantity, 0);

  const getTotalPrice = () => items.reduce((s, i) => s + (Number(i.price || 0) * (i.quantity || 0)), 0);

  const clearCart = () => setItems([]);

  const value = {
    items,
    addToCart,
    updateQuantity,
    removeItem,
    isInCart,
    getItemQuantity,
    getTotalItems,
    getTotalPrice,
    clearCart
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    return {
      items: [],
      addToCart: () => { },
      updateQuantity: () => { },
      removeItem: () => { },
      isInCart: () => false,
      getItemQuantity: () => 0,
      getTotalItems: () => 0,
      getTotalPrice: () => 0,
      clearCart: () => { }
    };
  }
  return ctx;
};

export default CartContext;
