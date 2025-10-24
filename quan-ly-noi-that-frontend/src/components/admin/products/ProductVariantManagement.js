import React, { useState, useEffect, useCallback } from 'react';
import { IoAdd, IoSearch, IoCreate, IoSave, IoCube, IoBarcode, IoPricetag, IoLayers, IoPause, IoPlay } from 'react-icons/io5';
import Modal from '../../shared/Modal';
import ConfirmDialog from '../../shared/ConfirmDialog';
import Toast from '../../shared/Toast';
import api from '../../../api';

const ProductVariantManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Attributes for single-variant editing
  const [attributes, setAttributes] = useState([]);
  const [attrLoading, setAttrLoading] = useState(false);
  const [attrError, setAttrError] = useState(null);
  const [editedAttributes, setEditedAttributes] = useState([]); // [{ maThuocTinh, tenThuocTinh, giaTri }]
  const [newAttrId, setNewAttrId] = useState('');
  const [newAttrValue, setNewAttrValue] = useState('');

  // Map variant data from API
  const mapVariantFromApi = (variant) => {
    // Supports BienTheSanPhamDetailResponse from /api/products/{id}/variants
    const maSanPham = variant.maSanPham ?? variant.sanPham?.maSanPham ?? variant.productId;
    const tenSanPham = variant.tenSanPham ?? variant.sanPham?.tenSanPham ?? variant.productName ?? '';
    const attributes = Array.isArray(variant.thuocTinhs)
      ? variant.thuocTinhs.map((a) => ({
  id: a.id, // BienTheThuocTinh mapping ID (for delete/update)
        maThuocTinh: a.maThuocTinh ?? a.attributeId ?? null,
        tenThuocTinh: a.tenThuocTinh ?? a.attributeName ?? '',
        giaTri: a.giaTriThuocTinh ?? a.attributeValue ?? '',
      }))
      : Array.isArray(variant.thuocTinhList)
        ? variant.thuocTinhList.map((attr) => ({
          id: attr.id,
          maThuocTinh: attr.thuocTinh?.maThuocTinh || attr.attributeId,
          tenThuocTinh: attr.thuocTinh?.tenThuocTinh || attr.attributeName,
          giaTri: attr.giaTri?.giaTri || attr.attributeValue,
        }))
        : [];
    
    const trangThaiKho = variant.trangThaiKho || variant.trangThai;
    const trangThaiBool = typeof trangThaiKho === 'string' ? (trangThaiKho === 'ACTIVE') : (trangThaiKho ?? true);

    return {
      maBienThe: variant.maBienThe || variant.id,
      sanPham: { maSanPham, tenSanPham },
      tenBienThe: variant.tenBienThe || variant.name || `${tenSanPham} - ${variant.sku || ''}`,
      sku: variant.sku,
      giaMua: variant.giaMua ?? null,
      giaBan: Number(variant.giaBan ?? variant.price ?? 0),
      giaGoc: Number(variant.giaGoc ?? variant.originalPrice ?? variant.giaBan ?? 0),
      soLuongTon: Number(variant.soLuongTon ?? variant.tonKho ?? variant.stock ?? 0),
      trangThai: trangThaiBool,
      attributes,
      hinhAnh: variant.hinhAnh || variant.image || '',
    };
  };

  const mapVariantToApi = useCallback((variant) => ({
    maSanPham: variant.sanPham.maSanPham,
    tenBienThe: variant.tenBienThe,
    sku: variant.sku,
    giaBan: variant.giaBan,
    giaGoc: variant.giaGoc,
    tonKho: variant.soLuongTon,
    trangThai: variant.trangThai,
    hinhAnh: variant.hinhAnh,
    thuocTinhList: (variant.attributes || []).map(attr => ({
      maThuocTinh: attr.attributeId || attr.maThuocTinh || null,
      maGiaTri: attr.valueId || attr.maGiaTri || attr.giaTri || null
    }))
  }), []);

  // Helper: fetch variants by product id (returns mapped list)
  const fetchVariantsByProduct = useCallback(async (productId) => {
    const list = await api.get(`/api/products/${productId}/variants`);
    if (!Array.isArray(list)) return [];
    return list.map(mapVariantFromApi);
  }, []);

  // Helper: merge/replace variants for a given product id
  const replaceProductVariantsInState = useCallback((productId, mappedList) => {
    setVariants((prev) => {
      const others = prev.filter((v) => String(v.sanPham.maSanPham) !== String(productId));
      return [...others, ...mappedList];
    });
  }, []);

  // Fetch products then load variants (aggregated) from backend
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 1) Load product list for filter dropdown
        const prods = await api.get('/api/products');
        const mappedProducts = Array.isArray(prods)
          ? prods.map((p) => ({ maSanPham: p.maSanPham ?? p.id, tenSanPham: p.tenSanPham ?? p.name }))
          : [];
        if (!cancelled) setProducts(mappedProducts);

        // 2) Fetch variants per product in parallel
        const allVariants = [];
        for (const p of mappedProducts) {
          try {
            // eslint-disable-next-line no-await-in-loop
            const mapped = await fetchVariantsByProduct(p.maSanPham);
            allVariants.push(...mapped);
          } catch (e) {

          }
        }
        if (!cancelled) setVariants(allVariants);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [fetchVariantsByProduct]);

  const [variants, setVariants] = useState([]);

  const [products, setProducts] = useState([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [editingVariant, setEditingVariant] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [stockLimit, setStockLimit] = useState('');
  const [selectedAttributeTypes, setSelectedAttributeTypes] = useState([]); // Array of maThuocTinh
  const [selectedAttributeFilters, setSelectedAttributeFilters] = useState({}); // { maThuocTinh: [values] }
  const [showAttributeFilter, setShowAttributeFilter] = useState(false);
  const [showAttributeValueFilter, setShowAttributeValueFilter] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const [formData, setFormData] = useState({
    maSanPham: '',
    sku: '',
    giaMua: '',
    giaBan: '',
    soLuongTon: ''
  });
  const [skuEdited, setSkuEdited] = useState(false);

  // Collect unique attributes from all variants for filter dropdown
  const allAttributesInVariants = React.useMemo(() => {
    const attrMap = new Map();
    variants.forEach(v => {
      (v.attributes || []).forEach(a => {
        const key = `${a.maThuocTinh || ''}_${a.tenThuocTinh || ''}`;
        if (!attrMap.has(key)) {
          attrMap.set(key, {
            maThuocTinh: a.maThuocTinh,
            tenThuocTinh: a.tenThuocTinh || a.maThuocTinh,
            values: new Set()
          });
        }
        if (a.giaTri) {
          attrMap.get(key).values.add(a.giaTri);
        }
      });
    });
    return Array.from(attrMap.values()).map(attr => ({
      ...attr,
      values: Array.from(attr.values).sort()
    }));
  }, [variants]);

  // Filter variants
  const filteredVariants = variants.filter(variant => {
    const matchesSearch = variant.sanPham.tenSanPham.toLowerCase().includes(searchTerm.toLowerCase()) ||
      variant.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProduct = selectedProduct === '' ||
      variant.sanPham.maSanPham.toString() === selectedProduct;
    
    // Stock filter: either predefined ranges or custom limit
    let matchesStock = true;
    if (stockFilter === 'low') matchesStock = variant.soLuongTon <= 10;
    else if (stockFilter === 'high') matchesStock = variant.soLuongTon > 10;
    else if (stockFilter === 'out') matchesStock = variant.soLuongTon === 0;
    else if (stockLimit !== '') {
      const limit = Number(stockLimit);
      if (!isNaN(limit)) matchesStock = variant.soLuongTon <= limit;
    }

    // Attribute filter: match ALL selected attribute types (AND logic between types, OR within type)
    let matchesAttribute = true;
    const activeFilters = Object.entries(selectedAttributeFilters).filter(([_, values]) => values.length > 0);
    if (activeFilters.length > 0) {
      matchesAttribute = activeFilters.every(([attrId, selectedValues]) => {
        return (variant.attributes || []).some(
          a => String(a.maThuocTinh) === String(attrId) && selectedValues.includes(a.giaTri)
        );
      });
    }

    return matchesSearch && matchesProduct && matchesStock && matchesAttribute;
  });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.maSanPham || !formData.sku.trim() || !formData.giaBan) {
      showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
      return;
    }
    try {
      if (editingVariant) {
  // Update existing variant - only update basic fields
  const basicUpdatePayload = {
          sku: formData.sku.trim(),
          giaMua: formData.giaMua ? Number(formData.giaMua) : null,
          giaBan: Number(formData.giaBan),
          soLuongTon: formData.soLuongTon ? Number(formData.soLuongTon) : 0,
          thuocTinhGiaTriTuDo: [], // Empty - we'll use granular APIs for attributes
        };
        await api.put(`/api/bien-the-san-pham/${editingVariant.maBienThe}/variant`, basicUpdatePayload);

        // Handle attribute changes using granular APIs
        const variantId = editingVariant.maBienThe;
        const originalAttrs = editingVariant.attributes || [];
        const currentAttrs = editedAttributes || [];

        // Find deleted attributes (existed before, not in current)
        const deletedIds = originalAttrs
          .filter(orig => !currentAttrs.some(cur => cur.id && cur.id === orig.id))
          .map(attr => attr.id)
          .filter(id => id); // only delete if has ID

        // Find new attributes (no ID means new)
        const newAttrs = currentAttrs
          .filter(attr => !attr.id && attr.maThuocTinh && String(attr.giaTri || '').trim())
          .map(attr => ({ maThuocTinh: Number(attr.maThuocTinh), giaTri: String(attr.giaTri) }));

        // Find updated attributes (has ID and value changed)
        const updatedAttrs = currentAttrs
          .filter(cur => {
            if (!cur.id) return false;
            const orig = originalAttrs.find(o => o.id === cur.id);
            return orig && orig.giaTri !== cur.giaTri;
          })
          .map(attr => ({ id: attr.id, giaTri: String(attr.giaTri) }));

        // Execute deletions
        for (const id of deletedIds) {
          await api.delete(`/api/bien-the-san-pham/thuoc-tinh/${id}`);
        }

        // Execute additions
        for (const newAttr of newAttrs) {
          await api.post(`/api/bien-the-san-pham/${variantId}/thuoc-tinh`, newAttr);
        }

        // Execute updates
        for (const updAttr of updatedAttrs) {
          await api.put(`/api/bien-the-san-pham/thuoc-tinh/${updAttr.id}`, { giaTri: updAttr.giaTri });
        }

        // Refresh variants for this product
        const pid = Number(formData.maSanPham);
        const mapped = await fetchVariantsByProduct(pid);
        replaceProductVariantsInState(pid, mapped);
        showToast('Cập nhật biến thể sản phẩm thành công');
      } else {
        // Create new variant - use thuocTinhGiaTriTuDo for initial creation
        const payloadAttrs = (editedAttributes || [])
          .filter((r) => r && r.maThuocTinh && String(r.giaTri || '').trim().length > 0)
          .map((r) => ({ maThuocTinh: Number(r.maThuocTinh), giaTri: String(r.giaTri) }));

        const createPayload = {
          maSanPham: Number(formData.maSanPham),
          sku: formData.sku.trim(),
          giaMua: formData.giaMua ? Number(formData.giaMua) : null,
          giaBan: Number(formData.giaBan),
          soLuongTon: formData.soLuongTon ? Number(formData.soLuongTon) : 0,
          thuocTinhGiaTriTuDo: payloadAttrs,
        };
        await api.post('/api/bien-the-san-pham/create', createPayload);
        // Refresh variants for this product
        const pid = Number(formData.maSanPham);
        const mapped = await fetchVariantsByProduct(pid);
        replaceProductVariantsInState(pid, mapped);
        showToast('Thêm biến thể sản phẩm thành công');
      }
      closeModal();
    } catch (err) {
      const msg = err?.data?.error || err?.message || 'Có lỗi xảy ra';
      showToast(msg, 'error');
    }
  };

  const openModal = (variant = null) => {
    setEditingVariant(variant);
    setFormData({
      maSanPham: variant ? variant.sanPham.maSanPham.toString() : '',
      sku: variant ? variant.sku : '',
      giaMua: variant ? (variant.giaMua || '').toString() : '',
      giaBan: variant ? variant.giaBan.toString() : '',
      soLuongTon: variant ? variant.soLuongTon.toString() : ''
    });
    // If editing an existing variant, keep current SKU and stop auto-generation by default
    setSkuEdited(Boolean(variant));
    // Prepare attribute edits for single variant
    const preset = variant && Array.isArray(variant.attributes)
      ? variant.attributes.map((a) => ({
  id: a.id, // BienTheThuocTinh mapping ID
        maThuocTinh: a.maThuocTinh,
        tenThuocTinh: a.tenThuocTinh || a.thuocTinh,
        giaTri: a.giaTri || ''
      }))
      : [];
    setEditedAttributes(preset);
    setNewAttrId('');
    setNewAttrValue('');
    fetchAttributes().catch(() => { });
    setShowModal(true);
  };

  // Removed old buildAttributesForDisplay; we now build payload attributes inline in handleSubmit

  // Fetch attributes simple loader
  const fetchAttributes = useCallback(async () => {
    setAttrLoading(true);
    setAttrError(null);
    try {
      const url = formData?.maSanPham
        ? `/api/attributes/distinct-values?productId=${formData.maSanPham}`
        : '/api/attributes/distinct-values';
      const attrs = await api.get(url);
      if (!Array.isArray(attrs)) {
        setAttributes([]);
      } else {
        const loaded = attrs.map(a => ({
          id: a.maThuocTinh || a.id,
          tenThuocTinh: a.tenThuocTinh || a.name || a.label || String(a.maThuocTinh || a.id),
          values: Array.isArray(a.values) ? a.values.map(v => ({ id: v.maGiaTriThuocTinh || v.id, tenGiaTri: v.tenGiaTri || v.name || v.value })) : [],
          raw: a
        }));
        setAttributes(loaded);
      }
    } catch (err) {
      setAttributes([]);
      setAttrError(err?.message || 'Lỗi tải thuộc tính');
    } finally {
      setAttrLoading(false);
    }
  }, [formData?.maSanPham]);

  // Refetch attribute values when product changes in modal (so we show values specific to product)
  useEffect(() => {
    if (showModal) {
      fetchAttributes().catch(() => {});
    }
  }, [showModal, formData?.maSanPham, fetchAttributes]);

  // When creating a new variant, prefill rows with all attributes so their values show up
  useEffect(() => {
    try {
      if (showModal && !editingVariant && Array.isArray(attributes) && attributes.length > 0 && (!editedAttributes || editedAttributes.length === 0)) {
        const presetAll = attributes.map(a => ({ id: null, maThuocTinh: a.id ?? a.maThuocTinh, tenThuocTinh: a.tenThuocTinh, giaTri: '' }));
        setEditedAttributes(presetAll);
      }
    } catch (_) { /* noop */ }
  }, [showModal, editingVariant, attributes, editedAttributes]);

  // (selection helpers are implemented inline in the UI)

  const closeModal = () => {
    setShowModal(false);
    setEditingVariant(null);
    setFormData({ maSanPham: '', sku: '', giaMua: '', giaBan: '', soLuongTon: '' });
    setSkuEdited(false);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setShowConfirmDialog(true);
  };

  const confirmDeactivate = async () => {
    try {
      const v = variants.find((x) => x.maBienThe === deleteId);
      if (!v) throw new Error('Không tìm thấy biến thể');
      await api.put(`/api/bien-the-san-pham/${deleteId}/variant`, {
        sku: v.sku,
        giaBan: Number(v.giaBan),
        soLuongTon: Number(v.soLuongTon),
        trangThaiKho: 'DISCONTINUED',
      });
      setVariants(prev => prev.map(x => x.maBienThe === deleteId ? { ...x, trangThai: false } : x));
      setShowConfirmDialog(false);
      setDeleteId(null);
      showToast('Biến thể đã được tạm dừng hoạt động', 'success');
    } catch (error) {
      showToast('Có lỗi xảy ra khi tạm dừng biến thể', 'error');
      setShowConfirmDialog(false);
      setDeleteId(null);
    }
  };

  const handleActivate = async (id) => {
    try {
      const v = variants.find((x) => x.maBienThe === id);
      if (!v) throw new Error('Không tìm thấy biến thể');
      await api.put(`/api/bien-the-san-pham/${id}/variant`, {
        sku: v.sku,
        giaBan: Number(v.giaBan),
        soLuongTon: Number(v.soLuongTon),
        trangThaiKho: 'ACTIVE',
      });
      setVariants(prev => prev.map(x => x.maBienThe === id ? { ...x, trangThai: true } : x));
      showToast('Đã kích hoạt lại biến thể', 'success');
    } catch (error) {
      showToast('Có lỗi xảy ra khi kích hoạt biến thể', 'error');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getStockStatus = (stock) => {
    if (stock === 0) return { text: 'Hết hàng', color: 'bg-red-100 text-red-800' };
    if (stock <= 10) return { text: 'Sắp hết', color: 'bg-yellow-100 text-yellow-800' };
    return { text: 'Còn hàng', color: 'bg-green-100 text-green-800' };
  };

  // Helpers for auto-generating SKU
  const normalizeCode = (str) => {
    if (!str) return '';
    return String(str)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^A-Za-z0-9]/g, '')
      .toUpperCase();
  };

  const generateSku = useCallback((maSanPham, attrs, productsList, existingSkus = []) => {
    const prod = (productsList || []).find(p => String(p.maSanPham) === String(maSanPham));
    const productCode = prod ? normalizeCode(prod.tenSanPham).slice(0, 6) : `SP${maSanPham || ''}`;
    // Build tokens from selected attributes + entered values
    const attrTokens = (attrs || [])
      .filter(a => (a && (a.tenThuocTinh || a.maThuocTinh) && String(a.giaTri || '').trim().length > 0))
      .map(a => {
        const name = normalizeCode(a.tenThuocTinh || a.maThuocTinh).slice(0, 2);
        const val = normalizeCode(a.giaTri || '').slice(0, 3);
        return `${name}${val}`;
      })
      .filter(Boolean);
    const base = [productCode, ...attrTokens].filter(Boolean).join('-');
    if (!base) return '';
    // Ensure uniqueness: if collision, append -2, -3, ...
    const used = new Set((existingSkus || []).map(s => String(s || '').toUpperCase()));
    let candidate = base;
    let i = 2;
    while (used.has(candidate.toUpperCase())) {
      candidate = `${base}-${i}`;
      i += 1;
    }
    return candidate;
  }, []);

  // Auto-generate SKU when product or attributes change, unless user edited SKU manually
  useEffect(() => {
    if (!showModal) return; // only when modal open
    if (skuEdited) return;  // don't override manual edit
    if (!formData.maSanPham) return; // need a base product
    const existingSkus = (variants || []).map(v => v?.sku).filter(Boolean);
    const autoSku = generateSku(formData.maSanPham, editedAttributes, products, existingSkus);
    if (autoSku && autoSku !== formData.sku) {
      setFormData(prev => ({ ...prev, sku: autoSku }));
    }
  }, [formData.maSanPham, editedAttributes, products, variants, skuEdited, showModal, formData.sku, generateSku]);

  // no-op effect to reference some variables/functions so linters don't mark them unused during development
  React.useEffect(() => {
    void isLoading; void error; void mapVariantToApi;
  }, [isLoading, error, mapVariantToApi]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý Biến thể Sản phẩm</h1>
              <p className="text-gray-600 mt-1">Quản lý các biến thể (SKU) với giá và tồn kho riêng biệt</p>
            </div>

            <button
              onClick={() => openModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <IoAdd className="text-lg" />
              Thêm biến thể
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative lg:col-span-1">
              <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên sản phẩm hoặc SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Product filter */}
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả sản phẩm</option>
              {products.map(product => (
                <option key={product.maSanPham} value={product.maSanPham}>
                  {product.tenSanPham}
                </option>
              ))}
            </select>

            {/* Stock filter: predefined or custom limit */}
            <div className="flex gap-2">
              <select
                value={stockFilter}
                onChange={(e) => {
                  setStockFilter(e.target.value);
                  if (e.target.value !== '') setStockLimit('');
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tất cả tồn kho</option>
                <option value="high">Còn nhiều (&gt;10)</option>
                <option value="low">Sắp hết (≤10)</option>
                <option value="out">Hết hàng (0)</option>
              </select>
              <input
                type="number"
                placeholder="≤ số lượng"
                value={stockLimit}
                onChange={(e) => {
                  setStockLimit(e.target.value);
                  if (e.target.value !== '') setStockFilter('');
                }}
                min="0"
                className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Attribute Type filter (Step 1) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAttributeFilter(!showAttributeFilter)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left flex items-center justify-between bg-white"
              >
                <span className={selectedAttributeTypes.length > 0 ? 'text-gray-900' : 'text-gray-500'}>
                  {selectedAttributeTypes.length > 0 
                    ? `Loại thuộc tính (${selectedAttributeTypes.length})`
                    : 'Chọn loại thuộc tính'}
                </span>
                <svg className={`w-5 h-5 transition-transform ${showAttributeFilter ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown panel for attribute types */}
              {showAttributeFilter && (
                <div className="absolute z-10 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-auto">
                  <div className="p-3">
                    <div className="space-y-2">
                      {allAttributesInVariants.map((attr, idx) => {
                        const attrId = String(attr.maThuocTinh);
                        const isSelected = selectedAttributeTypes.includes(attrId);
                        
                        return (
                          <label key={`attr-type-${idx}`} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedAttributeTypes(prev => [...prev, attrId]);
                                } else {
                                  setSelectedAttributeTypes(prev => prev.filter(id => id !== attrId));
                                  // Clear values for this attribute type
                                  setSelectedAttributeFilters(prev => {
                                    const newFilters = { ...prev };
                                    delete newFilters[attrId];
                                    return newFilters;
                                  });
                                }
                              }}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-900 font-medium">{attr.tenThuocTinh}</span>
                            {selectedAttributeFilters[attrId]?.length > 0 && (
                              <span className="text-xs text-blue-600">
                                ({selectedAttributeFilters[attrId].length})
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-3 border-t border-gray-200 bg-gray-50 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAttributeTypes([]);
                        setSelectedAttributeFilters({});
                      }}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      Xóa tất cả
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAttributeFilter(false)}
                      className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Áp dụng
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Attribute Value filter (Step 2) - Only shown when attribute types are selected */}
            {selectedAttributeTypes.length > 0 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowAttributeValueFilter(!showAttributeValueFilter)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left flex items-center justify-between bg-white"
                >
                  <span className={Object.keys(selectedAttributeFilters).some(k => selectedAttributeFilters[k].length > 0) ? 'text-gray-900' : 'text-gray-500'}>
                    {(() => {
                      const totalValues = Object.values(selectedAttributeFilters).reduce((sum, arr) => sum + arr.length, 0);
                      return totalValues > 0 
                        ? `Giá trị (${totalValues})`
                        : 'Chọn giá trị';
                    })()}
                  </span>
                  <svg className={`w-5 h-5 transition-transform ${showAttributeValueFilter ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown panel for attribute values */}
                {showAttributeValueFilter && (
                  <div className="absolute z-10 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-auto">
                    <div className="divide-y divide-gray-200">
                      {selectedAttributeTypes.map((attrId, idx) => {
                        const attr = allAttributesInVariants.find(a => String(a.maThuocTinh) === attrId);
                        if (!attr) return null;
                        
                        const selectedValues = selectedAttributeFilters[attrId] || [];
                        
                        return (
                          <div key={`attr-values-${idx}`} className="p-3">
                            {/* Attribute name header */}
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-sm font-semibold text-gray-900">
                                {attr.tenThuocTinh}
                                {selectedValues.length > 0 && (
                                  <span className="ml-2 text-xs font-normal text-blue-600">
                                    ({selectedValues.length}/{attr.values.length})
                                  </span>
                                )}
                              </h4>
                              {selectedValues.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedAttributeFilters(prev => ({
                                      ...prev,
                                      [attrId]: []
                                    }));
                                  }}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Bỏ chọn
                                </button>
                              )}
                            </div>

                            {/* Checkbox list for values */}
                            <div className="grid grid-cols-2 gap-2">
                              {attr.values.map((val, vidx) => (
                                <label key={`val-${idx}-${vidx}`} className="flex items-center space-x-2 p-1.5 hover:bg-gray-50 rounded cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedValues.includes(val)}
                                    onChange={(e) => {
                                      setSelectedAttributeFilters(prev => {
                                        const currentValues = prev[attrId] || [];
                                        if (e.target.checked) {
                                          return {
                                            ...prev,
                                            [attrId]: [...currentValues, val]
                                          };
                                        } else {
                                          return {
                                            ...prev,
                                            [attrId]: currentValues.filter(v => v !== val)
                                          };
                                        }
                                      });
                                    }}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                  <span className="text-sm text-gray-700">{val}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Actions */}
                    <div className="p-3 border-t border-gray-200 bg-gray-50 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAttributeFilters({});
                        }}
                        className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-100"
                      >
                        Xóa giá trị
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAttributeValueFilter(false)}
                        className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Áp dụng
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Variants Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Danh sách biến thể ({filteredVariants.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            {isLoading && (
              <div className="p-6 text-gray-600">Đang tải dữ liệu biến thể...</div>
            )}
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <IoCube />
                      Sản phẩm
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <IoBarcode />
                      SKU
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <IoLayers />
                      Thuộc tính
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center gap-2">
                      <IoPricetag />
                      Giá bán
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tồn kho
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVariants.length === 0 && !isLoading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <IoSearch className="text-4xl text-gray-400 mb-2" />
                        <p>Không tìm thấy biến thể nào</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredVariants.map((variant) => {
                    const stockStatus = getStockStatus(variant.soLuongTon);
                    return (
                      <tr key={variant.maBienThe} className={`hover:bg-gray-50 transition-colors ${variant.trangThai === false ? 'opacity-50 filter grayscale' : ''}`}>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              <span className="font-sans">{variant.sanPham.tenSanPham}</span>
                            </div>
                            <div className="text-sm text-gray-500">
                              <span className="font-sans">ID: #{variant.maBienThe}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className="text-xs font-mono font-medium text-gray-900 bg-gray-100 px-2 py-1 rounded max-w-[80px] truncate inline-block align-middle cursor-pointer"
                            title={variant.sku}
                          >
                            {variant.sku}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1 min-w-[220px] max-w-[400px] break-words">
                            {variant.attributes.map((attr, index) => (
                              <span key={index} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-1 font-sans">
                                {attr.tenThuocTinh ? `${attr.tenThuocTinh}: ${attr.giaTri}` : attr.giaTri}
                              </span>
                            ))}
                            {variant.attributes.length === 0 && (
                              <span className="text-sm text-gray-400">Chưa có thuộc tính</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-semibold text-gray-900">
                            {formatPrice(variant.giaBan)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-sm font-semibold text-gray-900">
                              {variant.soLuongTon}
                            </span>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${stockStatus.color}`}>
                              {stockStatus.text}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openModal(variant)}
                              className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                              title="Chỉnh sửa"
                            >
                              <IoCreate className="text-lg" />
                            </button>

                            {variant.trangThai === false ? (
                              <button
                                onClick={() => handleActivate(variant.maBienThe)}
                                className="text-green-600 hover:text-green-900 p-1 rounded transition-colors"
                                title="Kích hoạt lại"
                              >
                                <IoPlay className="text-lg" />
                              </button>
                            ) : (
                              <button
                                onClick={() => handleDelete(variant.maBienThe)}
                                className="text-yellow-600 hover:text-yellow-900 p-1 rounded transition-colors"
                                title="Tạm dừng"
                              >
                                <IoPause className="text-lg" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={closeModal} title={editingVariant ? 'Chỉnh sửa biến thể sản phẩm' : 'Thêm biến thể sản phẩm mới'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="maSanPham" className="block text-sm font-medium text-gray-700 mb-1">
              Sản phẩm gốc *
            </label>
            {/* Search input for filtering products */}
            <div className="mb-2 relative">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm theo tên hoặc mã..."
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
            </div>
            <select
              id="maSanPham"
              value={formData.maSanPham}
              onChange={(e) => setFormData({ ...formData, maSanPham: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Chọn sản phẩm</option>
              {products
                .filter(p => {
                  if (!productSearchTerm) return true;
                  const q = productSearchTerm.toLowerCase();
                  return (
                    (p.tenSanPham && p.tenSanPham.toLowerCase().includes(q)) ||
                    String(p.maSanPham).includes(productSearchTerm)
                  );
                })
                .map(product => (
                  <option key={product.maSanPham} value={product.maSanPham}>
                    {product.tenSanPham}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
              Mã SKU *
            </label>
            <input
              type="text"
              id="sku"
              value={formData.sku}
              onChange={(e) => {
                setFormData({ ...formData, sku: e.target.value });
                setSkuEdited(true);
              }}
              placeholder="Ví dụ: GG001-R-L"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Mã SKU phải duy nhất cho mỗi biến thể</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="giaMua" className="block text-sm font-medium text-gray-700 mb-1">
                Giá mua (VND)
              </label>
              <input
                type="number"
                id="giaMua"
                value={formData.giaMua}
                onChange={(e) => setFormData({ ...formData, giaMua: e.target.value })}
                placeholder="2000000"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="giaBan" className="block text-sm font-medium text-gray-700 mb-1">
                Giá bán (VND) *
              </label>
              <input
                type="number"
                id="giaBan"
                value={formData.giaBan}
                onChange={(e) => setFormData({ ...formData, giaBan: e.target.value })}
                placeholder="2500000"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Removed the Cancel button section as requested */}

          {/* Attribute editing (single variant only) */}
          <div className="mt-4 border-t pt-4">
            <h4 className="font-medium mb-3">Thuộc tính biến thể</h4>
            {attrLoading ? (
              <div className="py-2 text-gray-600">Đang tải thuộc tính...</div>
            ) : attrError ? (
              <div className="p-3 bg-red-50 border rounded text-sm text-red-700">
                Lỗi khi tải thuộc tính: {attrError}
                <div className="mt-2"><button type="button" onClick={fetchAttributes} className="px-3 py-1 bg-blue-600 text-white rounded">Tải lại</button></div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {(editedAttributes || []).map((row, idx) => {
                    const meta = attributes.find(a => String(a.id ?? a.maThuocTinh) === String(row.maThuocTinh));
                    const hasValues = Array.isArray(meta?.values) && meta.values.length > 0;
                    return (
                      <div key={`ea-${idx}`} className="flex items-center gap-3 p-2 border rounded bg-white">
                        <div className="w-1/3 font-medium text-gray-700">{row.tenThuocTinh || row.maThuocTinh}</div>
                        {hasValues ? (
                          <select
                            className="p-2 border rounded flex-1"
                            value={row.giaTri || ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              setEditedAttributes(prev => prev.map((r, i) => i === idx ? { ...r, giaTri: v } : r));
                            }}
                          >
                            <option value="">-- Chọn giá trị --</option>
                            {meta.values.map((v, vi) => (
                              <option key={`val-${meta.id}-${vi}`} value={v.tenGiaTri}>{v.tenGiaTri}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={row.giaTri || ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              setEditedAttributes((prev) => prev.map((r, i) => i === idx ? { ...r, giaTri: v } : r));
                            }}
                            placeholder="Giá trị (VD: Đỏ)"
                            className="p-2 border rounded flex-1"
                          />
                        )}
                        <button type="button" onClick={() => setEditedAttributes((prev) => prev.filter((_, i) => i !== idx))} className="px-2 py-1 bg-red-50 text-red-600 rounded">Xóa</button>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 p-2 border rounded bg-white flex items-center gap-3">
                  <select
                    className="p-2 border rounded w-1/3"
                    value={newAttrId}
                    onChange={(e) => setNewAttrId(e.target.value)}
                  >
                    <option value="">-- Chọn thuộc tính --</option>
                    {attributes
                      .filter((a) => !(editedAttributes || []).some((r) => String(r.maThuocTinh) === String(a.id ?? a.maThuocTinh)))
                      .map((a, ai) => (
                        <option key={`attr-opt-${ai}`} value={a.id ?? a.maThuocTinh}>{a.tenThuocTinh}</option>
                      ))}
                  </select>
                  {(() => {
                    const meta = attributes.find(a => String(a.id ?? a.maThuocTinh) === String(newAttrId));
                    const hasValues = Array.isArray(meta?.values) && meta.values.length > 0;
                    if (hasValues) {
                      return (
                        <select
                          className="p-2 border rounded flex-1"
                          value={newAttrValue}
                          onChange={(e) => setNewAttrValue(e.target.value)}
                        >
                          <option value="">-- Chọn giá trị --</option>
                          {meta.values.map((v, vi) => (
                            <option key={`meta-val-${vi}`} value={v.tenGiaTri}>{v.tenGiaTri}</option>
                          ))}
                        </select>
                      );
                    }
                    return (
                      <input
                        type="text"
                        placeholder="Giá trị (VD: Đỏ)"
                        value={newAttrValue}
                        onChange={(e) => setNewAttrValue(e.target.value)}
                        className="p-2 border rounded flex-1"
                      />
                    );
                  })()}
                  <button
                    type="button"
                    onClick={() => {
                      if (!newAttrId || !String(newAttrValue).trim()) { showToast('Chọn thuộc tính và nhập giá trị', 'error'); return; }
                      const meta = attributes.find((a) => String(a.id ?? a.maThuocTinh) === String(newAttrId));
                      setEditedAttributes((prev) => [...prev, { maThuocTinh: Number(newAttrId), tenThuocTinh: meta?.tenThuocTinh || String(newAttrId), giaTri: String(newAttrValue) }]);
                      setNewAttrId('');
                      setNewAttrValue('');
                    }}
                    className="px-3 py-2 bg-green-600 text-white rounded"
                  >Thêm thuộc tính</button>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <IoSave />
              {editingVariant ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmDeactivate}
        title="Tạm dừng biến thể"
        message="Bạn có chắc chắn muốn tạm dừng (ngừng hoạt động) biến thể này? Bạn có thể kích hoạt lại sau."
        confirmText="Tạm dừng"
        cancelText="Hủy"
      />

      {/* Toast */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: '' })}
        />
      )}
    </div>
  );
};

export default ProductVariantManagement;
