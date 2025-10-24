
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { IoWarning, IoCheckmarkCircle, IoTime, IoRefresh, IoEye, IoCreate, IoTrash, IoNotifications } from 'react-icons/io5';
import api from '../../../api';
import MultiBarChart from './MultiBarChart';

// Compare mode: 'variant' (default) or 'product' (sum all variants per product)

const InventoryAlerts = () => {
  const [compareMode, setCompareMode] = useState('variant');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // Stock history state for selected alert
  const [history, setHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  // Overview history for global charts
  const [overviewHistory, setOverviewHistory] = useState([]);
  const [isOverviewLoading, setIsOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState(null);

  // Product-specific history (multi-select)
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [productsHistory, setProductsHistory] = useState({});
  const [isProductHistoryLoading, setIsProductHistoryLoading] = useState(false);
  const [productHistoryError, setProductHistoryError] = useState(null);

  // Variant catalog for multi-select compare
  const [allVariants, setAllVariants] = useState([]);
  const [isVariantsLoading, setIsVariantsLoading] = useState(false);
  const [variantsError, setVariantsError] = useState(null);
  const [variantSearch, setVariantSearch] = useState('');
  const variantNameFetchedRef = useRef(new Set());

  // Date filters for overview charts
  const [overviewStartDate, setOverviewStartDate] = useState('');
  const [overviewEndDate, setOverviewEndDate] = useState('');
  // View mode for overview chart: 'bar' | 'line'
  const [overviewMode, setOverviewMode] = useState('bar');

  // Alerts list state (move earlier to avoid use-before-define in hooks below)
  const [alerts, setAlerts] = useState([]);

  // Note: API responses are normalized in the fetch routine below;
  // the older mapAlertFromApi helper was removed to avoid unused symbol warnings.

  // priority mapping handled inline during normalization; helper removed.

  // Helper: normalize history item
  const normalizeHistory = (item) => ({
    date: new Date(item.thoiGianThucHien || item.ngayGhiNhan || item.createdAt || Date.now()),
    before: item.soLuongTruoc ?? 0,
    change: item.soLuongThayDoi ?? 0,
    after: item.soLuongSau ?? 0,
    type: item.loaiGiaoDich || '',
  });

  // Fetch overview inventory history for summary charts
  const fetchOverviewHistory = useCallback(async (alertsSnapshot = []) => {
    setIsOverviewLoading(true);
    setOverviewError(null);
    try {
      const tryUrls = [
        '/api/v1/quan-ly-ton-kho/lich-su-xuat-nhap/tong-hop',
        '/api/v1/quan-ly-ton-kho/lich-su-xuat-nhap?scope=all',
        '/api/v1/quan-ly-ton-kho/lich-su-xuat-nhap'
      ];
      let combined = null;
      for (const u of tryUrls) {
        try {
          const res = await api.get(u);
          const list = Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : null;
          if (Array.isArray(list)) { combined = list.map(normalizeHistory); break; }
        } catch (e) {
          // try next
        }
      }

      // Fallback: batch per variant IDs (limit to 8) if overview endpoint not available
      if (!combined) {
        const ids = (alertsSnapshot || []).map(a => a.id).filter(Boolean).slice(0, 8);
        if (ids.length === 0) {
          setOverviewHistory([]);
          return;
        }
        const promises = ids.map(id => api.get(`/api/v1/quan-ly-ton-kho/lich-su-xuat-nhap/${id}`).then(res => {
          const list = Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : [];
          return list.map(normalizeHistory);
        }).catch(() => []));
        const results = await Promise.all(promises);
        combined = results.flat();
      }

      // Sort chronologically
      combined.sort((a, b) => a.date - b.date);

      setOverviewHistory(combined);
    } catch (e) {
      setOverviewError(e);
      setOverviewHistory([]);
    } finally {
      setIsOverviewLoading(false);
    }
  }, []);

  // Fetch all variants for selection list
  const fetchAllVariants = useCallback(async () => {
    setIsVariantsLoading(true);
    setVariantsError(null);
    try {
      const res = await api.get('/api/bien-the-san-pham');
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      const mapped = list.map(item => ({
        variantId: item.maBienThe ?? item.id,
        // Try multiple shapes for product name
        product: item.sanPham?.tenSanPham ?? item.tenSanPham ?? item.sanPham?.ten ?? item.ten ?? item.productName ?? item.name ?? '',
        productId: item.sanPham?.id ?? item.maSanPham ?? item.sanPhamId ?? item.productId ?? null,
        variantName: item.tenBienThe ?? item.ten ?? item.name ?? item.variantName ?? '',
        sku: item.sku ?? '',
        currentStock: item.soLuongTon ?? 0,
        minStock: item.mucTonToiThieu ?? 0,
        category: item.sanPham?.danhMuc?.tenDanhMuc ?? '',
      }));
      setAllVariants(mapped);
    } catch (e) {
      setVariantsError(e);
      setAllVariants([]);
    } finally {
      setIsVariantsLoading(false);
    }
  }, []);

  // Fetch multiple products history
  const fetchProductsHistory = useCallback(async (productIds) => {
    if (!productIds || productIds.length === 0) {
      setProductsHistory({});
      return;
    }
    setIsProductHistoryLoading(true);
    setProductHistoryError(null);
    try {
      const promises = productIds.map(async (id) => {
        try {
          const res = await api.get(`/api/v1/quan-ly-ton-kho/lich-su-xuat-nhap/${id}`);
          const list = Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : [];
          const mapped = list.map(normalizeHistory).sort((a, b) => a.date - b.date);
          return { id, history: mapped };
        } catch (e) {
          return { id, history: [] };
        }
      });
      const results = await Promise.all(promises);
      const historyMap = {};
      results.forEach(({ id, history }) => {
        historyMap[id] = history;
      });
      setProductsHistory(historyMap);
    } catch (e) {
      setProductHistoryError(e);
      setProductsHistory({});
    } finally {
      setIsProductHistoryLoading(false);
    }
  }, []);

  // Fetch inventory alerts (try multiple backend endpoints and normalize results)
  const fetchAlerts = useCallback(async () => {
    setIsLoading(true);
    try {
      // Chỉ dùng các endpoint tồn tại trong backend
      const tryUrls = [
        '/api/v1/quan-ly-ton-kho/san-pham-sap-het',
        '/api/v1/quan-ly-ton-kho/san-pham-het-hang'
      ];

      let fetched = null;
      for (const u of tryUrls) {
        try {
          const res = await api.get(u);
          if (res) { fetched = { url: u, body: res }; break; }
        } catch (e) {
          // try next
        }
      }

      if (!fetched) {
        setAlerts([]);
        setError(null);
        return;
      }

      const { body } = fetched;
      let list = [];
      if (Array.isArray(body)) list = body;
      else if (body?.data && Array.isArray(body.data)) list = body.data;
      else if (body?.data && typeof body.data === 'object') {
        const d = body.data;
        const a = Array.isArray(d.sanPhamSapHet) ? d.sanPhamSapHet : [];
        const b = Array.isArray(d.sanPhamHetHang) ? d.sanPhamHetHang : [];
        list = [...a, ...b];
      } else if (body?.sanPhamSapHet || body?.sanPhamHetHang) {
        const a = Array.isArray(body.sanPhamSapHet) ? body.sanPhamSapHet : [];
        const b = Array.isArray(body.sanPhamHetHang) ? body.sanPhamHetHang : [];
        list = [...a, ...b];
      }

      const mapped = list.map(item => {
        const currentStock = item.soLuongTon ?? item.currentStock ?? item.soLuong ?? 0;
        const minStock = item.mucTonToiThieu ?? item.minStock ?? item.soLuongToiThieu ?? 0;
        const status = currentStock === 0 ? 'out_of_stock' : (currentStock <= (minStock || 5) ? 'low_stock' : 'normal');
        const priority = status === 'out_of_stock' ? 'urgent' : (status === 'low_stock' ? 'high' : 'low');
        const variantId = item.maBienThe ?? item.id ?? item.maCanhBao;
        
        // Lấy thông tin từ entity BienTheSanPham (backend trả về)
        const productName = item.sanPham?.tenSanPham ?? item.productName ?? item.product ?? '(Chưa rõ)';
        const categoryName = item.sanPham?.danhMuc?.tenDanhMuc ?? item.category ?? 'N/A';
        const supplierName = item.sanPham?.nhaCungCap?.tenNhaCungCap ?? item.supplier ?? 'N/A';
        
        return {
          id: variantId,
          variantId: variantId,
          product: productName,
          sku: item.sku ?? '',
          currentStock,
          minStock,
          maxStock: minStock * 2 || 100, // Giả định maxStock = 2x minStock nếu không có
          status,
          priority,
          category: categoryName,
          supplier: supplierName,
          lastRestock: item.ngayCapNhatKho ?? item.lastRestock ?? '',
          nextRestock: item.nextRestock ?? '',
          createdBy: 'System', // Backend chưa có field này, tạm dùng default
          createdAt: item.ngayCapNhatKho ?? item.ngayTao ?? item.createdAt ?? '',
          isActive: item.trangThaiKho !== 'DISCONTINUED'
        };
      });

      setAlerts(mapped);
      setError(null);
      // Also refresh overview history based on freshly mapped alerts (for fallback aggregation)
      try { await fetchOverviewHistory(mapped); } catch (_) { }
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchOverviewHistory]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Fetch stock history when opening detail modal
  useEffect(() => {
    const fetchHistory = async () => {
      if (!showAlertModal || !selectedAlert?.id) return;
      setIsHistoryLoading(true);
      setHistoryError(null);
      try {
        const res = await api.get(`/api/v1/quan-ly-ton-kho/lich-su-xuat-nhap/${selectedAlert.id}`);
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : (res || []);
        const mapped = list.map(item => ({
          date: new Date(item.thoiGianThucHien || item.ngayGhiNhan || item.createdAt || Date.now()),
          before: item.soLuongTruoc ?? 0,
          change: item.soLuongThayDoi ?? 0,
          after: item.soLuongSau ?? 0,
          type: item.loaiGiaoDich || '',
        })).sort((a, b) => a.date - b.date);
        setHistory(mapped);
      } catch (e) {
        setHistoryError(e);
        setHistory([]);
      } finally {
        setIsHistoryLoading(false);
      }
    };
    fetchHistory();
  }, [showAlertModal, selectedAlert]);


  // Load overview history on mount and whenever alerts change (to enable fallback)
  useEffect(() => {
    fetchOverviewHistory();
  }, [fetchOverviewHistory]);

  // Load variant catalog for selection/search on mount
  useEffect(() => {
    fetchAllVariants();
  }, [fetchAllVariants]);

  // Enrich missing product names by calling variant detail endpoint as fallback
  useEffect(() => {
    if (!allVariants || allVariants.length === 0) return;
    const missing = allVariants.filter(v => !v.product || !String(v.product).trim());
    const toFetch = missing.filter(v => !variantNameFetchedRef.current.has(String(v.variantId))).slice(0, 20);
    if (toFetch.length === 0) return;
    toFetch.forEach(v => variantNameFetchedRef.current.add(String(v.variantId)));
    (async () => {
      try {
        const results = await Promise.allSettled(
          toFetch.map(v => api.get(`/api/bien-the-san-pham/${v.variantId}/chi-tiet`))
        );
        const nameMap = new Map();
        results.forEach((res, idx) => {
          if (res.status === 'fulfilled') {
            const d = res.value?.data || res.value;
            const name = d?.tenSanPham || d?.sanPham?.tenSanPham || '';
            if (name) nameMap.set(String(toFetch[idx].variantId), name);
          }
        });
        if (nameMap.size > 0) {
          setAllVariants(prev => prev.map(v => {
            const nm = nameMap.get(String(v.variantId));
            if (nm && (!v.product || !String(v.product).trim())) return { ...v, product: nm };
            return v;
          }));
        }
      } finally {
        // no-op
      }
    })();
  }, [allVariants]);

  // Removed alertSettings per requirement

  const statusConfig = {
    normal: { color: 'text-green-600', bg: 'bg-green-100', icon: IoCheckmarkCircle, label: 'Bình thường' },
    low_stock: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: IoWarning, label: 'Tồn kho thấp' },
    critical: { color: 'text-orange-600', bg: 'bg-orange-100', icon: IoWarning, label: 'Cảnh báo' },
    out_of_stock: { color: 'text-red-600', bg: 'bg-red-100', icon: IoWarning, label: 'Hết hàng' }
  };

  const priorityConfig = {
    low: { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Thấp' },
    medium: { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Trung bình' },
    high: { color: 'text-orange-600', bg: 'bg-orange-100', label: 'Cao' },
    urgent: { color: 'text-red-600', bg: 'bg-red-100', label: 'Khẩn cấp' }
  };

  const getStatusInfo = (status) => {
    return statusConfig[status] || statusConfig.normal;
  };

  const getPriorityInfo = (priority) => {
    return priorityConfig[priority] || priorityConfig.low;
  };

  const handleViewAlert = (alert) => {
    setSelectedAlert(alert);
    setShowAlertModal(true);
  };

  // Removed: create-alert feature per new requirement

  const getStockPercentage = (current, max) => {
    const denom = Math.max(1, Number(max || 0));
    const pct = Math.round((Number(current || 0) / denom) * 100);
    return Math.min(100, Math.max(0, pct));
  };

  const getStockColor = (percentage) => {
    if (percentage === 0) return 'bg-red-500';
    if (percentage < 20) return 'bg-orange-500';
    if (percentage < 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // Derived statistics and chart data (from overviewHistory)
  const dailyBuckets = useMemo(() => {
    const fmt = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${da}`;
    };

    // Parse filter dates if provided
    const startFilter = overviewStartDate ? new Date(overviewStartDate) : null;
    const endFilter = overviewEndDate ? new Date(overviewEndDate) : null;
    if (endFilter) endFilter.setHours(23, 59, 59, 999); // Include end of day

    const map = new Map();
    for (const r of overviewHistory) {
      // Apply date filter
      if (startFilter && r.date < startFilter) continue;
      if (endFilter && r.date > endFilter) continue;

      const k = fmt(r.date);
      const cur = map.get(k) || { in: 0, out: 0, net: 0, count: 0 };
      const change = Number(r.change || 0);

      if (change > 0) {
        cur.in += change;
      } else if (change < 0) {
        cur.out += Math.abs(change);
      }
      cur.net += change;
      cur.count += 1;
      map.set(k, cur);
    }
    const entries = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));

    return entries;
  }, [overviewHistory, overviewStartDate, overviewEndDate]);

  const overviewCategories = useMemo(() => dailyBuckets.map(([k]) => k), [dailyBuckets]);
  const inSeries = useMemo(() => dailyBuckets.map(([, v]) => v.in), [dailyBuckets]);
  const outSeries = useMemo(() => dailyBuckets.map(([, v]) => v.out), [dailyBuckets]);
  const netSeries = useMemo(() => dailyBuckets.map(([, v]) => v.net), [dailyBuckets]);
  const overviewTotals = useMemo(() => {
    const sum = (arr) => arr.reduce((a, b) => a + Number(b || 0), 0);
    const totalIn = sum(inSeries);
    const totalOut = sum(outSeries);
    const net = sum(netSeries);
    return { totalIn, totalOut, net };
  }, [inSeries, outSeries, netSeries]);

  // Build quick lookup: variantId -> product name (from alerts)
  const alertsNameByVariant = useMemo(() => {
    const m = new Map();
    (alerts || []).forEach(a => {
      const vid = String(a.variantId || a.id);
      if (!m.has(vid) && a.product) m.set(vid, a.product);
    });
    return m;
  }, [alerts]);

  // Variants list to display in selector (merge fallback from alerts if needed)
  const variantList = useMemo(() => {
    if (allVariants && allVariants.length > 0) {
      return allVariants.map(v => ({
        ...v,
        product: v.product && v.product.trim() ? v.product : (alertsNameByVariant.get(String(v.variantId)) || ''),
      }));
    }
    // fallback: derive from alerts
    return (alerts || []).map(a => ({
      variantId: a.variantId || a.id,
      product: a.product,
      sku: a.sku,
      currentStock: a.currentStock,
      minStock: a.minStock,
      category: a.category,
    }));
  }, [allVariants, alertsNameByVariant, alerts]);

  // Apply search filter
  const filteredVariants = useMemo(() => {
    const term = (variantSearch || '').toLowerCase().trim();
    if (!term) return variantList;
    return variantList.filter(v =>
      String(v.product || '').toLowerCase().includes(term) ||
      String(v.sku || '').toLowerCase().includes(term) ||
      String(v.variantId || '').toLowerCase().includes(term)
    );
  }, [variantList, variantSearch]);

  // Group filtered variants by product name for easier selection
  const groupedFilteredVariants = useMemo(() => {
    // Build a map: productId -> productName (prefer non-empty, fallback to alert, fallback to 'Sản phẩm [id]')
    const productIdToName = {};
    (allVariants || []).forEach(v => {
      if (v.productId && v.product && v.product.trim()) productIdToName[v.productId] = v.product;
    });
    (alerts || []).forEach(a => {
      if (a.productId && a.product && a.product.trim() && !productIdToName[a.productId]) productIdToName[a.productId] = a.product;
    });

    // Group by productId
    const groups = new Map();
    filteredVariants.forEach(v => {
      const pid = v.productId || v.product_id || v.productID || v.product || v.productName || v.productname || v.productid || v.sanPhamId || v.sanphamId || v.san_pham_id;
      let name = v.product && v.product.trim() ? v.product : undefined;
      if (!name && pid && productIdToName[pid]) name = productIdToName[pid];
      if (!name && pid) name = `Sản phẩm ${pid}`;
      if (!name) name = '(Chưa rõ tên sản phẩm)';
      if (!groups.has(name)) groups.set(name, []);
      groups.get(name).push(v);
    });
    return Array.from(groups.entries()).map(([productName, items]) => ({ productName, items }))
      .sort((a, b) => a.productName.localeCompare(b.productName, 'vi'));
  }, [filteredVariants, allVariants, alerts]);

  // Generate random color for products (avoid green and red hues used for In/Out)
  const getProductColor = (seed) => {
    // Avoid green (100-140) and red (0-20, 340-360) hues
    const avoidRanges = [[0, 20], [100, 140], [340, 360]];
    let hue = ((seed * 137.5) % 360);
    
    // Check if hue falls in avoid ranges, shift it
    for (const [start, end] of avoidRanges) {
      if (hue >= start && hue <= end) {
        hue = (hue + 80) % 360; // Shift by 80 degrees
        break;
      }
    }
    
    // Use vibrant colors: high saturation (65-75%), medium lightness (45-55%)
    const saturation = 65 + (seed % 10);
    const lightness = 45 + (seed % 10);
    return `hsl(${Math.round(hue)}, ${saturation}%, ${lightness}%)`;
  };

  // Multi-product comparison stats (variant or product mode)
  const comparisonData = useMemo(() => {
    const fmt = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${da}`;
    };

    // Collect all dates from all selected products
    const allDates = new Set();
    Object.values(productsHistory).forEach(historyData => {
      // Check if it's an array (old format) or object (new API format)
      if (Array.isArray(historyData)) {
        historyData.forEach(r => allDates.add(fmt(r.date)));
      }
    });
    const sortedDates = Array.from(allDates).sort();

    if (compareMode === 'variant') {
      // Build series for each product variant (default)
      const series = selectedProductIds.map(id => {
        const historyData = productsHistory[id];
        const variant = (allVariants || []).find(v => String(v.variantId) === String(id))
          || (alerts || []).find(a => String(a.variantId || a.id) === String(id));
        const productName = variant?.product || `SP ${id}`;
        const sku = variant?.sku || '';
        // Create unique display name: product name + SKU or variant ID
        const displayName = sku ? `${productName} (${sku})` : `${productName} - BT${id}`;
        const colorHueSeed = String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
        const color = getProductColor(colorHueSeed);

        // Check if historyData is from new API (object with totals) or old format (array)
        if (historyData && !Array.isArray(historyData) && typeof historyData === 'object' && 'totalIn' in historyData) {
          // New API format: just totals, no daily data
          return {
            id,
            name: displayName,
            productName,
            sku,
            color,
            inData: [],
            outData: [],
            stockData: [],
            totalIn: historyData.totalIn || 0,
            totalOut: historyData.totalOut || 0,
            currentStock: variant?.currentStock || 0,
          };
        }

        // Old format: array of history records
        const history = Array.isArray(historyData) ? historyData : [];
        
        // Create daily buckets for this product
        const map = new Map();
        history.forEach(r => {
          const k = fmt(r.date);
          const cur = map.get(k) || { in: 0, out: 0, stock: r.after };
          const change = Number(r.change || 0);
          if (change >= 0) cur.in += change; else cur.out += Math.abs(change);
          cur.stock = r.after;
          map.set(k, cur);
        });

        // Map to sorted dates
        const inData = sortedDates.map(d => map.get(d)?.in || 0);
        const outData = sortedDates.map(d => map.get(d)?.out || 0);
        const stockData = sortedDates.map(d => map.get(d)?.stock || 0);

        // Calculate totals
        const totalIn = history.reduce((sum, h) => sum + (h.change >= 0 ? h.change : 0), 0);
        const totalOut = history.reduce((sum, h) => sum + (h.change < 0 ? Math.abs(h.change) : 0), 0);
        const currentStock = history.length > 0 ? history[history.length - 1].after : 0;

        return {
          id,
          name: displayName,
          productName,
          sku,
          color,
          inData,
          outData,
          stockData,
          totalIn,
          totalOut,
          currentStock,
        };
      });
      return { categories: sortedDates, series };
    } else {
      // Group selectedProductIds by productName (from groupedFilteredVariants)
      // For each product group, sum all variants' data
      // Build: productName -> [variantIds]
      const productGroups = {};
      groupedFilteredVariants.forEach(group => {
        const ids = group.items.map(v => v.variantId).filter(id => selectedProductIds.includes(id));
        if (ids.length > 0) productGroups[group.productName] = ids;
      });
      // For each product group, sum all variants' history by date
      const series = Object.entries(productGroups).map(([productName, ids], idx) => {
        // Check if we have new API data (totalIn/totalOut per product)
        // Look for any historyData that has totalIn/totalOut (new API format)
        const firstHistoryData = ids.map(id => productsHistory[id]).find(h => h && !Array.isArray(h) && 'totalIn' in h);
        
        if (firstHistoryData) {
          // New API format: sum totals from all variants in this product
          let totalIn = 0;
          let totalOut = 0;
          let totalStock = 0;
          ids.forEach(id => {
            const data = productsHistory[id];
            if (data && !Array.isArray(data) && typeof data === 'object') {
              totalIn += data.totalIn || 0;
              totalOut += data.totalOut || 0;
              const variant = (allVariants || []).find(v => String(v.variantId) === String(id));
              totalStock += variant?.currentStock || 0;
            }
          });
          const colorSeed = productName.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + idx;
          const color = getProductColor(colorSeed);
          return {
            id: productName,
            name: productName,
            color,
            inData: [],
            outData: [],
            stockData: [],
            totalIn,
            totalOut,
            currentStock: totalStock,
          };
        }
        
        // Old format: array histories
        // Gather all histories for variants in this group
        const histories = ids.map(id => {
          const h = productsHistory[id];
          return Array.isArray(h) ? h : [];
        });
        // Flatten all records
        const allRecords = histories.flat();
        // Group by date
        const dateMap = new Map();
        allRecords.forEach(r => {
          const k = fmt(r.date);
          const cur = dateMap.get(k) || { in: 0, out: 0, stock: 0, count: 0 };
          const change = Number(r.change || 0);
          if (change >= 0) cur.in += change; else cur.out += Math.abs(change);
          cur.stock += r.after;
          cur.count += 1;
          dateMap.set(k, cur);
        });
        // Map to sorted dates
        const inData = sortedDates.map(d => dateMap.get(d)?.in || 0);
        const outData = sortedDates.map(d => dateMap.get(d)?.out || 0);
        // Stock: lấy trung bình tồn kho các biến thể (hoặc tổng, tùy ý)
        const stockData = sortedDates.map(d => {
          const v = dateMap.get(d);
          return v ? Math.round(v.stock / Math.max(1, v.count)) : 0;
        });
        // Tính tổng nhập/xuất
        const totalIn = inData.reduce((a, b) => a + b, 0);
        const totalOut = outData.reduce((a, b) => a + b, 0);
        // Lấy tồn kho hiện tại (trung bình cuối cùng)
        const currentStock = stockData.length > 0 ? stockData[stockData.length - 1] : 0;
        // Màu ổn định
        const color = `hsl(${(idx * 137.5) % 360}, 70%, 50%)`;
        return {
          id: productName,
          name: productName,
          color,
          inData,
          outData,
          stockData,
          totalIn,
          totalOut,
          currentStock,
        };
      });
      return { categories: sortedDates, series };
    }
    // Remove compareMode from dependency array to avoid react-hooks/exhaustive-deps warning (compareMode is a state, always triggers re-render)
  }, [selectedProductIds, productsHistory, alerts, allVariants, groupedFilteredVariants, compareMode]);

  // Handle product selection change
  useEffect(() => {
    if (selectedProductIds.length > 0) {
      fetchProductsHistory(selectedProductIds);
    } else {
      setProductsHistory({});
    }
  }, [selectedProductIds, fetchProductsHistory]);

  // Toggle product selection
  const toggleProductSelection = (productId) => {
    setSelectedProductIds(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cảnh báo tồn kho</h1>
          <p className="text-gray-600">Theo dõi và quản lý cảnh báo tồn kho</p>
        </div>

        {/* Summary Cards */}
        {isLoading && (
          <div className="mb-6">
            <div className="bg-white rounded-lg shadow-sm p-4 text-center">Đang tải dữ liệu tồn kho...</div>
          </div>
        )}
        {error && (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">Lỗi khi tải dữ liệu cảnh báo: {String(error)}</div>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <IoWarning className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cảnh báo khẩn cấp</p>
                <p className="text-2xl font-bold text-gray-900">{alerts.filter(a => a.priority === 'urgent').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <IoTime className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tồn kho thấp</p>
                <p className="text-2xl font-bold text-gray-900">{alerts.filter(a => a.status === 'low_stock').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <IoCheckmarkCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Bình thường</p>
                <p className="text-2xl font-bold text-gray-900">{alerts.filter(a => a.status === 'normal').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <IoNotifications className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng cảnh báo</p>
                <p className="text-2xl font-bold text-gray-900">{alerts.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts List */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Danh sách cảnh báo</h3>
            <div className="flex items-center space-x-2">
              <button onClick={fetchAlerts} className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <IoRefresh className="w-4 h-4" />
                Làm mới
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tồn kho
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ưu tiên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nhà cung cấp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tạo bởi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {alerts.map((alert) => {
                  const statusInfo = getStatusInfo(alert.status);
                  const priorityInfo = getPriorityInfo(alert.priority);
                  const StatusIcon = statusInfo.icon;
                  const stockPercentage = getStockPercentage(alert.currentStock, alert.maxStock);

                  return (
                    <tr key={alert.variantId || alert.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{alert.product}</div>
                        <div className="text-sm text-gray-500">Mã BT: {alert.variantId} • {alert.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-3">
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{alert.currentStock}</span>
                              <span className="text-gray-500">/{alert.maxStock}</span>
                            </div>
                            <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                              <div
                                className={`h-2 rounded-full ${getStockColor(stockPercentage)}`}
                                style={{ width: `${stockPercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityInfo.bg} ${priorityInfo.color}`}>
                          {priorityInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {alert.supplier}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {alert.createdBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewAlert(alert)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <IoEye className="w-4 h-4" />
                          </button>
                          <button className="text-green-600 hover:text-green-800">
                            <IoCreate className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-800">
                            <IoTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alert Settings removed per requirement */}

        {/* Thống kê & Biểu đồ (nguồn: Lịch sử tồn kho) */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Thống kê & Biểu đồ (từ lịch sử tồn kho)</h3>
            </div>
            {/* Date Filter */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Từ ngày:</label>
                <input
                  type="date"
                  value={overviewStartDate}
                  onChange={(e) => setOverviewStartDate(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Đến ngày:</label>
                <input
                  type="date"
                  value={overviewEndDate}
                  onChange={(e) => setOverviewEndDate(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              {(overviewStartDate || overviewEndDate) && (
                <button
                  onClick={() => {
                    setOverviewStartDate('');
                    setOverviewEndDate('');
                  }}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Xóa lọc
                </button>
              )}
            </div>
          </div>
          <div className="p-6 space-y-6">
            {isOverviewLoading && (
              <div className="text-sm text-gray-500">Đang tải lịch sử tồn kho tổng quan...</div>
            )}
            {overviewError && (
              <div className="text-sm text-red-600">Lỗi tải lịch sử: {String(overviewError)}</div>
            )}
            {!isOverviewLoading && !overviewError && overviewCategories.length === 0 && (
              <div className="text-sm text-gray-500">Chưa có dữ liệu lịch sử để hiển thị biểu đồ.</div>
            )}
            {!isOverviewLoading && overviewCategories.length > 0 && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Khối lượng Nhập (+) vs Xuất (-) theo ngày</span>
                    <div className="inline-flex rounded-md border border-gray-300 overflow-hidden">
                      <button
                        className={`px-2 py-1 text-xs ${overviewMode === 'bar' ? 'bg-gray-200 text-gray-900' : 'bg-white text-gray-700'}`}
                        onClick={() => setOverviewMode('bar')}
                      >
                        Cột
                      </button>
                      <button
                        className={`px-2 py-1 text-xs ${overviewMode === 'line' ? 'bg-gray-200 text-gray-900' : 'bg-white text-gray-700'}`}
                        onClick={() => setOverviewMode('line')}
                      >
                        Đường
                      </button>
                    </div>
                  </div>
                  {overviewMode === 'bar' ? (
                    <MultiBarChart
                      categories={overviewCategories}
                      series={[
                        { label: 'Nhập (+)', color: '#16a34a', data: inSeries },
                        { label: 'Xuất (-)', color: '#dc2626', data: outSeries },
                      ]}
                      height={300}
                      showValues={true}
                      mode="bar"
                    />
                  ) : (
                    <MultiBarChart
                      categories={overviewCategories}
                      series={[
                        { label: 'Nhập (+)', color: '#16a34a', data: inSeries },
                        { label: 'Xuất (-)', color: '#dc2626', data: outSeries },
                      ]}
                      height={300}
                      showValues={false}
                      mode="line"
                    />
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Net thay đổi theo ngày</span>
                  </div>
                  <MultiLineChart
                    categories={overviewCategories}
                    series={[
                      { label: 'Net', color: '#2563eb', data: netSeries },
                      { label: 'Xuất (-)', color: '#dc2626', data: outSeries },
                    ]}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                  <div className="bg-emerald-50 text-emerald-700 rounded-lg p-3 text-sm">Tổng nhập (+): <span className="font-semibold">{overviewTotals.totalIn}</span></div>
                  <div className="bg-rose-50 text-rose-700 rounded-lg p-3 text-sm">Tổng xuất (-): <span className="font-semibold">{overviewTotals.totalOut}</span></div>
                  <div className="bg-blue-50 text-blue-700 rounded-lg p-3 text-sm">Net thay đổi: <span className="font-semibold">{overviewTotals.net}</span></div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* So sánh nhiều sản phẩm */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">So sánh sản phẩm</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Chế độ:</span>
                <button
                  className={`px-2 py-1 text-xs rounded-l border border-gray-300 ${compareMode === 'variant' ? 'bg-gray-200 text-gray-900' : 'bg-white text-gray-700'}`}
                  onClick={() => setCompareMode('variant')}
                >
                  Từng biến thể
                </button>
                <button
                  className={`px-2 py-1 text-xs rounded-r border border-gray-300 ${compareMode === 'product' ? 'bg-gray-200 text-gray-900' : 'bg-white text-gray-700'}`}
                  onClick={() => setCompareMode('product')}
                >
                  Tổng theo sản phẩm
                </button>
              </div>
            </div>
            <div className="text-sm text-gray-600 mb-3">
              Chọn nhiều sản phẩm để so sánh lịch sử nhập xuất và tình trạng tồn kho
            </div>

            {/* Thanh tìm kiếm */}
            <div className="mb-3 flex items-center gap-2">
              <input
                value={variantSearch}
                onChange={(e) => setVariantSearch(e.target.value)}
                placeholder="Tìm theo tên, SKU hoặc mã biến thể..."
                className="w-full max-w-xl px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-xs text-gray-500">{filteredVariants.length} kết quả</span>
            </div>

            {/* Multi-select theo nhóm sản phẩm */}
            <div className="max-h-80 overflow-y-auto border border-gray-300 rounded-lg">
              {isVariantsLoading ? (
                <div className="p-4 text-sm text-gray-500">Đang tải danh sách biến thể...</div>
              ) : variantsError ? (
                <div className="p-4 text-sm text-red-600">Lỗi tải danh sách: {String(variantsError)}</div>
              ) : groupedFilteredVariants.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">Không có sản phẩm nào</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {groupedFilteredVariants.map((group) => {
                    const allIds = group.items.map(v => v.variantId);
                    const allSelected = allIds.every(id => selectedProductIds.includes(id));
                    const someSelected = allIds.some(id => selectedProductIds.includes(id));
                    return (
                      <div key={group.productName}>
                        {/* Nhãn tên sản phẩm + group checkbox */}
                        <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-700 sticky top-0 z-10 flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={el => { if (el) el.indeterminate = !allSelected && someSelected; }}
                            onChange={e => {
                              if (e.target.checked) {
                                // Add all variants in group
                                setSelectedProductIds(prev => Array.from(new Set([...prev, ...allIds])));
                              } else {
                                // Remove all variants in group
                                setSelectedProductIds(prev => prev.filter(id => !allIds.includes(id)));
                              }
                            }}
                            className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                          />
                          {group.productName}
                        </div>
                        {/* Danh sách biến thể của sản phẩm */}
                        {group.items.map((v) => (
                          <label
                            key={v.variantId}
                            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={selectedProductIds.includes(v.variantId)}
                              onChange={() => toggleProductSelection(v.variantId)}
                              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-gray-500">
                                Mã biến thể: <span className="font-medium text-gray-700">{v.variantId}</span> • SKU: {v.sku || '—'} • Tồn: {v.currentStock}
                              </div>
                            </div>
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: getProductColor(String(v.variantId).split('').reduce((a, c) => a + c.charCodeAt(0), 0)) }}
                            />
                          </label>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {selectedProductIds.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm text-gray-700">
                  Đã chọn: <span className="font-semibold">{selectedProductIds.length}</span> sản phẩm
                </span>
                <button
                  onClick={() => setSelectedProductIds([])}
                  className="text-sm text-red-600 hover:text-red-700 font-medium"
                >
                  Bỏ chọn tất cả
                </button>
              </div>
            )}
          </div>

          <div className="p-6 space-y-6">
            {selectedProductIds.length === 0 && (
              <div className="text-sm text-gray-500 text-center py-8">
                Vui lòng chọn ít nhất một sản phẩm để xem chi tiết và so sánh
              </div>
            )}

            {selectedProductIds.length > 0 && isProductHistoryLoading && (
              <div className="text-sm text-gray-500">Đang tải lịch sử sản phẩm...</div>
            )}

            {selectedProductIds.length > 0 && productHistoryError && (
              <div className="text-sm text-red-600">Lỗi tải lịch sử: {String(productHistoryError)}</div>
            )}

            {selectedProductIds.length > 0 && !isProductHistoryLoading && comparisonData.series.length > 0 && (
              <>
                {/* Thống kê từng sản phẩm */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {comparisonData.series.map((product) => (
                    <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: product.color }}
                        />
                        <h4 className="text-sm font-semibold text-gray-900 truncate">{product.name}</h4>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Tổng nhập:</span>
                          <span className="font-semibold text-green-600">{product.totalIn}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Tổng xuất:</span>
                          <span className="font-semibold text-red-600">{product.totalOut}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Tồn hiện tại:</span>
                          <span className="font-semibold text-blue-600">{product.currentStock}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Biểu đồ so sánh nhập */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">So sánh lượng nhập theo ngày</span>
                  </div>
                  <MultiBarChart
                    categories={comparisonData.categories}
                    series={comparisonData.series.map(p => ({
                      label: p.name,
                      color: p.color, // mỗi sản phẩm một màu riêng
                      data: p.inData,
                    }))}
                    height={300}
                    showValues={true}
                  />
                </div>

                {/* Biểu đồ so sánh xuất */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">So sánh lượng xuất theo ngày</span>
                  </div>
                  <MultiBarChart
                    categories={comparisonData.categories}
                    series={comparisonData.series.map(p => ({
                      label: p.name,
                      color: p.color, // mỗi sản phẩm một màu riêng
                      data: p.outData,
                    }))}
                    height={300}
                    showValues={true}
                  />
                </div>

                {/* Biểu đồ so sánh tồn kho */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">So sánh biến động tồn kho</span>
                  </div>
                  <MultiLineChart
                    categories={comparisonData.categories}
                    series={comparisonData.series.map(p => ({
                      label: p.name,
                      color: p.color,
                      data: p.stockData,
                    }))}
                  />
                </div>

                {/* Bảng so sánh tổng hợp */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Bảng so sánh tổng hợp</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border border-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Sản phẩm</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Tổng nhập</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Tổng xuất</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Net</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Tồn hiện tại</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {comparisonData.series.map((product) => (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: product.color }}
                                />
                                <span className="font-medium text-gray-900">{product.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-right text-green-600 font-semibold">
                              {product.totalIn}
                            </td>
                            <td className="px-4 py-2 text-right text-red-600 font-semibold">
                              {product.totalOut}
                            </td>
                            <td className={`px-4 py-2 text-right font-semibold ${(product.totalIn - product.totalOut) >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                              {product.totalIn - product.totalOut}
                            </td>
                            <td className="px-4 py-2 text-right text-blue-600 font-bold">
                              {product.currentStock}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Alert Detail Modal */}
        {showAlertModal && selectedAlert && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Chi tiết cảnh báo
                  </h3>
                  <button
                    onClick={() => setShowAlertModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <IoRefresh className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Product Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Thông tin sản phẩm</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Tên sản phẩm:</span>
                          <span className="text-sm font-medium">{selectedAlert.product}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">SKU:</span>
                          <span className="text-sm font-medium">{selectedAlert.sku}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Danh mục:</span>
                          <span className="text-sm font-medium">{selectedAlert.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Nhà cung cấp:</span>
                          <span className="text-sm font-medium">{selectedAlert.supplier}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Thông tin tồn kho</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Tồn kho hiện tại:</span>
                          <span className="text-sm font-medium">{selectedAlert.currentStock}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Tồn kho tối thiểu:</span>
                          <span className="text-sm font-medium">{selectedAlert.minStock}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Lần nhập cuối:</span>
                          <span className="text-sm font-medium">{selectedAlert.lastRestock}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stock History */}
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-3">Lịch sử tồn kho</h4>
                    {isHistoryLoading && (
                      <div className="text-sm text-gray-500">Đang tải lịch sử...</div>
                    )}
                    {historyError && (
                      <div className="text-sm text-red-600">Lỗi tải lịch sử: {String(historyError)}</div>
                    )}
                    {!isHistoryLoading && !historyError && history.length === 0 && (
                      <div className="text-sm text-gray-500">Chưa có dữ liệu lịch sử.</div>
                    )}
                    {!isHistoryLoading && history.length > 0 && (
                      <div className="space-y-4">
                        {/* Chart: Số lượng sau theo thời gian */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Số lượng sau</span>
                          </div>
                          <StockLineChart data={history} field="after" color="#2563eb" />
                        </div>
                        {/* Chart: Chênh lệch theo thời gian */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">Chênh lệch</span>
                          </div>
                          <StockLineChart data={history} field="change" color="#f59e0b" />
                        </div>
                        {/* Latest 6 records table */}
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-left text-gray-500">
                                <th className="py-2 pr-4">Thời gian</th>
                                <th className="py-2 pr-4">Loại</th>
                                <th className="py-2 pr-4">Trước</th>
                                <th className="py-2 pr-4">Chênh lệch</th>
                                <th className="py-2">Sau</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                              {history.slice(-6).reverse().map((h, idx) => (
                                <tr key={idx}>
                                  <td className="py-2 pr-4 text-gray-900">{h.date.toLocaleString()}</td>
                                  <td className="py-2 pr-4 text-gray-700">{h.type}</td>
                                  <td className="py-2 pr-4 text-gray-700">{h.before}</td>
                                  <td className={`py-2 pr-4 ${h.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>{h.change}</td>
                                  <td className="py-2 text-gray-900 font-medium">{h.after}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => setShowAlertModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Đóng
                    </button>
                    <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                      Cập nhật tồn kho
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

// Lightweight line chart using SVG (no external deps)
const StockLineChart = ({ data, field, width = 560, height = 140, color = '#2563eb', padding = 24 }) => {
  if (!data || data.length === 0) return null;
  const xs = data.map(d => d.date.getTime());
  const ys = data.map(d => Number(d[field] ?? 0));
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const rangeY = maxY - minY || 1;

  const points = data.map(d => {
    const x = padding + ((d.date.getTime() - minX) / Math.max(1, (maxX - minX))) * (width - padding * 2);
    const y = height - padding - ((Number(d[field] ?? 0) - minY) / rangeY) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  // axes
  const axisColor = '#E5E7EB';
  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
      {/* axes */}
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke={axisColor} strokeWidth="1" />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke={axisColor} strokeWidth="1" />
      {/* path */}
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
    </svg>
  );
};

export default InventoryAlerts;

// Generic multi-line chart over categorical X (indices), using SVG
const MultiLineChart = ({ categories = [], series = [], width = 720, height = 260, padding = 36 }) => {
  const n = categories.length;
  if (!n || !series || series.length === 0) return null;
  const allValues = series.flatMap(s => s.data || []);
  const minVal = Math.min(...allValues, 0);
  const maxVal = Math.max(...allValues, 0);
  const rangeY = maxVal - minVal || 1;

  const axisColor = '#E5E7EB';
  const paddingLeft = 60; // Increase left padding for Y-axis labels

  const xFor = (i) => paddingLeft + (n === 1 ? 0.5 : (i / Math.max(1, n - 1))) * (width - paddingLeft - padding);
  const yFor = (v) => height - padding - ((v - minVal) / rangeY) * (height - padding * 2);

  const maxLabels = 8;
  const rotation = n > maxLabels ? 30 : 0;
  
  // Y-axis ticks (create 5 evenly spaced ticks)
  const yTicks = 5;
  const yTickValues = Array.from({ length: yTicks }, (_, i) => {
    return minVal + (rangeY / (yTicks - 1)) * i;
  });

  return (
    <div className="w-full">
      <div className="w-full overflow-x-auto">
        <svg width="100%" viewBox={`0 0 ${width} ${height}`}>
          {/* Y-axis grid lines and labels */}
          {yTickValues.map((val, i) => {
            const y = yFor(val);
            return (
              <g key={`y-tick-${i}`}>
                {/* Grid line */}
                <line 
                  x1={paddingLeft} 
                  y1={y} 
                  x2={width - padding} 
                  y2={y} 
                  stroke={axisColor} 
                  strokeWidth="1" 
                  strokeDasharray="4,4"
                  opacity={0.5}
                />
                {/* Y-axis label */}
                <text 
                  x={paddingLeft - 10} 
                  y={y + 4} 
                  fontSize="10" 
                  textAnchor="end" 
                  fill="#6B7280"
                  fontWeight="500"
                >
                  {Math.round(val)}
                </text>
              </g>
            );
          })}
          
          {/* axes */}
          <line x1={paddingLeft} y1={height - padding} x2={width - padding} y2={height - padding} stroke={axisColor} strokeWidth="2" />
          <line x1={paddingLeft} y1={padding} x2={paddingLeft} y2={height - padding} stroke={axisColor} strokeWidth="2" />
          {/* optional zero line */}
          {minVal < 0 && maxVal > 0 && (
            <line x1={paddingLeft} y1={yFor(0)} x2={width - padding} y2={yFor(0)} stroke="#CBD5E1" strokeDasharray="4 4" />
          )}
          {/* polylines */}
          {series.map((s, idx) => {
            const pts = (s.data || []).map((v, i) => `${xFor(i)},${yFor(Number(v || 0))}`).join(' ');
            return (
              <g key={`line-${idx}`}>
                <polyline fill="none" stroke={s.color || '#2563eb'} strokeWidth="2.5" points={pts} opacity={0.9} />
                {/* Data point dots */}
                {(s.data || []).map((v, i) => (
                  <circle
                    key={`dot-${idx}-${i}`}
                    cx={xFor(i)}
                    cy={yFor(Number(v || 0))}
                    r="4"
                    fill="white"
                    stroke={s.color || '#2563eb'}
                    strokeWidth="2"
                  />
                ))}
              </g>
            );
          })}
          {/* simple x ticks (show at most 8 labels) */}
          {categories.map((c, i) => {
            const step = Math.ceil(n / maxLabels);
            if (i % step !== 0 && i !== n - 1) return null;
            const x = xFor(i);
            const label = String(c).length > 12 ? String(c).slice(0, 11) + '…' : String(c);
            if (rotation) {
              return (
                <g key={i}>
                  <line x1={x} y1={height - padding} x2={x} y2={height - padding + 4} stroke={axisColor} strokeWidth="1" />
                  <text
                    transform={`translate(${x}, ${height - padding + 14}) rotate(${rotation})`}
                    fontSize="10"
                    textAnchor="end"
                    fill="#6B7280"
                    fontWeight="500"
                  >
                    {label}
                  </text>
                </g>
              );
            }
            return (
              <g key={i}>
                <line x1={x} y1={height - padding} x2={x} y2={height - padding + 4} stroke={axisColor} strokeWidth="1" />
                <text x={x} y={height - padding + 16} fontSize="10" textAnchor="middle" fill="#6B7280" fontWeight="500">{label}</text>
              </g>
            );
          })}
        </svg>
      </div>
      {/* Wrapped legend below the chart to avoid overlap */}
      <div className="flex flex-wrap gap-3 mt-2">
        {series.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-sm" title={s.label || `Series ${i + 1}`}>
            <span className="inline-block w-8 h-0.5" style={{ backgroundColor: s.color || '#2563eb' }} />
            <span className="text-gray-700">
              {(s.label || `Series ${i + 1}`).length > 32
                ? (s.label || `Series ${i + 1}`).slice(0, 31) + '…'
                : (s.label || `Series ${i + 1}`)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};


