import React, { useState, useEffect } from 'react';
import {
  IoAdd,
  IoPencilOutline,
  IoSearch,
  IoFilterOutline,
  IoCalendarOutline,
  IoTimeOutline,
  IoCloseCircle,
  IoGiftOutline,
  IoStatsChartOutline,
  IoEyeOutline,
  IoPlayOutline,
  IoPauseOutline,
  IoStopOutline
} from 'react-icons/io5';
import Modal from '../../shared/Modal';
import Toast from '../../shared/Toast';
import api from '../../../api';

const DiscountManagement = () => {
  const [discountPrograms, setDiscountPrograms] = useState([]);
  const [filteredPrograms, setFilteredPrograms] = useState([]);
  const [products, setProducts] = useState([]); // Danh sách sản phẩm
  const [selectedProducts, setSelectedProducts] = useState([]); // Sản phẩm được chọn
  const [productVariants, setProductVariants] = useState({}); // Map maSanPham -> variants[]
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingVariants, setIsLoadingVariants] = useState(false);
  const [error, setError] = useState(null);

  // (mapping helper removed - we map server responses directly in the fetch)

  const [showModal, setShowModal] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [formData, setFormData] = useState({
    tenChuongTrinh: '',
    moTa: '',
    ngayBatDau: '',
    ngayKetThuc: '',
    // canonical keys for UI: 'upcoming' | 'active' | 'paused' | 'expired'
    trangThai: 'upcoming'
  });
  const [variantDiscounts, setVariantDiscounts] = useState([]);
  const [discountType, setDiscountType] = useState('amount'); // 'amount' or 'percent'
  const [discountValue, setDiscountValue] = useState(''); // Giá trị giảm (% hoặc số tiền)
  const [lastPayload, setLastPayload] = useState(null); // debug: last POST/PUT payload
  const [filters, setFilters] = useState({
    searchTerm: '',
    status: 'all',
    dateRange: 'all',
    startDate: '',
    endDate: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [activeProduct, setActiveProduct] = useState(null); // product currently showing variants in right column
  const [selectedProductVariantIds, setSelectedProductVariantIds] = useState([]); // variant ids selected in right column

  // Load discount programs and products from backend
  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch program list with details (includes danhSachBienThe and tongTietKiem)
        const programs = await api.get('/api/chuongtrinh-giamgia?details=true');

        // programs should be an array of basic ChuongTrinhGiamGia objects
        const mappedPrograms = Array.isArray(programs)
          ? programs.map(p => ({
            id: p.maChuongTrinhGiamGia,
            maChuongTrinhGiamGia: p.maChuongTrinhGiamGia,
            tenChuongTrinh: p.tenChuongTrinh,
            ngayBatDau: p.ngayBatDau,
            ngayKetThuc: p.ngayKetThuc,
            status: normalizeStatus(p.trangThai),
            statusText: p.trangThai || '',
            // Map server-provided danhSachBienThe into UI-friendly structure
            bienTheGiamGias: (p.danhSachBienThe || []).map(bt => ({
              maBienThe: bt.maBienThe,
              giaSauGiam: bt.giaSauGiam,
              giaGoc: bt.giaGoc || 0,
              thuocTinh: bt.skuBienThe || '',
              sku: bt.skuBienThe || '',
              tenSanPham: bt.tenSanPham || bt.tenSanPhamGoc || null,
              phanTramGiam: bt.phanTramGiam || null
            })),
            soLuongBienThe: p.soLuongBienThe || (p.danhSachBienThe ? p.danhSachBienThe.length : 0),
            tongTietKiem: p.tongTietKiem || 0
          }))
          : [];

        // Fetch all products
        let productsList = [];
        try {
          const productsResp = await api.get('/api/products');
          if (Array.isArray(productsResp)) {
            productsList = productsResp.map(p => ({
              maSanPham: p.maSanPham,
              tenSanPham: p.tenSanPham,
              moTa: p.moTa,
              hinhAnh: p.hinhAnh
            }));
          }
        } catch (e) {

        }

        if (!mounted) return;
        setDiscountPrograms(mappedPrograms);
        setFilteredPrograms(mappedPrograms);
        setProducts(productsList);
      } catch (err) {
        setError(err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchData();
    return () => { mounted = false; };
  }, []);

  // Fetch variants for a specific product
  // eslint-disable-next-line no-unused-vars
  const fetchProductVariants = async (maSanPham) => {
    // Return already loaded variants to callers
    if (productVariants[maSanPham]) return productVariants[maSanPham]; // Already loaded

    setIsLoadingVariants(true);
    try {
      const variants = await api.get(`/api/products/${maSanPham}/variants`);
      if (Array.isArray(variants)) {
        const mapped = variants.map(v => ({
          maBienThe: v.maBienThe,
          sku: v.sku,
          giaBan: v.giaBan,
          soLuongTon: v.soLuongTon,
          thuocTinh: v.bienTheThuocTinhs?.map(bt => bt.giaTri).filter(Boolean).join(', ') || ''
        }));
        setProductVariants(prev => ({
          ...prev,
          [maSanPham]: mapped
        }));
        return mapped;
      }
      return [];
    } catch (err) {
      return [];
    } finally {
      setIsLoadingVariants(false);
    }
  };

  // When activeProduct changes (or variantDiscounts change), ensure variants are loaded
  // and pre-select any variants that are already present in variantDiscounts.
  useEffect(() => {
    let mounted = true;
    const syncSelectedVariants = async () => {
      // Determine which products we should show variants for: selectedProducts (if any) else activeProduct
      const productList = (selectedProducts && selectedProducts.length > 0) ? selectedProducts : (activeProduct ? [activeProduct] : []);
      if (productList.length === 0) {
        if (mounted) setSelectedProductVariantIds([]);
        return;
      }

      // For multi-select, aggregate variants across products
      let variants = [];
      for (const p of productList) {
        const ma = p.maSanPham;
        let local = productVariants[ma];
        if (!local) {
          setIsLoadingVariants(true);
          try {
            const resp = await api.get(`/api/products/${ma}/variants`);
            if (Array.isArray(resp)) {
              local = resp.map(v => ({
                maBienThe: v.maBienThe,
                sku: v.sku,
                giaBan: v.giaBan,
                soLuongTon: v.soLuongTon,
                thuocTinh: v.bienTheThuocTinhs?.map(bt => bt.giaTri).filter(Boolean).join(', ') || ''
              }));
              // store into cache
              setProductVariants(prev => ({ ...prev, [ma]: local }));
            } else {
              local = [];
            }
          } catch (err) {
            local = [];
          } finally {
            setIsLoadingVariants(false);
          }
        }
        if (Array.isArray(local) && local.length > 0) {
          variants = variants.concat(local);
        }
      }
      if (!mounted) return;

      // Determine which variants (by id) are already in variantDiscounts
      const existingIds = (variantDiscounts || []).map(vd => vd.maBienThe);
      const preChecked = variants
        .filter(v => existingIds.includes(v.maBienThe))
        .map(v => v.maBienThe);

      if (mounted) setSelectedProductVariantIds(preChecked);
    };

    syncSelectedVariants();
    return () => { mounted = false; };
  }, [activeProduct, variantDiscounts, productVariants, selectedProducts]);

  // Filter and search functionality
  useEffect(() => {
    let filtered = discountPrograms;

    if (filters.searchTerm) {
      filtered = filtered.filter(program =>
        program.tenChuongTrinh.toLowerCase().includes(filters.searchTerm.toLowerCase())
      );
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(program => program.status === filters.status);
    }

    // Custom date range filter
    if (filters.startDate || filters.endDate) {
      filtered = filtered.filter(program => {
        const programStart = new Date(program.ngayBatDau);
        const programEnd = new Date(program.ngayKetThuc);
        
        if (filters.startDate && filters.endDate) {
          const filterStart = new Date(filters.startDate);
          const filterEnd = new Date(filters.endDate);
          // Program overlaps with filter range
          return programStart <= filterEnd && programEnd >= filterStart;
        } else if (filters.startDate) {
          const filterStart = new Date(filters.startDate);
          return programEnd >= filterStart;
        } else if (filters.endDate) {
          const filterEnd = new Date(filters.endDate);
          return programStart <= filterEnd;
        }
        return true;
      });
    } else if (filters.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      switch (filters.dateRange) {
        case 'this-week':
          const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(program =>
            new Date(program.ngayBatDau) >= thisWeek
          );
          break;
        case 'this-month':
          const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          filtered = filtered.filter(program =>
            new Date(program.ngayBatDau) >= thisMonth
          );
          break;
        case 'next-month':
          const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
          const monthAfter = new Date(now.getFullYear(), now.getMonth() + 2, 1);
          filtered = filtered.filter(program =>
            new Date(program.ngayBatDau) >= nextMonth &&
            new Date(program.ngayBatDau) < monthAfter
          );
          break;
        default:
          break;
      }
    }

    setFilteredPrograms(filtered);
  }, [discountPrograms, filters]);

  const showToast = (message, type = 'success') => {
    // Use global Toast API (default export) which exposes show/showError/showSuccess helpers
    try {
      if (type === 'error') Toast.show(message, 'error');
      else if (type === 'warning') Toast.show(message, 'warning');
      else if (type === 'info') Toast.show(message, 'info');
      else Toast.show(message, 'success');
    } catch (e) {

    }
  };

  const formatDateTime = (dateString) => {
    // Handle empty or invalid inputs gracefully to avoid RangeError: Invalid time value
    if (!dateString && dateString !== 0) return '-';

    // Support numeric timestamps (seconds or milliseconds) and ISO strings
    let dateObj;
    try {
      // Accept arrays like [2025,10,16,14,30,0] (Jackson default for LocalDateTime)
      if (Array.isArray(dateString)) {
        const [y, m, d, hh = 0, mm = 0, ss = 0] = dateString;
        dateObj = new Date(y, m - 1, d, hh, mm, ss);
      } else if (typeof dateString === 'number') {
        // If looks like seconds (10 digits), convert to ms
        dateObj = dateString.toString().length === 10 ? new Date(dateString * 1000) : new Date(dateString);
      } else if (/^\d+$/.test(String(dateString))) {
        // numeric string
        const num = Number(dateString);
        dateObj = String(dateString).length === 10 ? new Date(num * 1000) : new Date(num);
      } else {
        dateObj = new Date(dateString);
      }
    } catch (e) {
      return '-';
    }

    if (isNaN(dateObj.getTime())) return '-';

    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  };

  // Convert ISO datetime (or timestamp) to datetime-local value 'YYYY-MM-DDTHH:mm'
  const toDateTimeLocal = (iso) => {
    if (!iso && iso !== 0) return '';
    let d;
    try {
      if (Array.isArray(iso)) {
        const [y, m, day, hh = 0, mm = 0] = iso;
        d = new Date(y, m - 1, day, hh, mm);
      } else if (typeof iso === 'object' && iso !== null && iso.year) {
        // object like {year:2025, month:10, day:16, hour:14, minute:30}
        d = new Date(iso.year, iso.month - 1, iso.day, iso.hour || 0, iso.minute || 0);
      } else {
        d = new Date(iso);
      }
    } catch (e) {
      return '';
    }
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Đang chạy';
      case 'upcoming': return 'Sắp diễn ra';
      case 'expired': return 'Đã kết thúc';
      case 'paused': return 'Tạm dừng';
      default: return 'Không xác định';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <IoPlayOutline className="text-green-600" />;
      case 'upcoming': return <IoTimeOutline className="text-blue-600" />;
      case 'expired': return <IoStopOutline className="text-gray-600" />;
      case 'paused': return <IoPauseOutline className="text-yellow-600" />;
      default: return <IoCloseCircle className="text-gray-600" />;
    }
  };

  // Normalize backend status text (may be Vietnamese or English) into canonical keys
  // canonical: 'active', 'upcoming', 'expired', 'paused', 'unknown'
  const normalizeStatus = (raw) => {
    if (!raw && raw !== 0) return 'unknown';
    const s = String(raw).trim().toLowerCase();
    if (!s) return 'unknown';
    if (s.includes('đang') || s.includes('dang') || s.includes('active')) return 'active';
    if (s.includes('sắp') || s.includes('sap') || s.includes('upcoming')) return 'upcoming';
    if (s.includes('kết thúc') || s.includes('ket thuc') || s.includes('da ket') || s.includes('expired')) return 'expired';
    if (s.includes('tạm') || s.includes('tam') || s.includes('pause') || s.includes('dừng')) return 'paused';
    // If the backend already sends canonical keys, accept them
    if (['active', 'upcoming', 'expired', 'paused'].includes(s)) return s;
    return 'unknown';
  };
  const calculateTotalDiscount = (program) => {
    return program.bienTheGiamGias?.reduce((total, item) => {
      const originalPrice = item.giaGoc || 0;
      const discountedPrice = item.giaSauGiam || 0;
      return total + (originalPrice - discountedPrice);
    }, 0) || 0;
  };

  const calculateDiscountPercentage = (originalPrice, discountedPrice) => {
    return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
  };

  const resetForm = () => {
    setFormData({
      tenChuongTrinh: '',
      moTa: '',
      ngayBatDau: '',
      ngayKetThuc: '',
      // default to 'active' for new programs (checkbox checked)
      trangThai: 'active'
    });
    setVariantDiscounts([]);
    setSelectedProducts([]);
    setEditingProgram(null);
    setDiscountType('amount');
    setDiscountValue('');
  };

  const handleAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = async (program) => {
    try {
      setIsLoading(true);
      // Fetch detailed program (includes danhSachBienThe)
      const detail = await api.get(`/api/chuongtrinh-giamgia/${program.maChuongTrinhGiamGia}/details`);

      // Populate form data including status and format dates for input
      // Normalize incoming detail.trangThai into canonical UI keys
      const norm = normalizeStatus(detail.trangThai);
      setFormData(fd => ({
        ...fd,
        tenChuongTrinh: detail.tenChuongTrinh,
        moTa: detail.moTa || '',
        ngayBatDau: toDateTimeLocal(detail.ngayBatDau),
        ngayKetThuc: toDateTimeLocal(detail.ngayKetThuc),
        // Map status to active/paused for checkbox
        trangThai: norm === 'paused' ? 'paused' : 'active'
      }));

      // Prefer server grouped products (danhSachSanPham) to populate variants for edit UI
      let variantData = [];
      if (detail.danhSachSanPham && detail.danhSachSanPham.length > 0) {
        // flatten groups into variant list but keep product info for clarity
        variantData = detail.danhSachSanPham.flatMap(sp => (
          (sp.bienTheGiamGias || []).map(bt => ({
            maBienThe: bt.maBienThe,
            maSanPham: sp.maSanPham,
            tenSanPham: sp.tenSanPham,
            giaSauGiam: bt.giaSauGiam,
            giaGoc: bt.giaGoc || 0,
            thuocTinh: bt.skuBienThe || '',
            sku: bt.skuBienThe || ''
          }))
        ));
      } else {
        variantData = (detail.danhSachBienThe || []).map(bt => ({
          maBienThe: bt.maBienThe,
          maSanPham: bt.maSanPham,
          tenSanPham: bt.tenSanPham || null,
          giaSauGiam: bt.giaSauGiam,
          giaGoc: bt.giaGoc || 0,
          thuocTinh: bt.skuBienThe || '',
          sku: bt.skuBienThe || ''
        }));
      }
      setVariantDiscounts(variantData);

      // Prefill selected products based on variantData (keep product objects if available)
      const productIds = Array.from(new Set(variantData.map(v => v.maSanPham).filter(Boolean)));
      const preSelectedProducts = productIds.map(id => {
        const found = products.find(p => p.maSanPham === id);
        return found || { maSanPham: id, tenSanPham: variantData.find(v => v.maSanPham === id)?.tenSanPham || '' };
      });
      setSelectedProducts(preSelectedProducts);

      // Set active product to first selected product (so right column shows it)
      const firstActive = preSelectedProducts.length > 0 ? preSelectedProducts[0] : null;
      setActiveProduct(firstActive);

      // Ensure productVariants cache contains variants for selected products (fetch missing ones)
      const missing = productIds.filter(id => !productVariants[id]);
      if (missing.length > 0) {
        setIsLoadingVariants(true);
        try {
          const fetches = missing.map(id => api.get(`/api/products/${id}/variants`).then(r => ({ id, data: r })).catch(e => ({ id, data: [] })));
          const results = await Promise.all(fetches);
          const newMap = {};
          results.forEach(({ id, data }) => {
            if (Array.isArray(data)) {
              newMap[id] = data.map(v => ({
                maBienThe: v.maBienThe,
                sku: v.sku,
                giaBan: v.giaBan,
                soLuongTon: v.soLuongTon,
                thuocTinh: v.bienTheThuocTinhs?.map(bt => bt.giaTri).filter(Boolean).join(', ') || ''
              }));
            } else {
              newMap[id] = [];
            }
          });
          setProductVariants(prev => ({ ...prev, ...newMap }));
        } catch (e) {
          
        } finally {
          setIsLoadingVariants(false);
        }
      }

      // Pre-check variant ids for active product using variantData
      if (firstActive) {
        const activeId = firstActive.maSanPham;
        const preCheckedIds = variantData.filter(v => v.maSanPham === activeId).map(v => v.maBienThe);
        setSelectedProductVariantIds(preCheckedIds);
      } else {
        setSelectedProductVariantIds([]);
      }
      // (already populated above)

      // Load discount type/value for editing
      if (detail.loaiGiamGia === 'PERCENT') {
        setDiscountType('percent');
      } else {
        setDiscountType('amount');
      }
      setDiscountValue(detail.giaTriGiam != null ? String(detail.giaTriGiam) : '');

      setEditingProgram(detail);
      setShowModal(true);
    } catch (err) {
      showToast('Không thể tải chi tiết chương trình', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle product selection
  const toggleProduct = async (product) => {
    const isSelected = selectedProducts.some(p => p.maSanPham === product.maSanPham);

    if (isSelected) {
      // Remove product and its variants from selection
      setSelectedProducts(selectedProducts.filter(p => p.maSanPham !== product.maSanPham));
      setVariantDiscounts(variantDiscounts.filter(vd => {
        const variants = productVariants[product.maSanPham] || [];
        return !variants.some(v => v.maBienThe === vd.maBienThe);
      }));
      // After removal, recompute which variant ids should be checked (only those already in program and in remaining selected products)
      const remaining = selectedProducts.filter(p => p.maSanPham !== product.maSanPham);
      const remainingIds = remaining.flatMap(p => (productVariants[p.maSanPham] || []).map(v => v.maBienThe));
      const existingProgramIds = (variantDiscounts || []).map(vd => vd.maBienThe);
      setSelectedProductVariantIds(remainingIds.filter(id => existingProgramIds.includes(id)));
    } else {
      // Add product to selection and fetch its variants
    const newSelected = [...selectedProducts, product];
    setSelectedProducts(newSelected);

        // Fetch and cache variants for this product but DO NOT auto-add them to variantDiscounts.
        let variants = productVariants[product.maSanPham];
        if (!variants) {
          setIsLoadingVariants(true);
          try {
            const variantsData = await api.get(`/api/products/${product.maSanPham}/variants`);
            if (Array.isArray(variantsData)) {
              variants = variantsData.map(v => ({
                maBienThe: v.maBienThe,
                sku: v.sku,
                giaBan: v.giaBan,
                soLuongTon: v.soLuongTon,
                thuocTinh: v.bienTheThuocTinhs?.map(bt => bt.giaTri).filter(Boolean).join(', ') || ''
              }));
              setProductVariants(prev => ({
                ...prev,
                [product.maSanPham]: variants
              }));
            }
          } catch (err) {
            
          } finally {
            setIsLoadingVariants(false);
          }
        }

    // After selecting a product, keep checked ids only for variants already in the program across selected products
    const visible = newSelected.flatMap(p => (productVariants[p.maSanPham] || []).map(v => v.maBienThe));
        const existingProgramIds = (variantDiscounts || []).map(vd => vd.maBienThe);
        const preChecked = visible.filter(id => existingProgramIds.includes(id));
        setSelectedProductVariantIds(preChecked);
    }
  };

  const handleToggleStatus = async (program) => {
    try {
      setIsLoading(true);
      const newStatus = program.status === 'active' ? 'paused' : 'active';
      
      await api.patch(`/api/chuongtrinh-giamgia/${program.maChuongTrinhGiamGia}/status`, {
        trangThai: newStatus
      });
      
      showToast(`Đã ${newStatus === 'active' ? 'kích hoạt' : 'vô hiệu hóa'} chương trình thành công`, 'success');
      await reloadDiscountPrograms();
    } catch (error) {
      showToast('Không thể thay đổi trạng thái chương trình', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (program) => {
    (async () => {
      try {
        setIsLoading(true);
        const detail = await api.get(`/api/chuongtrinh-giamgia/${program.maChuongTrinhGiamGia}/details`);
        const mapped = {
          ...detail,
          bienTheGiamGias: (detail.danhSachBienThe || []).map(bt => ({
            maBienThe: bt.maBienThe,
            giaSauGiam: bt.giaSauGiam,
            giaGoc: bt.giaGoc || 0,
            thuocTinh: bt.skuBienThe || '',
            sku: bt.skuBienThe || ''
          }))
        };
        setSelectedProgram(mapped);
        setShowVariantModal(true);
      } catch (err) {
        showToast('Không thể tải chi tiết chương trình', 'error');
      } finally {
        setIsLoading(false);
      }
    })();
  };

  // Helper to reload discount programs from backend
  const reloadDiscountPrograms = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/chuongtrinh-giamgia?details=true');
      const data = Array.isArray(response) ? response : [];
      const mapped = data.map(prog => ({
        id: prog.maChuongTrinhGiamGia,
        maChuongTrinhGiamGia: prog.maChuongTrinhGiamGia,
        tenChuongTrinh: prog.tenChuongTrinh,
        ngayBatDau: prog.ngayBatDau,
        ngayKetThuc: prog.ngayKetThuc,
        status: normalizeStatus(prog.trangThai),
        statusText: prog.trangThai || '',
        bienTheGiamGias: (prog.danhSachBienThe || []).map(bt => ({
          maBienThe: bt.maBienThe,
          giaSauGiam: bt.giaSauGiam,
          giaGoc: bt.giaGoc || 0,
          thuocTinh: bt.skuBienThe || '',
          sku: bt.skuBienThe || '',
          tenSanPham: bt.tenSanPham || bt.tenSanPhamGoc || null,
          phanTramGiam: bt.phanTramGiam || null
        })),
        soLuongBienThe: prog.soLuongBienThe || (prog.danhSachBienThe ? prog.danhSachBienThe.length : 0),
        tongTietKiem: prog.tongTietKiem || 0
      }));
      setDiscountPrograms(mapped);
      setError(null);
    } catch (err) {
      showToast('Không thể tải lại danh sách chương trình', 'error');
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.tenChuongTrinh.trim()) {
      showToast('Vui lòng nhập tên chương trình', 'error');
      return;
    }
    if (!formData.ngayBatDau || !formData.ngayKetThuc) {
      showToast('Vui lòng chọn ngày bắt đầu và kết thúc', 'error');
      return;
    }
    const startDate = new Date(formData.ngayBatDau);
    const endDate = new Date(formData.ngayKetThuc);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      showToast('Ngày bắt đầu/kết thúc không hợp lệ', 'error');
      return;
    }
    if (startDate >= endDate) {
      showToast('Ngày bắt đầu phải trước ngày kết thúc', 'error');
      return;
    }
    if (variantDiscounts.length === 0) {
      showToast('Vui lòng thêm ít nhất một biến thể vào chương trình', 'error');
      return;
    }

    // Helper: ensure datetime-local value has seconds (Jackson LocalDateTime parser expects seconds often)
    const normalizeDateTimeLocal = (s) => {
      if (!s && s !== 0) return s;
      // if already contains seconds (HH:mm:ss) leave it
      const parts = String(s).split('T');
      if (parts.length !== 2) return s;
      const time = parts[1];
      if (time.split(':').length === 2) return `${parts[0]}T${time}:00`;
      return s;
    };

    try {
      // Validate variant entries before sending
      for (const vd of variantDiscounts) {
        if (!vd.maBienThe) {
          showToast('Một số biến thể thiếu mã biến thể', 'error');
          return;
        }
        const price = Number(vd.giaSauGiam);
        if (!isFinite(price) || price <= 0) {
          showToast('Giá sau giảm của biến thể phải là số dương', 'error');
          return;
        }
      }
      setIsLoading(true);

      // Prepare request payload matching ChuongTrinhGiamGiaDetailRequest
      const requestPayload = {
        tenChuongTrinh: formData.tenChuongTrinh.trim(),
        moTa: formData.moTa || null,
        ngayBatDau: normalizeDateTimeLocal(formData.ngayBatDau),
        ngayKetThuc: normalizeDateTimeLocal(formData.ngayKetThuc),
        // send canonical string status to backend (server accepts many textual forms)
        trangThai: formData.trangThai || 'upcoming',
        loaiGiamGia: discountType === 'percent' ? 'PERCENT' : 'FIXED',
        // send as number (BigDecimal on server side)
        giaTriGiam: Number(discountValue) || 0,
        danhSachBienThe: variantDiscounts.map(vd => ({
          maBienThe: Number(vd.maBienThe),
          // ensure numeric value
          giaSauGiam: Number(vd.giaSauGiam)
        }))
      };

      // Save payload for UI inspection
      setLastPayload(requestPayload);

      let saved;
      if (editingProgram) {
        // Validate the editingProgram id before attempting PUT
        const rawId = editingProgram.maChuongTrinhGiamGia;
        const idInt = Number(rawId);
        if (!isFinite(idInt) || !Number.isInteger(idInt) || idInt <= 0) {
          showToast('ID chương trình không hợp lệ. Vui lòng tải lại chi tiết và thử lại.', 'error');
          // Keep the payload visible for debugging
          setLastPayload(requestPayload);
          return;
        }

        // Update existing program and capture returned updated resource
        saved = await api.put(
          `/api/chuongtrinh-giamgia/${idInt}/with-details`,
          { body: requestPayload }
        );
        showToast('Cập nhật chương trình giảm giá thành công');
      } else {
        // Create new program
        saved = await api.post('/api/chuongtrinh-giamgia/with-details', { body: requestPayload });
        showToast('Thêm chương trình giảm giá thành công');
      }

      // If server returned the saved resource, update local list immediately
      if (saved && saved.maChuongTrinhGiamGia) {
        const p = saved;
        const updatedProgram = {
          id: p.maChuongTrinhGiamGia,
          maChuongTrinhGiamGia: p.maChuongTrinhGiamGia,
          tenChuongTrinh: p.tenChuongTrinh,
          ngayBatDau: p.ngayBatDau,
          ngayKetThuc: p.ngayKetThuc,
          status: normalizeStatus(p.trangThai),
          statusText: p.trangThai || '',
          bienTheGiamGias: (p.danhSachBienThe || []).map(bt => ({
            maBienThe: bt.maBienThe,
            giaSauGiam: bt.giaSauGiam,
            giaGoc: bt.giaGoc || 0,
            thuocTinh: bt.skuBienThe || '',
            sku: bt.skuBienThe || '',
            tenSanPham: bt.tenSanPham || bt.tenSanPhamGoc || null,
            phanTramGiam: bt.phanTramGiam || null
          })),
          soLuongBienThe: p.soLuongBienThe || (p.danhSachBienThe ? p.danhSachBienThe.length : 0),
          tongTietKiem: p.tongTietKiem || 0
        };

        // Replace or append - only update discountPrograms, let useEffect handle filteredPrograms
        setDiscountPrograms(prev => {
          const idx = prev.findIndex(x => x.id === updatedProgram.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = updatedProgram;
            return copy;
          }
          return [updatedProgram, ...prev];
        });
      } else {
        // fallback: refresh the full list from server
        const programs = await api.get('/api/chuongtrinh-giamgia?details=true');
        if (Array.isArray(programs)) {
            const mappedPrograms = programs.map(p => {
              return {
                id: p.maChuongTrinhGiamGia,
                maChuongTrinhGiamGia: p.maChuongTrinhGiamGia,
                tenChuongTrinh: p.tenChuongTrinh,
                ngayBatDau: p.ngayBatDau,
                ngayKetThuc: p.ngayKetThuc,
                status: normalizeStatus(p.trangThai),
                statusText: p.trangThai || '',
                bienTheGiamGias: []
              };
            });
          // Only update discountPrograms, let useEffect handle filteredPrograms
          setDiscountPrograms(mappedPrograms);
        }
      }

      setShowModal(false);
      resetForm();
    } catch (error) {
      showToast(
        error.response?.data?.message || 'Có lỗi xảy ra khi lưu chương trình giảm giá',
        'error'
      );
    } finally {
      await reloadDiscountPrograms();
      setIsLoading(false);
    }
  };



  const addVariantDiscount = (variant, discountedPrice) => {
    const existingIndex = variantDiscounts.findIndex(item => item.maBienThe === variant.maBienThe);

    if (existingIndex >= 0) {
      const updated = [...variantDiscounts];
      updated[existingIndex] = {
        maBienThe: variant.maBienThe,
        giaSauGiam: discountedPrice,
        thuocTinh: variant.thuocTinh,
        sku: variant.sku,
        giaGoc: variant.giaBan
      };
      setVariantDiscounts(updated);
    } else {
      setVariantDiscounts([...variantDiscounts, {
        maBienThe: variant.maBienThe,
        giaSauGiam: discountedPrice,
        thuocTinh: variant.thuocTinh,
        sku: variant.sku,
        giaGoc: variant.giaBan
      }]);
    }
  };

  const removeVariantDiscount = (maBienThe) => {
    setVariantDiscounts(variantDiscounts.filter(item => item.maBienThe !== maBienThe));
  };

  // Áp dụng giảm giá cho tất cả variants đã chọn
  const applyDiscountToAll = () => {
    if (!discountValue || parseFloat(discountValue) <= 0) {
      showToast('Vui lòng nhập giá trị giảm giá hợp lệ', 'error');
      return;
    }

    const updated = variantDiscounts.map(vd => {
      let newPrice;
      if (discountType === 'percent') {
        const percent = parseFloat(discountValue);
        if (percent < 0 || percent > 100) {
          showToast('Phần trăm giảm phải từ 0-100%', 'error');
          return vd;
        }
        newPrice = vd.giaGoc * (1 - percent / 100);
      } else {
        const amount = parseFloat(discountValue);
        if (amount >= vd.giaGoc) {
          showToast('Số tiền giảm không được lớn hơn giá gốc', 'error');
          return vd;
        }
        newPrice = vd.giaGoc - amount;
      }
      return {
        ...vd,
        giaSauGiam: Math.round(newPrice)
      };
    });

    setVariantDiscounts(updated);
    showToast(`Đã áp dụng giảm ${discountType === 'percent' ? discountValue + '%' : formatCurrency(discountValue)} cho tất cả biến thể`);
  };


  const getStats = () => {
    const total = discountPrograms.length;
    const active = discountPrograms.filter(p => p.status === 'active').length;
    const upcoming = discountPrograms.filter(p => p.status === 'upcoming').length;
    const expired = discountPrograms.filter(p => p.status === 'expired').length;

    return { total, active, upcoming, expired };
  };

  const stats = getStats();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-600">Đang tải dữ liệu chương trình giảm giá...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">Lỗi khi tải dữ liệu: {error?.message || String(error)}</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Chương trình Giảm giá</h1>
        <p className="text-gray-600">Tạo và quản lý các chương trình khuyến mãi</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Tổng chương trình</p>
              <p className="text-3xl font-bold">{stats.total}</p>
            </div>
            <IoStatsChartOutline className="text-4xl text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Đang hoạt động</p>
              <p className="text-3xl font-bold">{stats.active}</p>
            </div>
            <IoPlayOutline className="text-4xl text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100">Sắp diễn ra</p>
              <p className="text-3xl font-bold">{stats.upcoming}</p>
            </div>
            <IoTimeOutline className="text-4xl text-yellow-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-gray-500 to-gray-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-100">Đã kết thúc</p>
              <p className="text-3xl font-bold">{stats.expired}</p>
            </div>
            <IoStopOutline className="text-4xl text-gray-200" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm chương trình..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({ ...filters, searchTerm: e.target.value })}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              <IoFilterOutline />
              Bộ lọc
            </button>
          </div>

          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <IoAdd />
            Thêm chương trình
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="upcoming">Sắp diễn ra</option>
                  <option value="expired">Đã kết thúc</option>
                  <option value="paused">Tạm dừng</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thời gian nhanh</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => {
                    setFilters({ ...filters, dateRange: e.target.value, startDate: '', endDate: '' });
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả thời gian</option>
                  <option value="this-week">Tuần này</option>
                  <option value="this-month">Tháng này</option>
                  <option value="next-month">Tháng tới</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value, dateRange: 'all' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value, dateRange: 'all' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {(filters.startDate || filters.endDate) && (
              <div className="mt-3 flex justify-end">
                <button
                  onClick={() => setFilters({ ...filters, startDate: '', endDate: '', dateRange: 'all' })}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Xóa bộ lọc ngày
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Programs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredPrograms.map((program) => (
          <div key={program.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Program Header */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 truncate flex-1 mr-2">
                  {program.tenChuongTrinh}
                </h3>
                <div className="flex items-center gap-1">
                  {getStatusIcon(program.status)}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(program.status)}`}>
                    {getStatusText(program.status)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <IoCalendarOutline className="text-gray-400" />
                  <span>Bắt đầu: {formatDateTime(program.ngayBatDau)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <IoTimeOutline className="text-gray-400" />
                  <span>Kết thúc: {formatDateTime(program.ngayKetThuc)}</span>
                </div>
              </div>
            </div>

            {/* Program Stats */}
            <div className="p-4 bg-gray-50">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {program.bienTheGiamGias && program.bienTheGiamGias.length > 0
                      ? program.bienTheGiamGias.length
                      : (program.soLuongBienThe ?? 0)}
                  </div>
                  <div className="text-xs text-gray-600">Sản phẩm</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {program.tongTietKiem && Number(program.tongTietKiem) > 0
                      ? formatCurrency(program.tongTietKiem)
                      : (program.bienTheGiamGias && program.bienTheGiamGias.length > 0
                        ? formatCurrency(calculateTotalDiscount(program))
                        : '-')}
                  </div>
                  <div className="text-xs text-gray-600">Tổng giảm</div>
                </div>
              </div>
            </div>

            {/* Grouped product/variant preview */}
            {(program.danhSachSanPham && program.danhSachSanPham.length > 0) ? (
              <div className="p-4">
                <div className="text-sm font-medium text-gray-700 mb-3">Sản phẩm áp dụng:</div>
                <div className="space-y-2">
                  {program.danhSachSanPham.slice(0, 2).map((sp, idx) => (
                    <div key={sp.maSanPham || idx} className="">
                      <div className="text-sm font-semibold text-gray-900 truncate">{sp.tenSanPham || `Sản phẩm #${sp.maSanPham}`}</div>
                      <div className="mt-1">
                        {sp.bienTheGiamGias && sp.bienTheGiamGias.slice(0,1).map((bt, bi) => (
                          <div key={bi} className="flex items-center justify-between text-sm py-1">
                            <div className="flex-1 truncate">
                              <div className="font-medium text-gray-900 truncate">{bt.sku || bt.thuocTinh || `Biến thể #${bt.maBienThe}`}</div>
                            </div>
                            <div className="text-right ml-2">
                              <div className="font-bold text-red-600">{formatCurrency(bt.giaSauGiam)}</div>
                              {bt.giaGoc && (<div className="text-xs text-gray-500 line-through">{formatCurrency(bt.giaGoc)}</div>)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  { (program.danhSachSanPham.length > 2) && (
                    <div className="text-xs text-gray-500 text-center">+{program.danhSachSanPham.length - 2} sản phẩm khác</div>
                  )}
                </div>
              </div>
            ) : (program.bienTheGiamGias && program.bienTheGiamGias.length > 0) && (
              <div className="p-4">
                <div className="text-sm font-medium text-gray-700 mb-3">Biến thể khuyến mãi:</div>
                <div className="space-y-2">
                  {program.bienTheGiamGias.slice(0, 2).map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex-1 truncate">
                        <div className="font-medium text-gray-900 truncate">{item.sku || item.thuocTinh || `Biến thể #${item.maBienThe}`}</div>
                        <div className="text-xs text-gray-500 truncate">{item.tenSanPham ? `${item.tenSanPham} • ` : ''}{item.sku || item.thuocTinh || 'Mặc định'}</div>
                      </div>
                      <div className="text-right ml-2">
                        <div className="font-bold text-red-600">{formatCurrency(item.giaSauGiam)}</div>
                        {item.giaGoc && (<div className="text-xs text-gray-500 line-through">{formatCurrency(item.giaGoc)}</div>)}
                      </div>
                    </div>
                  ))}
                  {program.bienTheGiamGias.length > 2 && (<div className="text-xs text-gray-500 text-center">+{program.bienTheGiamGias.length - 2} biến thể khác</div>)}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => handleViewDetails(program)}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                >
                  <IoEyeOutline />
                  Xem chi tiết
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(program)}
                    className="text-blue-600 hover:text-blue-800 p-1 rounded"
                    title="Chỉnh sửa"
                  >
                    <IoPencilOutline />
                  </button>
                  <button
                    onClick={() => handleToggleStatus(program)}
                    className={`p-1 rounded ${program.status === 'active' ? 'text-orange-600 hover:text-orange-800' : 'text-green-600 hover:text-green-800'}`}
                    title={program.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt'}
                  >
                    {program.status === 'active' ? <IoPauseOutline /> : <IoPlayOutline />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredPrograms.length === 0 && (
        <div className="text-center py-12">
          <IoGiftOutline className="mx-auto text-6xl text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Không có chương trình giảm giá</h3>
          <p className="text-gray-500 mb-4">
            {filters.searchTerm || filters.status !== 'all' || filters.dateRange !== 'all'
              ? 'Không tìm thấy chương trình nào phù hợp với bộ lọc'
              : 'Chưa có chương trình giảm giá nào được tạo'}
          </p>
          {!filters.searchTerm && filters.status === 'all' && filters.dateRange === 'all' && (
            <button
              onClick={handleAdd}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Tạo chương trình đầu tiên
            </button>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingProgram ? 'Chỉnh sửa chương trình giảm giá' : 'Thêm chương trình giảm giá'}
        size="large"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">Thông tin cơ bản</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên chương trình <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.tenChuongTrinh}
                  onChange={(e) => setFormData({ ...formData, tenChuongTrinh: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập tên chương trình"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  value={formData.moTa}
                  onChange={(e) => setFormData({ ...formData, moTa: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nhập mô tả chương trình (tùy chọn)"
                  rows="3"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.ngayBatDau}
                    onChange={(e) => setFormData({ ...formData, ngayBatDau: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngày kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.ngayKetThuc}
                    onChange={(e) => setFormData({ ...formData, ngayKetThuc: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.trangThai === 'active'}
                    onChange={(e) => setFormData({ ...formData, trangThai: e.target.checked ? 'active' : 'paused' })}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Kích hoạt chương trình</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-8">
                  Chương trình sẽ {formData.trangThai === 'active' ? 'được áp dụng' : 'tạm dừng'} trong thời gian đã chọn
                </p>
              </div>
            </div>
          </div>

          {/* Bulk Discount Application */}
          <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Áp dụng giảm giá hàng loạt</h4>
            <div className="flex gap-3">
              {/* Discount Type Selection */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDiscountType('percent')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${discountType === 'percent'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  % Phần trăm
                </button>
                <button
                  type="button"
                  onClick={() => setDiscountType('amount')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${discountType === 'amount'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  ₫ Số tiền
                </button>
              </div>

              {/* Discount Value Input */}
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  max={discountType === 'percent' ? '100' : undefined}
                  step={discountType === 'percent' ? '1' : '1000'}
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'percent' ? 'Nhập % giảm (0-100)' : 'Nhập số tiền giảm'}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Apply Button */}
              <button
                type="button"
                onClick={applyDiscountToAll}
                disabled={!discountValue || variantDiscounts.length === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                Áp dụng
              </button>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              {discountType === 'percent'
                ? 'Giảm giá theo phần trăm sẽ tự động tính giá sau giảm cho tất cả biến thể đã chọn'
                : 'Giảm cố định số tiền cho tất cả biến thể đã chọn'}
            </p>
          </div>

          {/* Product Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-md font-medium text-gray-900">Sản phẩm và Biến thể áp dụng</h4>
              <span className="text-sm text-gray-600">
                {variantDiscounts.length} biến thể được chọn
              </span>
            </div>

            {/* Selected Variants Summary */}
            {variantDiscounts.length > 0 && (
              <div className="mb-4 space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3 bg-blue-50">
                {variantDiscounts.map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-2 rounded shadow-sm">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.sku || item.thuocTinh || `Biến thể #${item.maBienThe}`}</div>
                      <div className="text-xs text-gray-600">{item.tenSanPham ? `${item.tenSanPham} • ${item.thuocTinh || 'Không có thuộc tính'}` : (item.thuocTinh || 'Không có thuộc tính')}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-bold text-red-600">
                        {formatCurrency(item.giaSauGiam)}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeVariantDiscount(item.maBienThe)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <IoCloseCircle />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Products and Variants Selection - two column layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-96">
              {/* Left: Product list */}
              <div className="md:col-span-1 space-y-2 overflow-y-auto border border-gray-200 rounded p-2">
                <div className="text-sm text-gray-600 mb-2">Danh sách sản phẩm</div>
                {products.map(product => {
                  const isSelected = selectedProducts.some(p => p.maSanPham === product.maSanPham);
                  return (
                    <div key={product.maSanPham} className={`flex items-center gap-3 p-2 rounded cursor-pointer ${isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`} onClick={() => { toggleProduct(product); setActiveProduct(product); }}>
                      <input type="checkbox" checked={isSelected} readOnly className="w-4 h-4" />
                      {product.hinhAnh && <img src={product.hinhAnh} alt={product.tenSanPham} className="w-10 h-10 object-cover rounded" />}
                      <div className="flex-1">
                        <div className="font-medium text-sm">{product.tenSanPham}</div>
                        <div className="text-xs text-gray-500">{product.moTa}</div>
                      </div>
                      <div className="text-xs text-gray-500">{(productVariants[product.maSanPham] || []).length} biến thể</div>
                    </div>
                  );
                })}
              </div>

              {/* Right: variants for active product and controls */}
              <div className="md:col-span-2 border border-gray-200 rounded p-3 bg-white overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium">
                    Biến thể của: {selectedProducts && selectedProducts.length > 0 ? selectedProducts.map(p => p.tenSanPham).join(', ') : (activeProduct ? activeProduct.tenSanPham : 'Chọn sản phẩm bên trái')}
                  </div>
                  <div>
                    <button type="button" onClick={() => {
                      // add selected variants from all visible products to variantDiscounts
                      const visibleProducts = (selectedProducts && selectedProducts.length > 0) ? selectedProducts : (activeProduct ? [activeProduct] : []);
                      const visibleVariants = visibleProducts.flatMap(p => productVariants[p.maSanPham] || []);
                      const toAdd = visibleVariants.filter(v => selectedProductVariantIds.includes(v.maBienThe) && !variantDiscounts.some(vd => vd.maBienThe === v.maBienThe))
                        .map(v => {
                          const p = visibleProducts.find(pp => (pp.maSanPham === v.maSanPham) || (productVariants[pp.maSanPham] || []).some(x => x.maBienThe === v.maBienThe));
                          return { maBienThe: v.maBienThe, maSanPham: p ? p.maSanPham : null, tenSanPham: p ? p.tenSanPham : '', sku: v.sku, thuocTinh: v.thuocTinh, giaSauGiam: v.giaSauGiam || v.giaBan || 0, giaGoc: v.giaBan || 0 };
                        });
                      if (toAdd.length > 0) setVariantDiscounts(prev => [...prev, ...toAdd]);
                      setSelectedProductVariantIds([]);
                    }} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Thêm biến thể đã chọn</button>
                  </div>
                </div>

                <div className="space-y-2">
                  {((selectedProducts && selectedProducts.length > 0) || activeProduct) ? (
                    (() => {
                      const visibleProducts = (selectedProducts && selectedProducts.length > 0) ? selectedProducts : (activeProduct ? [activeProduct] : []);
                      const variants = visibleProducts.flatMap(p => productVariants[p.maSanPham] || []);
                      if (isLoadingVariants && variants.length === 0) return <div className="text-center text-gray-500 py-4">Đang tải biến thể...</div>;
                      if (variants.length === 0) return <div className="text-center text-gray-500 py-4">Sản phẩm chưa có biến thể</div>;

                      return variants.map(variant => {
                        const inSelected = selectedProductVariantIds.includes(variant.maBienThe);
                        const includedInProgram = variantDiscounts.some(vd => vd.maBienThe === variant.maBienThe);
                        return (
                          <div key={variant.maBienThe} className={`flex items-center justify-between p-2 border rounded ${includedInProgram ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
                            <div className="flex items-center gap-3">
                              <input type="checkbox" checked={inSelected} onChange={() => {
                                setSelectedProductVariantIds(prev => prev.includes(variant.maBienThe) ? prev.filter(x => x !== variant.maBienThe) : [...prev, variant.maBienThe]);
                              }} />
                              <div>
                                <div className="font-medium text-sm">{variant.sku || variant.thuocTinh || `Biến thể #${variant.maBienThe}`}</div>
                                <div className="text-xs text-gray-500">Mã: {variant.maBienThe}</div>
                              </div>
                            </div>
                            <div className="text-sm font-bold text-red-600">{formatCurrency(variant.giaSauGiam || variant.giaBan || 0)}</div>
                          </div>
                        );
                      });
                    })()
                  ) : (
                    <div className="text-center text-gray-500 py-8">Chọn một sản phẩm bên trái để xem biến thể</div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Debug panel: show last payload sent to server */}
          {lastPayload && (
            <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-700">Payload gửi (debug)</div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigator.clipboard?.writeText(JSON.stringify(lastPayload, null, 2))}
                    className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => setLastPayload(null)}
                    className="text-sm px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
              <pre className="text-xs text-gray-800 overflow-auto max-h-48 p-2 bg-white border rounded">{JSON.stringify(lastPayload, null, 2)}</pre>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {editingProgram ? 'Cập nhật' : 'Thêm'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Details Modal */}
      <Modal
        isOpen={showVariantModal}
        onClose={() => setShowVariantModal(false)}
        title={`Chi tiết: ${selectedProgram?.tenChuongTrinh}`}
        size="large"
      >
        {selectedProgram && (
          <div className="space-y-6">
            {/* Program Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Trạng thái</div>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusIcon(selectedProgram.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedProgram.status)}`}>
                      {getStatusText(selectedProgram.status)}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Thời gian</div>
                  <div className="mt-1">
                    <div className="text-sm">{formatDateTime(selectedProgram.ngayBatDau)}</div>
                    <div className="text-sm text-gray-500">đến {formatDateTime(selectedProgram.ngayKetThuc)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Variants (grouped by product) */}
            <div>
              {(() => {
                // Prefer server grouped products if available
                const groups = (selectedProgram.danhSachSanPham && selectedProgram.danhSachSanPham.length > 0)
                  ? selectedProgram.danhSachSanPham
                  : // fallback: group bienTheGiamGias by product
                  (selectedProgram.bienTheGiamGias || []).reduce((acc, bt) => {
                    let g = acc.find(x => x.maSanPham === bt.maSanPham || x.tenSanPham === bt.tenSanPham);
                    if (!g) {
                      g = { maSanPham: bt.maSanPham, tenSanPham: bt.tenSanPham || `Sản phẩm #${bt.maSanPham || 'N/A'}`, bienTheGiamGias: [] };
                      acc.push(g);
                    }
                    g.bienTheGiamGias.push(bt);
                    return acc;
                  }, []);

                const totalVariants = groups.reduce((s, g) => s + (g.bienTheGiamGias ? g.bienTheGiamGias.length : 0), 0);

                return (
                  <>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Biến thể áp dụng ({totalVariants})</h4>
                    <div className="space-y-3">
                      {groups.length > 0 ? groups.map((sp, idx) => (
                        <div key={sp.maSanPham || idx} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-medium text-gray-900">{sp.tenSanPham || `Sản phẩm #${sp.maSanPham}`}</div>
                            <div className="text-sm text-gray-500">{sp.bienTheGiamGias ? sp.bienTheGiamGias.length : 0} biến thể</div>
                          </div>
                          <div className="space-y-2">
                            {(sp.bienTheGiamGias || []).map((item, i) => (
                              <div key={item.maBienThe || i} className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium">{item.sku || item.thuocTinh || `Biến thể #${item.maBienThe}`}</div>
                                  <div className="text-sm text-gray-600">SKU: {item.sku || item.maBienThe}</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-red-600">{formatCurrency(item.giaSauGiam)}</div>
                                  {item.giaGoc && (
                                    <div className="text-sm text-gray-500 line-through">{formatCurrency(item.giaGoc)}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-8 text-gray-500">Chưa có biến thể nào được thêm vào chương trình</div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Summary */}
            {selectedProgram.bienTheGiamGias && selectedProgram.bienTheGiamGias.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-blue-900">Tổng tiết kiệm (ước tính)</div>
                    <div className="text-sm text-blue-700">Từ {selectedProgram.bienTheGiamGias.length} biến thể</div>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{formatCurrency(calculateTotalDiscount(selectedProgram))}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Toast is shown via global Toast API (Toast.show) */}
    </div>
  );
};

export default DiscountManagement;
