import React, { useState, useEffect, useCallback } from 'react';
import { IoAdd, IoImage, IoCube, IoPricetag, IoGrid, IoList } from 'react-icons/io5';
import api from '../../../api'; // Giữ nguyên việc import API
import DataTable from '../../shared/DataTable'; // Giữ nguyên việc import component dùng chung
import Modal from '../../shared/Modal'; // Giữ nguyên việc import component dùng chung
import FileUpload from '../../shared/FileUpload'; // Giữ nguyên việc import component dùng chung

const ProductManagement = () => {
  // --- STATE MANAGEMENT ---
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [collections, setCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modals for Products
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [showImageManagementModal, setShowImageManagementModal] = useState(false);

  // Modals and State for Variants (Simplified for this file's scope)
  const [showAddVariantModal, setShowAddVariantModal] = useState(false);
  const [showEditVariantModal, setShowEditVariantModal] = useState(false);
  const [showDeleteVariantConfirm, setShowDeleteVariantConfirm] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [variantToDelete, setVariantToDelete] = useState(null);
  const [attributes, setAttributes] = useState([]); // list of attributes with values
  const [attrLoading, setAttrLoading] = useState(false);
  const [attrError, setAttrError] = useState(null);
  const [variantSelections, setVariantSelections] = useState({}); // { attributeId: Array(valueId) }
  const [bulkVariantsPreview, setBulkVariantsPreview] = useState([]); // placeholder: preview list for bulk creation
  const [explicitRows, setExplicitRows] = useState([]); // placeholder: [{ maThuocTinh, giaTri }]
  const [newAttr, setNewAttr] = useState('');
  const [newValue, setNewValue] = useState('');
  const [variantMode, setVariantMode] = useState('selection'); // 'selection' | 'manual'
  const [attributeSearchTerm, setAttributeSearchTerm] = useState(''); // Search term for filtering attributes
  // Avoid list reordering while user is typing a custom value
  const [activeEditingAttrKey, setActiveEditingAttrKey] = useState(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterCollection, setFilterCollection] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeTab, setActiveTab] = useState('info'); // Will default to 'info' or 'variants'
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  const [productForm, setProductForm] = useState({
    tenSanPham: '',
    moTa: '',
    maDanhMuc: '',
    maNhaCungCap: '',
    maBoSuuTap: '',
    diemThuong: 0
  });

  const [productImages, setProductImages] = useState([]);
  const [productVariants, setProductVariants] = useState([]);
  const [variantCountsMap, setVariantCountsMap] = useState({}); // { [productId]: count }
  const [variantSearchTerm, setVariantSearchTerm] = useState(''); // Search term for filtering variants

  const [variantForm, setVariantForm] = useState({
    sku: '',
    giaMua: '',
    giaBan: '',
    soLuongTon: '',
    mucTonToiThieu: '',
    trangThaiKho: 'INACTIVE' // Default to INACTIVE for new variants
  });

  // Auto-generate SKU when selections change
  useEffect(() => {
    try {
      if (!selectedProduct) return;

      // Build mappings from current UI state
      let mappings = [];
      if (variantMode === 'rows' && Array.isArray(explicitRows) && explicitRows.length > 0) {
        mappings = explicitRows
          .filter(r => r && r.maThuocTinh && String(r.giaTri ?? '').trim() !== '')
          .map(r => ({ maThuocTinh: r.maThuocTinh, giaTri: String(r.giaTri).trim() }));
      } else if (Array.isArray(attributes)) {
        for (const attr of attributes) {
          const aKey = String(attr.id || attr.maThuocTinh);
          const sel = variantSelections[aKey] || [];
          if (sel.length === 1 && String(sel[0]).trim() !== '') {
            mappings.push({ maThuocTinh: attr.id || attr.maThuocTinh, giaTri: String(sel[0]).trim() });
          }
        }
      }

      if (mappings.length === 0) {
        if (showAddVariantModal) {
          setVariantForm(prev => ({ ...prev, sku: '' }));
        }
        return;
      }

      // Inline SKU composition to satisfy hook dependency rules
      const rawName = String(selectedProduct?.tenSanPham || selectedProduct?.name || '');
      const nameUpper = rawName
        .normalize('NFD')
        .replace(/\p{Diacritic}+/gu, '')
        .replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'))
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, ' ')
        .trim();
      const initials = nameUpper.split(' ').filter(Boolean).map(w => w[0]).join('');
      const prefix = (initials || 'PRD').slice(0, 4);
      const parts = mappings.map(m => {
        const val = String(m.giaTri || '')
          .normalize('NFD')
          .replace(/\p{Diacritic}+/gu, '')
          .replace(/[đĐ]/g, (mm) => (mm === 'đ' ? 'd' : 'D'))
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, '')
          .trim();
        return val.slice(0, 3) || 'X';
      });
      const autoSku = parts.length ? `${prefix}-${parts.join('-')}` : '';
      if (showAddVariantModal) {
        setVariantForm(prev => ({ ...prev, sku: autoSku }));
      } else if (showEditVariantModal) {
        // In edit flow, update SKU if attribute mappings are explicitly changed
        setVariantForm(prev => ({ ...prev, sku: autoSku }));
      }
    } catch (e) {
      // Non-fatal: keep manual SKU if any
    }
  }, [variantMode, explicitRows, variantSelections, attributes, selectedProduct, showAddVariantModal, showEditVariantModal]);

  // Minimal mapping helpers (kept local here to avoid large refactors)
  const mapProductFromApi = (p) => ({
    id: p.maSanPham || p.id,
    tenSanPham: p.tenSanPham || '',
    moTa: p.moTa || '',
    maDanhMuc: p.maDanhMuc || (p.danhMuc && (p.danhMuc.maDanhMuc || p.danhMuc.id)) || '',
    tenDanhMuc: p.tenDanhMuc || (p.danhMuc && (p.danhMuc.tenDanhMuc || p.danhMuc.name)) || 'Chưa phân loại',
    maNhaCungCap: p.maNhaCungCap || (p.nhaCungCap && (p.nhaCungCap.maNhaCungCap || p.nhaCungCap.id)) || '',
    tenNhaCungCap: p.tenNhaCungCap || (p.nhaCungCap && (p.nhaCungCap.tenNhaCungCap || p.nhaCungCap.name)) || 'Chưa phân loại',
    maBoSuuTap: p.maBoSuuTap || (p.boSuuTap && (p.boSuuTap.maBoSuuTap || p.boSuuTap.id)) || '',
    tenBoSuuTap: p.tenBoSuuTap || (p.boSuuTap && (p.boSuuTap.tenBoSuuTap || p.boSuuTap.name)) || 'Chưa phân loại',
    trangThai: p.trangThai || 'ACTIVE', // Default to ACTIVE if not set
    ngayTao: p.ngayTao || '',
    ngayCapNhat: p.ngayCapNhat || '',
    soLuongBienThe: p.soLuongBienThe || 0,
    hinhAnhs: p.hinhAnhs || [],
    diemThuong: p.diemThuong != null ? p.diemThuong : 0
  });

  const mapProductToApi = (p) => ({
    tenSanPham: p.tenSanPham,
    moTa: p.moTa,
    maDanhMuc: p.maDanhMuc ? parseInt(p.maDanhMuc) : null,
    maNhaCungCap: p.maNhaCungCap ? parseInt(p.maNhaCungCap) : null,
    maBoSuuTap: p.maBoSuuTap ? parseInt(p.maBoSuuTap) : null,
    diemThuong: p.diemThuong != null ? parseInt(p.diemThuong) : 0
  });

  // (helpers for SKU generation are inlined within the effect to avoid hook deps churn)

  const isFileLike = (f) => {
    if (!f) return false;
    if (typeof File !== 'undefined' && f instanceof File) return true;
    if (f && f.file && typeof File !== 'undefined' && f.file instanceof File) return true;
    if (f && typeof f.name === 'string' && typeof f.size === 'number' && typeof f.type === 'string') return true;
    return false;
  };

  // --- FETCHING FUNCTIONS ---
  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/api/products');
      if (Array.isArray(data)) {
        const mapped = data.map(mapProductFromApi);
        setProducts(mapped);
        fetchVariantCountsForProducts(mapped).catch(() => { });
      } else if (data && data.content) {
        const mapped = data.content.map(mapProductFromApi);
        setProducts(mapped);
        fetchVariantCountsForProducts(mapped).catch(() => { });
      } else {
        setProducts([]);
      }
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchVariantCountsForProducts = async (productsList) => {
    if (!Array.isArray(productsList) || productsList.length === 0) return;
    const batchSize = 8;
    const counts = {};
    for (let i = 0; i < productsList.length; i += batchSize) {
      const batch = productsList.slice(i, i + batchSize);
      await Promise.all(batch.map(async (p) => {
        try {
          const resp = await api.get(`/api/bien-the-san-pham/san-pham/${p.id}`);
          counts[p.id] = Array.isArray(resp) ? resp.length : Number(p.soLuongBienThe || 0);
        } catch (e) {
          counts[p.id] = Number(p.soLuongBienThe || 0);
        }
      }));
    }
    setVariantCountsMap(prev => ({ ...prev, ...counts }));
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchSuppliers();
    fetchCollections();
  }, [fetchProducts]);

  const fetchCategories = async () => {
    try {
      const data = await api.get('/api/categories');
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {

    }
  };

  const fetchSuppliers = async () => {
    try {
      const data = await api.get('/api/suppliers');
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err) {
      
    }
  };

  const fetchCollections = async () => {
    try {
      const data = await api.get('/api/collections');
      setCollections(Array.isArray(data) ? data : []);
    } catch (err) {
      
    }
  };

  const fetchProductVariants = async (maSanPham) => {
    try {
      const data = await api.get(`/api/bien-the-san-pham/san-pham/${maSanPham}`);
      setProductVariants(Array.isArray(data) ? data : []);
      if (Array.isArray(data)) {
        setVariantCountsMap(prev => ({ ...prev, [maSanPham]: data.length }));
      }
    } catch (err) {
      setProductVariants([]);
    }
  };

  const fetchAttributesSilent = async () => {
    setAttrLoading(true);
    try {
      const attrs = await api.get('/api/attributes');
      if (!Array.isArray(attrs)) {
        setAttributes([]);
      } else {
        // Group attributes by category if available
        const grouped = {};
        attrs.forEach(a => {
          const group = a.nhomThuocTinh || a.group || a.category || 'Khác';
          if (!grouped[group]) grouped[group] = [];
          grouped[group].push({
            id: a.maThuocTinh || a.id,
            tenThuocTinh: a.tenThuocTinh || a.name || a.label || String(a.maThuocTinh || a.id),
            values: Array.isArray(a.values) ? a.values.map(v => ({ id: v.maGiaTriThuocTinh || v.id, tenGiaTri: v.tenGiaTri || v.name || v.value })) : [],
            raw: a
          });
        });
        setAttributes(grouped);
      }
    } catch (e) {
    } finally {
      setAttrLoading(false);
    }
  };

  const computeVariantCount = (product) => {
    if (!product) return 0;
    if (variantCountsMap && variantCountsMap[product.id] != null) return Number(variantCountsMap[product.id]);
    if (selectedProduct && product.id === selectedProduct.id && Array.isArray(productVariants)) {
      return productVariants.length;
    }
    return Number(product.soLuongBienThe || 0);
  };

  // --- PRODUCT HANDLERS ---

  const resetForm = () => {
    setProductForm({
      tenSanPham: '',
      moTa: '',
      maDanhMuc: '',
      maNhaCungCap: '',
      maBoSuuTap: '',
      diemThuong: 0
    });
    setProductImages([]);
  };

  const handleAddProduct = async () => {
    const formData = new FormData();

    formData.append('tenSanPham', productForm.tenSanPham);
    formData.append('maNhaCungCap', productForm.maNhaCungCap);

    if (productForm.moTa) formData.append('moTa', productForm.moTa);
    if (productForm.maDanhMuc) formData.append('maDanhMuc', productForm.maDanhMuc);
    if (productForm.maBoSuuTap) formData.append('maBoSuuTap', productForm.maBoSuuTap);
    if (productForm.diemThuong != null) formData.append('diemThuong', String(productForm.diemThuong));

    productImages.forEach((file) => {
      if (isFileLike(file)) {
        const f = file.file || file;
        formData.append('images', f);
      }
    });

    try {
      let created = await api.post('/api/products/with-images', { body: formData });

      if (created && ((!created.hinhAnhs || created.hinhAnhs.length === 0) || !created.ngayTao || !created.ngayCapNhat)) {
        try {
          const id = created?.maSanPham || created?.id;
          if (id) {
            const refreshed = await api.get(`/api/products/${id}`);
            if (refreshed) created = refreshed;
          }
        } catch (refetchErr) {
        }
      }

      const createdMapped = mapProductFromApi(created);
      setProducts(prev => [...prev, createdMapped]);
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      setError(err);
    }
  };

  const handleEditProduct = async () => {
    try {
      const payload = mapProductToApi(productForm);

      let updatedProduct = null;
      try {
        updatedProduct = await api.put(`/api/products/${selectedProduct.id}`, { body: payload });
      } catch (jsonErr) {
        
      }

      const hasFileObjects = Array.isArray(productImages) && productImages.some(f => f && ((typeof File !== 'undefined' && f instanceof File) || (f.name && typeof f.size === 'number')));
      if (hasFileObjects) {
        const formData = new FormData();
        formData.append('maSanPham', selectedProduct.id);
        formData.append('tenSanPham', productForm.tenSanPham);
        if (productForm.moTa) formData.append('moTa', productForm.moTa);
        if (productForm.maDanhMuc) formData.append('maDanhMuc', productForm.maDanhMuc);
        if (productForm.maBoSuuTap) formData.append('maBoSuuTap', productForm.maBoSuuTap);
        if (productForm.maNhaCungCap) formData.append('maNhaCungCap', productForm.maNhaCungCap);
        if (productForm.diemThuong != null) formData.append('diemThuong', String(productForm.diemThuong));

        productImages.forEach((file) => {
          if (file && ((typeof File !== 'undefined' && file instanceof File) || (file.name && typeof file.size === 'number'))) {
            if (isFileLike(file)) {
              const f = file.file || file;
              formData.append('images', f);
            }
          }
        });

        try {
          const imgResp = await api.post(`/api/products/${selectedProduct.id}/images/upload`, { body: formData });
          if (imgResp) updatedProduct = imgResp;
        } catch (imgErr1) {
          
        }
      }

      if (updatedProduct) {
        if ((!updatedProduct.hinhAnhs || updatedProduct.hinhAnhs.length === 0) || !updatedProduct.ngayTao || !updatedProduct.ngayCapNhat) {
          try {
            const refreshed = await api.get(`/api/products/${selectedProduct.id}`);
            if (refreshed) updatedProduct = refreshed;
          } catch (refetchErr) {
            
          }
        }
        const mapped = mapProductFromApi(updatedProduct);
        setProducts(prev => prev.map(p => p.id === selectedProduct.id ? { ...p, ...mapped } : p));
      } else {
        setProducts(prev => prev.map(p => p.id === selectedProduct.id ? { ...p, ...productForm } : p));
      }

      setShowEditModal(false);
      setSelectedProduct(null);
      resetForm();
    } catch (err) {
      setError(err);
    }
  };

  const handleDeactivateProduct = (maybeIdOrObj) => {
    let product = null;
    if (!maybeIdOrObj) return;
    if (typeof maybeIdOrObj === 'object') {
      product = maybeIdOrObj;
    } else {
      product = products.find(p => p.id === maybeIdOrObj || p.maSanPham === maybeIdOrObj);
    }
    if (!product) {
      return;
    }
    setProductToDelete(product);
    setShowDeleteConfirm(true);
  };

  const confirmDeactivateProduct = async () => {
    if (!productToDelete) return;

    try {
      const productId = productToDelete.id || productToDelete.maSanPham;
      
      // Update status to DISCONTINUED instead of deleting
      await api.patch(`/api/san-pham/${productId}`, {
        body: { trangThai: 'DISCONTINUED' }
      });
      
      // Update local state with new status
      setProducts(prev => prev.map(p => 
        (p.id === productId || p.maSanPham === productId)
          ? { ...p, trangThai: 'DISCONTINUED' }
          : p
      ));
      
      setShowDeleteConfirm(false);
      setProductToDelete(null);
    } catch (err) {
      setError(err);
    }
  };

  const handleReactivateProduct = async (maybeIdOrObj) => {
    let product = null;
    if (!maybeIdOrObj) return;
    if (typeof maybeIdOrObj === 'object') {
      product = maybeIdOrObj;
    } else {
      product = products.find(p => p.id === maybeIdOrObj || p.maSanPham === maybeIdOrObj);
    }
    if (!product) {
      return;
    }

    try {
      const productId = product.id || product.maSanPham;
      
      // Update status to ACTIVE to reactivate the product
      await api.patch(`/api/san-pham/${productId}`, {
        body: { trangThai: 'ACTIVE' }
      });
      
      // Update local state with new status
      setProducts(prev => prev.map(p => 
        (p.id === productId || p.maSanPham === productId)
          ? { ...p, trangThai: 'ACTIVE' }
          : p
      ));
    } catch (err) {
      setError(err);
    }
  };

  const handleViewProduct = async (product) => {
    setSelectedProduct(product);
    setProductForm({
      tenSanPham: product.tenSanPham,
      moTa: product.moTa,
      maDanhMuc: product.maDanhMuc,
      maNhaCungCap: product.maNhaCungCap,
      maBoSuuTap: product.maBoSuuTap
    });
    const normalized = (product.hinhAnhs || []).map((h, idx) => ({
      maHinhAnh: h.maHinhAnh || h.id,
      duongDanHinhAnh: h.duongDanHinhAnh || h.url || h.path,
      thuTu: h.thuTu != null ? h.thuTu : idx,
      laAnhChinh: !!h.laAnhChinh,
      moTa: h.moTa || h.description || ''
    }));
    setProductImages(normalized);
    await fetchProductVariants(product.id);
    await fetchAttributesSilent(); // For variant attribute display
    setShowDetailModal(true);
    setActiveTab('info');
  };

  const handleEditClick = (product) => {
    setSelectedProduct(product);
    setProductForm({
      tenSanPham: product.tenSanPham,
      moTa: product.moTa,
      maDanhMuc: product.maDanhMuc,
      maNhaCungCap: product.maNhaCungCap,
      maBoSuuTap: product.maBoSuuTap,
      diemThuong: product.diemThuong || 0
    });
    const normalized = (product.hinhAnhs || []).map((h, idx) => ({
      maHinhAnh: h.maHinhAnh || h.id,
      duongDanHinhAnh: h.duongDanHinhAnh || h.url || h.path,
      thuTu: h.thuTu != null ? h.thuTu : idx,
      laAnhChinh: !!h.laAnhChinh,
      moTa: h.moTa || h.description || ''
    }));
    setProductImages(normalized);
    setShowEditModal(true);
  };

  // --- IMAGE HANDLERS ---
  const handleImageUpload = (files) => {
    const newFiles = Array.isArray(files) ? files : [files];
    setProductImages(prev => {
      const merged = [...(Array.isArray(prev) ? prev : []), ...newFiles];
      const hasMain = merged.some(i => !!(i.laAnhChinh || i._isMain || i.isMain || i.main));
      if (!hasMain && merged.length > 0) {
        for (let i = 0; i < merged.length; i++) {
          const item = merged[i];
          if (item instanceof File || (item && item.duongDanHinhAnh)) { // Find first available image
            Object.assign(item, { _isMain: true, laAnhChinh: true });
            break;
          }
        }
      }
      return merged;
    });
  };

  const handleImageRemove = (index) => {
    setProductImages(prev => {
      const next = prev.filter((_, i) => i !== index);
      // Ensure there's still a main image if we removed the old one
      if (next.length > 0 && !next.some(i => !!(i.laAnhChinh || i._isMain))) {
        const firstAvailable = next.find(i => i instanceof File || i.duongDanHinhAnh);
        if (firstAvailable) {
          Object.assign(firstAvailable, { _isMain: true, laAnhChinh: true });
        }
      }
      return next;
    });
  };

  const handleToggleImageMain = (index) => {
    setProductImages(prev => {
      if (!Array.isArray(prev)) return prev;
      return prev.map((img, i) => {
        const isMain = i === index;
        if (img instanceof File) {
          return Object.assign(img, { _isMain: isMain, laAnhChinh: isMain });
        }
        return { ...img, laAnhChinh: isMain };
      });
    });
  };

  // --- VARIANT MANAGEMENT LOGIC (Keeping existing, simplified implementation) ---

  const resetVariantForm = () => {
    setVariantForm({
      sku: '',
      giaMua: '',
      giaBan: '',
      soLuongTon: '',
      trangThaiKho: 'INACTIVE' // Default to INACTIVE for new variants
    });
  };

  const handleAddVariant = () => {
    if (!selectedProduct) {
      return;
    }
    resetVariantForm();
    setBulkVariantsPreview([]);
    setVariantSelections({});
    setExplicitRows([{ maThuocTinh: '', giaTri: '' }]); // Initialize with one empty row
    setVariantMode('selection'); // Default to selection mode
    setAttributeSearchTerm(''); // Reset search term

    fetchAttributes(true);
  };

  const fetchAttributes = async (openForAdd = true, variantForPrefill = null) => {
    setAttrLoading(true);
    setAttrError(null);
    try {
      const attrs = await api.get('/api/attributes');
      let variantsValues = [];
      if (selectedProduct && selectedProduct.id != null) {
        try {
          const resp = await api.get(`/api/bien-the-san-pham/san-pham/${selectedProduct.id}`);
          variantsValues = Array.isArray(resp) ? resp : [];
        } catch (e) {
          
        }
      }

      let loaded = [];
      if (!openForAdd && variantForPrefill) {
        // Edit mode: Load only mapped attributes with their values
        const mappingCandidates =
          variantForPrefill.thuocTinhGiaTriTuDo ||
          variantForPrefill.bienTheThuocTinhs ||
          variantForPrefill.giaTriThuocTinhs ||
          variantForPrefill.thuocTinh ||
          variantForPrefill.thuocTinhMappings ||
          [];

        const norm = (Array.isArray(mappingCandidates) ? mappingCandidates : []).map(m => {
          if (!m) return null;
          // Normalize to { maThuocTinh, giaTri }
          const maThuocTinh = m.maThuocTinh ?? m.attributeId ?? m.ma ?? m.thuocTinh?.maThuocTinh ?? m.thuocTinh?.id;
          const giaTri = m.giaTri ?? m.giaTri?.giaTri ?? m.tenGiaTri ?? m.value ?? m.name;
          return maThuocTinh ? { maThuocTinh, giaTri } : null;
        }).filter(Boolean);

        loaded = (norm || []).map((m) => {
          const attrId = m.maThuocTinh;
          const meta = attrs.find(a => String(a.maThuocTinh || a.id) === String(attrId)) || {};
          const val = { id: String(m.giaTri ?? ''), tenGiaTri: String(m.giaTri ?? ''), raw: m };
          return { id: attrId, tenThuocTinh: meta.tenThuocTinh || meta.name || meta.label || String(attrId), values: [val], raw: meta };
        });

        const mappedIds = new Set((norm || []).map(m => String(m.maThuocTinh)));
        for (const a of attrs) {
          const aId = a.maThuocTinh || a.id;
          if (!mappedIds.has(String(aId))) {
            loaded.push({ id: aId, tenThuocTinh: a.tenThuocTinh || a.name || a.label || String(aId), values: [], raw: a });
          }
        }
      } else {
        // Add mode: Aggregate all textual values across all product variants
        loaded = await Promise.all(attrs.map(async (a) => {
          const attrId = a.maThuocTinh || a.id;
          let flatMappings = [];
          if (Array.isArray(variantsValues)) {
            for (const variantItem of variantsValues) {
              if (!variantItem) continue;
              const candidate = variantItem.thuocTinhGiaTriTuDo || variantItem.thuocTinhGiaTriTuDos || variantItem.thuocTinh || variantItem.thuocTinhMappings || variantItem.bienTheThuocTinhs || variantItem.giaTriThuocTinhs || null;
              if (Array.isArray(candidate)) {
                for (const m of candidate) {
                  if (!m) continue;
                  const extractedMa = m.maThuocTinh ?? m.attributeId ?? m.ma ?? (m.thuocTinh && (m.thuocTinh.maThuocTinh ?? m.thuocTinh.id ?? m.thuocTinh.ma)) ?? null;
                  const extractedVal = m.giaTri ?? (typeof m.giaTri === 'object' ? (m.giaTri.giaTri ?? m.giaTri.value ?? '') : null) ?? m.tenGiaTri ?? m.value ?? m.name;
                  if (extractedMa != null) {
                    flatMappings.push({ maThuocTinh: extractedMa, giaTri: extractedVal });
                  }
                }
              }
            }
          }
          const filtered = flatMappings.filter(m => String(m.maThuocTinh) === String(attrId));
          const mappedVals = (filtered || []).map((m, idx) => ({ id: String(m.giaTri ?? `val-${idx}`), tenGiaTri: String(m.giaTri ?? ''), raw: m }));
          return { id: attrId, tenThuocTinh: a.tenThuocTinh || a.name || a.label || String(attrId), values: mappedVals, raw: a };
        }));
      }

      setAttributes(loaded);

      // Prefill selections when editing.
      if (!openForAdd && variantForPrefill) {
        const variantToUse = variantForPrefill;
        const pre = {};

        // Free-text mappings (preferred for single variant editing UI)
        if (Array.isArray(variantToUse.thuocTinhGiaTriTuDo) && variantToUse.thuocTinhGiaTriTuDo.length > 0) {
          const rows = variantToUse.thuocTinhGiaTriTuDo.map(m => ({ maThuocTinh: m.maThuocTinh, giaTri: m.giaTri }));
          setExplicitRows(rows); // Set explicit rows for simplified edit view
          // Also set selections for form submission fallback
          for (const mapping of variantToUse.thuocTinhGiaTriTuDo) {
            const aKey = String(mapping.maThuocTinh);
            pre[aKey] = Array.isArray(pre[aKey]) ? [...pre[aKey], String(mapping.giaTri)] : [String(mapping.giaTri)];
          }
        } else {
          // Try to derive existing mappings into explicitRows for edit display
          const complexMappings = variantToUse.bienTheThuocTinhs || variantToUse.thuocTinhGiaTriTuDo || variantToUse.thuocTinhGiaTriTuDos || variantToUse.thuocTinh || variantToUse.thuocTinhMappings;
          if (Array.isArray(complexMappings) && complexMappings.length > 0) {
            const rows = complexMappings.map(m => {
              const ma = m.maThuocTinh ?? (m.thuocTinh && (m.thuocTinh.maThuocTinh ?? m.thuocTinh.id)) ?? m.attributeId ?? m.ma ?? '';
              const value = m.giaTri ?? (m.giaTri && typeof m.giaTri === 'object' ? (m.giaTri.giaTri ?? m.giaTri.value) : null) ?? m.tenGiaTri ?? m.value ?? m.name ?? '';
              return { maThuocTinh: String(ma), giaTri: String(value) };
            }).filter(r => r.maThuocTinh !== '');
            setExplicitRows(rows);
          } else {
            setExplicitRows([]); // Clear explicit rows if none exist
            // Legacy numeric IDs (fallback for older variants)
            if (Array.isArray(variantToUse.giaTriThuocTinhIds) && variantToUse.giaTriThuocTinhIds.length > 0) {
              const rows = [];
              for (const attr of loaded) {
                const aKey = String(attr.id || attr.maThuocTinh);
                const vals = (attr.values || []).map(v => String(v.id || v.maGiaTriThuocTinh));
                const selectedForAttr = (variantToUse.giaTriThuocTinhIds || []).map(String).filter(id => vals.includes(id));
                if (selectedForAttr.length > 0) {
                  pre[aKey] = selectedForAttr;
                  // Attempt to find human-readable labels from attr.values, else use the id
                  for (const selId of selectedForAttr) {
                    const match = (attr.values || []).find(v => String(v.id || v.maGiaTriThuocTinh) === String(selId));
                    rows.push({ maThuocTinh: aKey, giaTri: String(match?.tenGiaTri ?? selId) });
                  }
                }
              }
              if (rows.length > 0) setExplicitRows(rows);
            }
          }
        }

        setVariantSelections(pre);
      }
    } catch (err) {
      setAttributes([]);
      setAttrError(err?.message || 'Lỗi tải thuộc tính');
    } finally {
      setAttrLoading(false);
      if (openForAdd) setShowAddVariantModal(true); else setShowEditVariantModal(true);
    }
  };

  // Selection toggling is handled inline in UI handlers; no standalone toggle function needed.

  // note: bulk-preview functionality removed; keep placeholder removed
  React.useEffect(() => {
    void bulkVariantsPreview;
  }, [bulkVariantsPreview]);

  // Attach numeric suffix to SKU like BASE-<n>, replacing existing trailing -digits if present
  const attachSkuSuffix = (baseSku, n) => {
    const name = String(baseSku || '').trim();
    if (!name) return '';
    const stripped = name.replace(/-\d+$/i, '');
    return `${stripped}-${Number(n)}`;
  };

  // Ensure SKU is unique by probing backend and appending a counter if needed
  const ensureUniqueSku = async (baseSku) => {
    const norm = (s) => (s || '').trim();
    let candidate = norm(baseSku);
    if (!candidate) {
      candidate = `AUTO-${Date.now().toString(36).slice(-6).toUpperCase()}`;
    }
    let attempt = 1;
    const maxAttempts = 20;
    while (attempt <= maxAttempts) {
      try {
        // If this returns 200, SKU exists => try next candidate
        await api.get(`/api/bien-the-san-pham/sku/${encodeURIComponent(candidate)}`);
        attempt++;
        candidate = `${norm(baseSku)}-${attempt}`;
      } catch (e) {
        // If 404, it's available
        if (e && e.status === 404) return candidate;
        // For server errors, fallback to time/random suffix once
        if (e && e.status >= 500) {
          return `${norm(baseSku)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
        }
        // Any other error, consider it available to avoid blocking
        return candidate;
      }
    }
    // Fallback after many attempts
    return `${norm(baseSku)}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
  };

  const handleCreateSingleFromSelection = async () => {
    if (!selectedProduct) return;
    
    let mappings = [];
    
    if (variantMode === 'manual') {
      // Use explicitRows for manual mode
      mappings = explicitRows
        .filter(r => r.maThuocTinh && String(r.giaTri).trim() !== '')
        .map(r => ({ 
          maThuocTinh: Number(r.maThuocTinh), 
          giaTri: String(r.giaTri).trim() 
        }));
    } else {
      // Use variantSelections for selection mode
      for (const attr of attributes) {
        const aKey = String(attr.id || attr.maThuocTinh);
        const sel = variantSelections[aKey] || [];
        
        if (sel.length === 1 && String(sel[0]).trim() !== '') {
          mappings.push({ 
            maThuocTinh: Number(attr.id || attr.maThuocTinh), 
            giaTri: String(sel[0]).trim() 
          });
        }
      }
    }

    if (mappings.length === 0) { 
      alert('Vui lòng nhập ít nhất một giá trị thuộc tính'); 
      return; 
    }

    try {
      // Resolve a unique SKU before sending
      let desiredSku = (variantForm.sku && String(variantForm.sku).trim()) || `AUTO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const currentCount = Number((variantCountsMap && variantCountsMap[selectedProduct.id]) ?? selectedProduct.soLuongBienThe ?? 0);
      const nextIndex = currentCount + 1;
      const desiredSkuWithCount = attachSkuSuffix(desiredSku, nextIndex);
      const uniqueSku = await ensureUniqueSku(desiredSkuWithCount);
      if (uniqueSku !== desiredSku) {
        setVariantForm(prev => ({ ...prev, sku: uniqueSku }));
      }

      const payload = {
        maSanPham: selectedProduct.id,
        sku: uniqueSku,
        giaMua: variantForm.giaMua && Number(variantForm.giaMua) > 0 ? Number(variantForm.giaMua) : null,
        giaBan: variantForm.giaBan && Number(variantForm.giaBan) > 0 ? Number(variantForm.giaBan) : 1000,
        soLuongTon: 0,
        mucTonToiThieu: 0,
        trangThaiKho: variantForm.trangThaiKho || "INACTIVE", // Use selected status from form
        thuocTinhGiaTriTuDo: mappings
      };

      const created = await api.post(`/api/bien-the-san-pham/san-pham/${selectedProduct.id}`, payload);
      
      setProductVariants(prev => [...prev, created]);
      setShowAddVariantModal(false);
      resetVariantForm();

      setProducts(prev => prev.map(p => p.id === selectedProduct.id ? { ...p, soLuongBienThe: (p.soLuongBienThe || 0) + 1 } : p));
      setVariantCountsMap(prev => ({ ...prev, [selectedProduct.id]: (Number(prev[selectedProduct.id] || selectedProduct.soLuongBienThe || 0) + 1) }));

    } catch (err) {      
        // Display detailed error message
        let errorMessage = 'Không thể tạo biến thể: ';
        if (err.data) {
          if (typeof err.data === 'string') {
            errorMessage += err.data;
          } else if (err.data.message) {
            errorMessage += err.data.message;
          } else if (err.data.error) {
            errorMessage += err.data.error;
          } else {
            errorMessage += JSON.stringify(err.data);
          }
        } else {
          errorMessage += err.message || 'Lỗi không xác định';
        }
      
        alert(errorMessage);
        setError(err);
    }
  };


  const handleEditVariant = (variant) => {
    (async () => {
      try {
        const id = variant.id || variant.maBienThe || variant.ma;
        const full = await api.get(`/api/bien-the-san-pham/${id}`);
        const variantData = full || variant;
        setSelectedVariant(variantData);
        setVariantForm({
          sku: variantData.sku || '',
          giaMua: variantData.giaMua || '',
          giaBan: variantData.giaBan || '',
          soLuongTon: variantData.soLuongTon || '',
          mucTonToiThieu: variantData.mucTonToiThieu || '' // Ensure this field is populated
        });
        setVariantSelections({});
        fetchAttributes(false, variantData);
      } catch (err) {
        setSelectedVariant(variant);
        setVariantForm({
          sku: variant.sku || '',
          giaMua: variant.giaMua || '',
          giaBan: variant.giaBan || '',
          soLuongTon: variant.soLuongTon || '',
          mucTonToiThieu: variant.mucTonToiThieu || '',
          trangThaiKho: variant.trangThaiKho || 'INACTIVE'
        });
        fetchAttributes(false, variant);
      }
    })();
  };

  const handleUpdateVariant = async () => {
    if (!selectedVariant) {
      return;
    }

    try {
      const payload = {
        giaMua: parseFloat(variantForm.giaMua) || 0,
        giaBan: parseFloat(variantForm.giaBan) || 0
      };

      if (Array.isArray(explicitRows) && explicitRows.length > 0) {
        const mappings = explicitRows.map(r => ({ maThuocTinh: Number(r.maThuocTinh), giaTri: String(r.giaTri) }));
        payload.thuocTinhGiaTriTuDo = mappings;
      } else {
        const mappings = [];
        for (const attr of attributes) {
          const aKey = String(attr.id || attr.maThuocTinh);
          const sel = variantSelections[aKey] || [];
          for (const s of sel) {
            if (String(s).trim() !== '') mappings.push({ maThuocTinh: attr.id || attr.maThuocTinh, giaTri: String(s).trim() });
          }
        }
        if (mappings.length > 0) {
          payload.thuocTinhGiaTriTuDo = mappings;
        } else {
          // Fallback for numeric IDs (rare in modern system but for compatibility)
          payload.giaTriThuocTinhIds = Array.from(new Set(Object.values(variantSelections).flat().map(id => Number(id))));
        }
      }

      const variantId = selectedVariant?.id ?? selectedVariant?.maBienThe ?? selectedVariant?.ma ?? selectedVariant?.maBienTheId ?? null;
      if (!variantId) {
        setError(new Error('Không xác định được ID biến thể'));
        return;
      }

      await api.patch(`/api/bien-the-san-pham/${variantId}`, { body: payload });

      setProductVariants(prev => prev.map(v => (String(v.id) === String(variantId) || String(v.maBienThe) === String(variantId) ? { ...v, ...payload } : v)));

      setShowEditVariantModal(false);
      setSelectedVariant(null);
      resetVariantForm();
    } catch (err) {
      setError(err);
    }
  };

  const handleDeactivateVariant = (variant) => {
    setVariantToDelete(variant);
    setShowDeleteVariantConfirm(true);
  };

  const confirmDeactivateVariant = async () => {
    if (!variantToDelete) return;

    try {
      const variantId = variantToDelete?.id ?? variantToDelete?.maBienThe ?? variantToDelete?.ma ?? variantToDelete?.maBienTheId ?? null;
      if (!variantId) {
        setError(new Error('Không xác định được ID biến thể'));
        return;
      }

      // Update status to DISCONTINUED (keep prices unchanged)
      const payload = {
        trangThaiKho: 'DISCONTINUED'
      };

      await api.patch(`/api/bien-the-san-pham/${variantId}`, { body: payload });
      
      // Update local state with new status
      setProductVariants(prev => prev.map(v => 
        (String(v.id) === String(variantId) || String(v.maBienThe) === String(variantId)) 
          ? { ...v, trangThaiKho: 'DISCONTINUED' } 
          : v
      ));
      
      setShowDeleteVariantConfirm(false);
      setVariantToDelete(null);
    } catch (err) {
      setError(err);
    }
  };

  const handleReactivateVariant = async (variant) => {
    try {
      const variantId = variant?.id ?? variant?.maBienThe ?? variant?.ma ?? variant?.maBienTheId ?? null;
      if (!variantId) {
        setError(new Error('Không xác định được ID biến thể'));
        return;
      }

      // Update status to ACTIVE to reactivate the variant (keep prices unchanged)
      const payload = {
        trangThaiKho: 'ACTIVE'
      };

      await api.patch(`/api/bien-the-san-pham/${variantId}`, { body: payload });
      
      // Update local state with new status
      setProductVariants(prev => prev.map(v => 
        (String(v.id) === String(variantId) || String(v.maBienThe) === String(variantId)) 
          ? { ...v, trangThaiKho: 'ACTIVE' } 
          : v
      ));
    } catch (err) {
      setError(err);
    }
  };

  // --- END VARIANT MANAGEMENT LOGIC ---

  // --- FILTERING AND DISPLAY SETUP ---
  const filteredProducts = products.filter(product => {
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      const match = (product.tenSanPham || '').toLowerCase().includes(q) ||
        (product.tenDanhMuc || 'chưa phân loại').toLowerCase().includes(q) ||
        (product.tenNhaCungCap || 'chưa phân loại').toLowerCase().includes(q) ||
        (product.tenBoSuuTap || 'chưa phân loại').toLowerCase().includes(q);
      if (!match) return false;
    }

    if (filterCategory && String(product.maDanhMuc || '') !== String(filterCategory)) return false;
    if (filterCollection && String(product.maBoSuuTap || '') !== String(filterCollection)) return false;
    if (filterSupplier && String(product.maNhaCungCap || '') !== String(filterSupplier)) return false;

    return true;
  });

  const columns = [
    { field: 'tenSanPham', header: 'Tên sản phẩm', sortable: true },
    { field: (p) => (p.tenDanhMuc || (p.danhMuc && p.danhMuc.tenDanhMuc) || 'Chưa phân loại'), header: 'Danh mục', sortable: true },
    { field: (p) => (p.tenNhaCungCap || (p.nhaCungCap && p.nhaCungCap.tenNhaCungCap) || 'Chưa phân loại'), header: 'Nhà cung cấp', sortable: true },
    { field: (p) => (p.tenBoSuuTap || (p.boSuuTap && p.boSuuTap.tenBoSuuTap) || 'Chưa phân loại'), header: 'Bộ sưu tập', sortable: true },
    { field: (p) => computeVariantCount(p), header: 'Biến thể', sortable: true },
    {
      field: 'trangThai', header: 'Trạng thái', sortable: true, render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {value ? 'Hoạt động' : 'Ngừng'}
        </span>
      )
    }
  ];

  // Modified tabs structure: Merged Info and Images
  const tabs = [
    { id: 'info', label: '🏷️ Thông tin chung & Hình ảnh', icon: IoPricetag }, // Merged tab
    { id: 'variants', label: '🧬 Biến thể', icon: IoCube }
  ];

  // --- RENDER BLOCK ---
  return (
    <div className="p-6">
      {error && (
        <div className="mb-4 p-2 bg-red-50 border border-red-100 text-red-700 rounded">
          Lỗi: {String(error)}
        </div>
      )}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý sản phẩm</h1>
        <div className="flex items-center space-x-4">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
                }`}
              title="Xem dạng danh sách"
            >
              <IoList className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
                }`}
              title="Xem dạng lưới"
            >
              <IoGrid className="w-5 h-5" />
            </button>
          </div>

          {/* Filters: Category, Collection, Supplier */}
          <div className="flex items-center space-x-2">
            <select className="p-2 border rounded" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="">Tất cả danh mục</option>
              {categories.map(c => (
                <option key={c.maDanhMuc || c.id} value={c.maDanhMuc || c.id}>{c.tenDanhMuc || c.name}</option>
              ))}
            </select>
            <select className="p-2 border rounded" value={filterCollection} onChange={e => setFilterCollection(e.target.value)}>
              <option value="">Tất cả bộ sưu tập</option>
              {collections.map(col => (
                <option key={col.maBoSuuTap || col.id} value={col.maBoSuuTap || col.id}>{col.tenBoSuuTap || col.name}</option>
              ))}
            </select>
            <select className="p-2 border rounded" value={filterSupplier} onChange={e => setFilterSupplier(e.target.value)}>
              <option value="">Tất cả nhà cung cấp</option>
              {suppliers.map(s => (
                <option key={s.maNhaCungCap || s.id} value={s.maNhaCungCap || s.id}>{s.tenNhaCungCap || s.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => { setShowAddModal(true); resetForm(); }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
          >
            <IoAdd className="w-5 h-5" />
            <span>Thêm sản phẩm</span>
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <DataTable
          data={filteredProducts}
          columns={columns}
          onView={handleViewProduct}
          onEdit={handleEditClick}
          onDelete={handleDeactivateProduct}
          searchable={true}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          isLoading={isLoading}
        />
      ) : (
        <div className="space-y-6">
          {/* Search Bar for Grid View */}
          <div className="flex justify-between items-center">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Grid View */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts
                .sort((a, b) => {
                  // Sort: DISCONTINUED products go to bottom
                  const statusOrder = { 'ACTIVE': 1, 'INACTIVE': 2, 'DISCONTINUED': 3 };
                  const orderA = statusOrder[a.trangThai] || 99;
                  const orderB = statusOrder[b.trangThai] || 99;
                  return orderA - orderB;
                })
                .map(product => {
                  const isDiscontinued = product.trangThai === 'DISCONTINUED';
                  return (
                    <div 
                      key={product.id} 
                      className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden ${isDiscontinued ? 'opacity-50' : ''}`}
                    >
                      {/* Product Image */}
                      <div className="aspect-square bg-gray-100 relative">
                        {product.hinhAnhs && product.hinhAnhs.length > 0 ? (
                          <img
                            src={api.buildUrl(product.hinhAnhs[0].duongDanHinhAnh)}
                            alt={product.tenSanPham}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <IoImage className="w-12 h-12" />
                          </div>
                        )}

                        {/* Status Badge */}
                        <div className="absolute top-2 right-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            product.trangThai === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            product.trangThai === 'DISCONTINUED' ? 'bg-gray-100 text-gray-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {product.trangThai === 'ACTIVE' ? 'Hoạt động' : 
                             product.trangThai === 'DISCONTINUED' ? 'Ngừng kinh doanh' : 
                             'Không hoạt động'}
                          </span>
                        </div>
                      </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2 overflow-hidden"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        lineHeight: '1.5em',
                        maxHeight: '3em'
                      }}>
                      {product.tenSanPham}
                    </h3>

                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                      <p><span className="font-medium">Danh mục:</span> {product.tenDanhMuc || 'Chưa phân loại'}</p>
                      <p><span className="font-medium">Nhà cung cấp:</span> {product.tenNhaCungCap}</p>
                      <p><span className="font-medium">Biến thể:</span> {computeVariantCount(product)} loại</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewProduct(product)}
                        className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        Xem
                      </button>
                      {!isDiscontinued && (
                        <button
                          onClick={() => handleEditClick(product)}
                          className="flex-1 bg-yellow-50 text-yellow-600 px-3 py-2 rounded-lg hover:bg-yellow-100 transition-colors text-sm font-medium"
                        >
                          Sửa
                        </button>
                      )}
                      {isDiscontinued ? (
                        <button
                          onClick={() => handleReactivateProduct(product)}
                          className="flex-1 bg-green-50 text-green-600 px-3 py-2 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium"
                        >
                          ✓ Kích hoạt lại
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeactivateProduct(product.id)}
                          className="flex-1 bg-orange-50 text-orange-600 px-3 py-2 rounded-lg hover:bg-orange-100 transition-colors text-sm font-medium"
                        >
                          Vô hiệu hóa
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                  );
                })}
            </div>
          )}

          {filteredProducts.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <IoCube className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy sản phẩm</h3>
              <p className="text-gray-500">Thử tìm kiếm với từ khóa khác hoặc thêm sản phẩm mới.</p>
            </div>
          )}
        </div>
      )}

      {/* Add Product Modal (Updated to include images) */}
      <Modal
        isOpen={showAddModal}
        onClose={() => { setShowAddModal(false); resetForm(); }}
        title="Thêm sản phẩm mới"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tên sản phẩm *</label>
            <input
              type="text"
              value={productForm.tenSanPham}
              onChange={(e) => setProductForm(prev => ({ ...prev, tenSanPham: e.target.value }))}
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mô tả</label>
            <textarea
              value={productForm.moTa}
              onChange={(e) => setProductForm(prev => ({ ...prev, moTa: e.target.value }))}
              className="w-full p-2 border rounded-lg"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Danh mục</label>
              <select
                value={productForm.maDanhMuc}
                onChange={(e) => setProductForm(prev => ({ ...prev, maDanhMuc: e.target.value }))}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Chọn danh mục</option>
                {categories.map(cat => (
                  <option key={cat.maDanhMuc || cat.id} value={cat.maDanhMuc || cat.id}>
                    {cat.tenDanhMuc || cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nhà cung cấp *</label>
              <select
                value={productForm.maNhaCungCap}
                onChange={(e) => setProductForm(prev => ({ ...prev, maNhaCungCap: e.target.value }))}
                className="w-full p-2 border rounded-lg"
                required
              >
                <option value="">Chọn nhà cung cấp</option>
                {suppliers.map(sup => (
                  <option key={sup.maNhaCungCap || sup.id} value={sup.maNhaCungCap || sup.id}>
                    {sup.tenNhaCungCap || sup.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Bộ sưu tập</label>
              <select
                value={productForm.maBoSuuTap}
                onChange={(e) => setProductForm(prev => ({ ...prev, maBoSuuTap: e.target.value }))}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Chọn bộ sưu tập</option>
                {collections.map(col => (
                  <option key={col.maBoSuuTap || col.id} value={col.maBoSuuTap || col.id}>
                    {col.tenBoSuuTap || col.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Điểm thưởng (Diem thuong)</label>
              <input
                type="number"
                min={0}
                step={1}
                value={productForm.diemThuong ?? 0}
                onChange={(e) => setProductForm(prev => ({ ...prev, diemThuong: Number(e.target.value) || 0 }))}
                className="w-full p-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Hình ảnh</label>
            <FileUpload
              multiple={true}
              accept="image/*"
              onUpload={handleImageUpload}
              files={productImages}
              onRemove={handleImageRemove}
              onToggleMain={handleToggleImageMain}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              onClick={() => { setShowAddModal(false); resetForm(); }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleAddProduct}
              disabled={!productForm.tenSanPham || !productForm.maNhaCungCap}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Thêm sản phẩm
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Product Modal (Updated to include images) */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setSelectedProduct(null); resetForm(); }}
        title="Chỉnh sửa sản phẩm"
        size="lg"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tên sản phẩm *</label>
            <input
              type="text"
              value={productForm.tenSanPham}
              onChange={(e) => setProductForm(prev => ({ ...prev, tenSanPham: e.target.value }))}
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mô tả</label>
            <textarea
              value={productForm.moTa}
              onChange={(e) => setProductForm(prev => ({ ...prev, moTa: e.target.value }))}
              className="w-full p-2 border rounded-lg"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Danh mục</label>
              <select
                value={productForm.maDanhMuc}
                onChange={(e) => setProductForm(prev => ({ ...prev, maDanhMuc: e.target.value }))}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Chọn danh mục</option>
                {categories.map(cat => (
                  <option key={cat.maDanhMuc || cat.id} value={cat.maDanhMuc || cat.id}>
                    {cat.tenDanhMuc || cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Nhà cung cấp *</label>
              <select
                value={productForm.maNhaCungCap}
                onChange={(e) => setProductForm(prev => ({ ...prev, maNhaCungCap: e.target.value }))}
                className="w-full p-2 border rounded-lg"
                required
              >
                <option value="">Chọn nhà cung cấp</option>
                {suppliers.map(sup => (
                  <option key={sup.maNhaCungCap || sup.id} value={sup.maNhaCungCap || sup.id}>
                    {sup.tenNhaCungCap || sup.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Bộ sưu tập</label>
              <select
                value={productForm.maBoSuuTap}
                onChange={(e) => setProductForm(prev => ({ ...prev, maBoSuuTap: e.target.value }))}
                className="w-full p-2 border rounded-lg"
              >
                <option value="">Chọn bộ sưu tập</option>
                {collections.map(col => (
                  <option key={col.maBoSuuTap || col.id} value={col.maBoSuuTap || col.id}>
                    {col.tenBoSuuTap || col.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Điểm thưởng (Diem thuong)</label>
              <input
                type="number"
                min={0}
                step={1}
                value={productForm.diemThuong ?? 0}
                onChange={(e) => setProductForm(prev => ({ ...prev, diemThuong: Number(e.target.value) || 0 }))}
                className="w-full p-2 border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Hình ảnh</label>
            <FileUpload
              multiple={true}
              accept="image/*"
              onUpload={handleImageUpload}
              files={productImages}
              onRemove={handleImageRemove}
              onToggleMain={handleToggleImageMain}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              onClick={() => { setShowEditModal(false); setSelectedProduct(null); resetForm(); }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleEditProduct}
              disabled={!productForm.tenSanPham || !productForm.maNhaCungCap}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      </Modal>

      {/* Detail Product Modal (Updated to merge images into info tab) */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedProduct(null); resetForm(); }}
        title={`Chi tiết sản phẩm: ${selectedProduct?.tenSanPham}`}
        size="xl"
      >
        <div className="space-y-6">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {activeTab === 'info' && (
            <div className="space-y-6"> {/* Use a space-y-6 to separate info blocks */}
              {/* Product Info Block */}
              <div className="p-4 border rounded-lg bg-gray-50">
                <h3 className="text-lg font-medium mb-4">Thông tin chung</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tên sản phẩm</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedProduct?.tenSanPham}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Danh mục</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedProduct?.tenDanhMuc || 'Chưa phân loại'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nhà cung cấp</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedProduct?.tenNhaCungCap}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Bộ sưu tập</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedProduct?.tenBoSuuTap || 'Chưa phân loại'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Số lượng biến thể</label>
                    <p className="mt-1 text-sm text-gray-900">{computeVariantCount(selectedProduct)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                    <p className="mt-1 text-sm text-gray-900">
                      <span className={`px-2 py-1 rounded-full text-xs ${selectedProduct?.trangThai ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {selectedProduct?.trangThai ? 'Hoạt động' : 'Ngừng'}
                      </span>
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Điểm thưởng</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedProduct?.diemThuong != null ? String(selectedProduct.diemThuong).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '0'}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">Mô tả</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedProduct?.moTa || 'Không có mô tả'}</p>
                </div>
              </div>

              {/* Images Block (Moved from separate tab) */}
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Hình ảnh sản phẩm</h3>
                  <button
                    onClick={() => {
                      // Open image management modal (only for managing images)
                      if (selectedProduct) {
                        setProductImages(selectedProduct.hinhAnhs || []);
                        setShowImageManagementModal(true);
                      }
                    }}
                    className="px-3 py-1 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700"
                  >
                    Quản lý hình ảnh
                  </button>
                </div>
                {selectedProduct?.hinhAnhs && selectedProduct.hinhAnhs.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {selectedProduct.hinhAnhs.map((image, index) => (
                      <div key={image.maHinhAnh || index} className="relative aspect-square">
                        <img
                          src={api.buildUrl(image.duongDanHinhAnh)}
                          alt={image.moTa || `Ảnh ${index + 1}`}
                          className="w-full h-full object-cover rounded-lg"
                        />
                        {image.laAnhChinh && (
                          <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                            Ảnh chính
                          </span>
                        )}
                        <span className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          Thứ tự: {image.thuTu}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Chưa có hình ảnh nào</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'variants' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Biến thể sản phẩm</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAddVariant}
                    className="bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 text-sm"
                  >
                    Thêm biến thể
                  </button>
                </div>
              </div>
              
              {/* Search bar for variants */}
              {productVariants.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={variantSearchTerm}
                      onChange={(e) => setVariantSearchTerm(e.target.value)}
                      placeholder="Tìm kiếm theo SKU, giá bán, tồn kho..."
                      className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {variantSearchTerm && (
                      <button
                        onClick={() => setVariantSearchTerm('')}
                        className="px-3 py-2 text-gray-600 hover:text-gray-800"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {variantSearchTerm && (
                    <p className="text-sm text-gray-600">
                      Hiển thị {productVariants.filter(variant => {
                        const searchLower = variantSearchTerm.toLowerCase();
                        return (
                          (variant.sku && variant.sku.toLowerCase().includes(searchLower)) ||
                          (variant.giaBan && String(variant.giaBan).includes(searchLower)) ||
                          (variant.soLuongTon !== undefined && String(variant.soLuongTon).includes(searchLower)) ||
                          (variant.tenBienThe && variant.tenBienThe.toLowerCase().includes(searchLower))
                        );
                      }).length} / {productVariants.length} biến thể
                    </p>
                  )}
                </div>
              )}
              
              {productVariants.length > 0 ? (
                <div className="space-y-2">
                  {productVariants
                    .filter(variant => {
                      if (!variantSearchTerm) return true;
                      const searchLower = variantSearchTerm.toLowerCase();
                      return (
                        (variant.sku && variant.sku.toLowerCase().includes(searchLower)) ||
                        (variant.giaBan && String(variant.giaBan).includes(searchLower)) ||
                        (variant.soLuongTon !== undefined && String(variant.soLuongTon).includes(searchLower)) ||
                        (variant.tenBienThe && variant.tenBienThe.toLowerCase().includes(searchLower))
                      );
                    })
                    .sort((a, b) => {
                      // Sort: DISCONTINUED variants go to bottom
                      const statusOrder = { 'ACTIVE': 1, 'LOW_STOCK': 2, 'OUT_OF_STOCK': 3, 'INACTIVE': 4, 'DISCONTINUED': 5 };
                      const orderA = statusOrder[a.trangThaiKho] || 99;
                      const orderB = statusOrder[b.trangThaiKho] || 99;
                      return orderA - orderB;
                    })
                    .map(variant => {
                      const isDiscontinued = variant.trangThaiKho === 'DISCONTINUED';
                      return (
                        <div 
                          key={variant.id} 
                          className={`border rounded-lg p-4 ${isDiscontinued ? 'opacity-50 bg-gray-100' : ''}`}
                        >
                          <div className="flex justify-between items-start">
                            <div className={isDiscontinued ? 'line-through' : ''}>
                              <h4 className="font-medium">
                                {variant.sku || `Biến thể ${variant.id}`}
                                {isDiscontinued && <span className="ml-2 text-xs text-gray-500">⚫ Ngừng kinh doanh</span>}
                              </h4>
                              {!!variant.tenBienThe && (
                                <p className="text-sm text-gray-600">Tên cũ: {variant.tenBienThe}</p>
                              )}
                              <p className="text-sm text-gray-600">Giá bán: {variant.giaBan ? variant.giaBan.toLocaleString('vi-VN') + ' VNĐ' : 'Chưa thiết lập'}</p>
                              <p className="text-sm text-gray-600">Tồn kho: {variant.soLuongTon || 0}</p>
                            </div>
                        <div className="flex space-x-2">
                          {!isDiscontinued && (
                            <button
                              onClick={() => handleEditVariant(variant)}
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              Sửa
                            </button>
                          )}
                          {isDiscontinued ? (
                            <button
                              onClick={() => handleReactivateVariant(variant)}
                              className="text-green-600 hover:text-green-800 text-sm font-medium"
                            >
                              ✓ Kích hoạt lại
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeactivateVariant(variant)}
                              className="text-orange-600 hover:text-orange-800 text-sm"
                            >
                              Vô hiệu hóa
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Attributes display */}
                      <div className="mt-3">
                        <h5 className="text-sm font-medium mb-2">Thuộc tính</h5>
                        <div className="grid grid-cols-2 gap-2">
                          {(() => {
                            const mappings = variant.bienTheThuocTinhs || variant.thuocTinhGiaTriTuDo || variant.thuocTinhGiaTriTuDos || variant.thuocTinh || variant.thuocTinhMappings || [];
                            if (!Array.isArray(mappings) || mappings.length === 0) {
                              return <p className="text-gray-500 col-span-2">Chưa có thuộc tính nào</p>;
                            }
                            return mappings.map((m, idx) => {
                              const ma = m.maThuocTinh ?? (m.thuocTinh && (m.thuocTinh.maThuocTinh ?? m.thuocTinh.id)) ?? m.attributeId ?? m.ma ?? null;
                              const value = m.giaTri ?? (m.giaTri && typeof m.giaTri === 'object' ? (m.giaTri.giaTri ?? m.giaTri.value) : null) ?? m.tenGiaTri ?? m.value ?? m.name ?? '';
                              const attrObj = Array.isArray(attributes)
                                ? attributes.find(a => String(a.id ?? a.maThuocTinh) === String(ma))
                                : null;
                              const attrName = attrObj ? (attrObj.tenThuocTinh || attrObj.name) : ((m.thuocTinh && (m.thuocTinh.tenThuocTinh || m.thuocTinh.name)) || m.tenThuocTinh || `Thuộc tính ${ma}`);
                              return (
                                <div key={`${variant.id}-attr-${idx}`} className="p-2 border rounded-md bg-gray-100">
                                  <div className="text-xs text-gray-600">{attrName}</div>
                                  <div className="text-sm font-medium">{String(value)}</div>
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <p className="text-gray-500">Chưa có biến thể nào</p>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal (Product) - No changes */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setProductToDelete(null); }}
        title="Xác nhận vô hiệu hóa sản phẩm"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Bạn có chắc muốn vô hiệu hóa sản phẩm "<strong>{productToDelete?.tenSanPham}</strong>"?
          </p>
          <p className="text-sm text-gray-500">
            Sản phẩm sẽ được đánh dấu là "Ngừng kinh doanh" và không thể sử dụng.
          </p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => { setShowDeleteConfirm(false); setProductToDelete(null); }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={confirmDeactivateProduct}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Vô hiệu hóa
            </button>
          </div>
        </div>
      </Modal>

      {/* Image Management Modal - For managing product images only */}
      <Modal
        isOpen={showImageManagementModal}
        onClose={() => { setShowImageManagementModal(false); setProductImages([]); }}
        title={`Quản lý hình ảnh - ${selectedProduct?.tenSanPham}`}
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Bạn có thể thêm hình ảnh mới, xóa hình ảnh, sắp xếp thứ tự và đặt ảnh chính.
          </p>
          <div className="border rounded-lg p-4 bg-gray-50">
            <label className="block text-sm font-medium mb-2">Hình ảnh sản phẩm</label>
            <FileUpload
              multiple={true}
              accept="image/*"
              onUpload={handleImageUpload}
              files={productImages}
              onRemove={handleImageRemove}
              onToggleMain={handleToggleImageMain}
            />
          </div>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              onClick={() => { setShowImageManagementModal(false); setProductImages([]); }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={async () => {
                // Save images to the product
                if (selectedProduct) {
                  try {
                    const productId = selectedProduct.id || selectedProduct.maSanPham;
                    if (!productId) {
                      setError('Không tìm thấy ID sản phẩm');
                      return;
                    }

                    // If there are any local File objects, upload them first to get server URLs
                    const fileIndexes = [];
                    const fileObjects = [];
                    productImages.forEach((img, idx) => {
                      if (isFileLike(img)) {
                        fileIndexes.push(idx);
                        fileObjects.push(img.file || img);
                      }
                    });

                    let uploadedResponses = [];
                    if (fileObjects.length > 0) {
                      const formData = new FormData();
                      fileObjects.forEach(f => formData.append('images', f));
                      // backend returns list of uploaded image DTOs
                      try {
                        const resp = await api.post(`/api/products/${productId}/images/upload`, { body: formData });
                        // resp may be an array of created image DTOs
                        uploadedResponses = Array.isArray(resp) ? resp : [];
                      } catch (uploadErr) {
                        setError('Không thể upload ảnh: ' + (uploadErr?.data || uploadErr.message || uploadErr));
                        return;
                      }
                    }

                    // Build final ordered imageData by iterating productImages
                    // For File entries we consume uploadedResponses in FIFO order
                    let uploadCursor = 0;
                    const imageData = productImages.map((img, index) => {
                      if (isFileLike(img)) {
                        const uploaded = uploadedResponses[uploadCursor++] || null;
                        return uploaded ? {
                          maHinhAnh: uploaded.maHinhAnh || uploaded.id || null,
                          duongDanHinhAnh: uploaded.duongDanHinhAnh || uploaded.url || uploaded.path || null,
                          thuTu: index + 1,
                          laAnhChinh: img.laAnhChinh || img._isMain || (index === 0),
                          moTa: img.moTa || ''
                        } : null;
                      }

                      // existing image object
                      return {
                        maHinhAnh: img.maHinhAnh || img.id || null,
                        duongDanHinhAnh: img.duongDanHinhAnh || img.url || img.path || null,
                        thuTu: index + 1,
                        laAnhChinh: img.laAnhChinh || img._isMain || (index === 0),
                        moTa: img.moTa || ''
                      };
                    }).filter(Boolean); // remove nulls for any failed uploads

                    // Enforce exactly one main image flag
                    if (imageData.length > 0) {
                      let firstMain = imageData.findIndex(i => i.laAnhChinh === true);
                      if (firstMain < 0) firstMain = 0;
                      imageData.forEach((it, idx) => { it.laAnhChinh = idx === firstMain; });
                    }

                    // Call the backend images bulk-update endpoint
                    await api.put(`/api/san-pham/${productId}/images`, imageData);

                    alert('Lưu hình ảnh thành công!');

                    // Refresh products list and selected product
                    await fetchProducts();
                    const refreshed = await api.get(`/api/san-pham/${productId}`);
                    const mapped = mapProductFromApi(refreshed);
                    // Fetch latest images explicitly (product detail may not include hinhAnhs)
                    let latestImages = [];
                    try {
                      const imgs = await api.get(`/api/products/${productId}/images`);
                      latestImages = Array.isArray(imgs) ? imgs : [];
                    } catch (_) { }
                    setSelectedProduct({ ...mapped, hinhAnhs: latestImages });
                    // Also update local productImages to reflect server state
                    const normalizedAfter = (latestImages || []).map((h, idx) => ({
                      maHinhAnh: h.maHinhAnh || h.id,
                      duongDanHinhAnh: h.duongDanHinhAnh || h.url || h.path,
                      thuTu: h.thuTu != null ? h.thuTu : idx,
                      laAnhChinh: !!h.laAnhChinh,
                      moTa: h.moTa || ''
                    }));
                    setProductImages(normalizedAfter);

                    // Close image management modal and show detail modal
                    setShowImageManagementModal(false);
                    setShowDetailModal(true);

                  } catch (err) {
                    setError('Không thể lưu hình ảnh: ' + (err.response?.data?.message || err.message));
                  }
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Lưu hình ảnh
            </button>
          </div>
        </div>
      </Modal>

      {/* --- NEW VARIANT CREATION MODAL (Selection & Bulk) --- */}
      <Modal
        isOpen={showAddVariantModal}
        onClose={() => {
          setShowAddVariantModal(false);
          resetVariantForm();
          setBulkVariantsPreview([]);
          setVariantSelections({});
          setExplicitRows([]); // Clear explicit rows on close
        }}
        title={`Thêm biến thể mới cho: ${selectedProduct?.tenSanPham}`}
        size="xl"
      >
        <div className="space-y-4">
          {/* Common Variant Fields for Single Creation */}
          <div className="p-4 border rounded-lg bg-blue-50">
            <h4 className="font-semibold text-blue-700 mb-2">Thông tin cơ bản</h4>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label className="block text-sm font-medium mb-1">SKU</label>
                <input
                  type="text"
                  value={variantForm.sku}
                  readOnly
                  className="w-full p-2 border rounded-lg bg-gray-100 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Trạng thái kho</label>
                <select
                  value={variantForm.trangThaiKho}
                  onChange={(e) => setVariantForm(prev => ({ ...prev, trangThaiKho: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="INACTIVE">🔵 Chưa hoạt động</option>
                  <option value="ACTIVE">🟢 Hoạt động</option>
                  <option value="LOW_STOCK">🟡 Hàng sắp hết</option>
                  <option value="OUT_OF_STOCK">🔴 Hết hàng</option>
                  <option value="DISCONTINUED">⚫ Ngừng kinh doanh</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Giá mua (VNĐ)</label>
                <input
                  type="number"
                  value={variantForm.giaMua}
                  onChange={(e) => setVariantForm(prev => ({ ...prev, giaMua: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                  min="0" step="1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Giá bán (VNĐ)</label>
                <input
                  type="number"
                  value={variantForm.giaBan}
                  onChange={(e) => setVariantForm(prev => ({ ...prev, giaBan: e.target.value }))}
                  className="w-full p-2 border rounded-lg"
                  min="0" step="1000"
                />
              </div>
            </div>
          </div>

          {/* Attributes Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Chế độ thêm thuộc tính</h4>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="variantMode"
                    checked={variantMode === 'selection'}
                    onChange={() => {
                      setVariantMode('selection');
                      setVariantSelections({});
                      setAttributeSearchTerm('');
                    }}
                    className="w-4 h-4"
                  />
                  <span>Chọn từ danh sách</span>
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="variantMode"
                    checked={variantMode === 'manual'}
                    onChange={() => {
                      setVariantMode('manual');
                      setExplicitRows([{ maThuocTinh: '', giaTri: '' }]);
                      setVariantSelections({});
                    }}
                    className="w-4 h-4"
                  />
                  <span>Nhập thủ công</span>
                </label>
              </div>
            </div>

            {attrLoading ? (
              <div className="py-4 text-center text-gray-600">Đang tải thuộc tính...</div>
            ) : attrError ? (
              <div className="p-4 bg-red-50 border rounded">
                <p className="text-sm text-red-700 mb-2">Lỗi khi tải thuộc tính: {attrError}</p>
                <div className="flex justify-end">
                  <button onClick={() => fetchAttributes(true)} className="px-3 py-1 bg-blue-600 text-white rounded">Tải lại</button>
                </div>
              </div>
            ) : (!attributes || attributes.length === 0) ? (
              <div className="p-4 text-gray-600">Chưa có thuộc tính nào. Bạn có thể tạo thuộc tính trên backend hoặc thử tải lại.</div>
            ) : (
              <div className="space-y-3">
                {/* Selection Mode: Display all attributes with search */}
                {variantMode === 'selection' && (
                  <div className="space-y-3">
                    {/* Search Bar */}
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Tìm kiếm thuộc tính..."
                        value={attributeSearchTerm}
                        onChange={(e) => setAttributeSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>

                    {/* Attributes List */}
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {(() => {
                        const filteredAttrs = (Array.isArray(attributes) ? attributes : Object.values(attributes).flat())
                          .filter(attr => {
                            if (!attributeSearchTerm.trim()) return true;
                            const searchLower = attributeSearchTerm.toLowerCase();
                            const attrName = (attr.tenThuocTinh || '').toLowerCase();
                            const attrValues = (attr.values || []).map(v => (v.tenGiaTri || '').toLowerCase()).join(' ');
                            return attrName.includes(searchLower) || attrValues.includes(searchLower);
                          });

                        const filledAttrs = filteredAttrs.filter(attr => {
                          const aKey = String(attr.id ?? attr.maThuocTinh);
                          const isFilled = variantSelections[aKey] && variantSelections[aKey][0] && String(variantSelections[aKey][0]).trim() !== '';
                          // Do not move the attribute currently being edited
                          if (activeEditingAttrKey && aKey === String(activeEditingAttrKey)) return false;
                          return !!isFilled;
                        });

                        const unfilledAttrs = filteredAttrs.filter(attr => {
                          const aKey = String(attr.id ?? attr.maThuocTinh);
                          const isFilled = variantSelections[aKey] && variantSelections[aKey][0] && String(variantSelections[aKey][0]).trim() !== '';
                          // Keep the actively edited attribute in the unfilled section while typing
                          if (activeEditingAttrKey && aKey === String(activeEditingAttrKey)) return true;
                          return !isFilled;
                        });

                        return (
                          <>
                            {/* Filled Attributes Section */}
                            {filledAttrs.length > 0 && (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 px-2 py-1 bg-green-100 rounded-lg">
                                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-sm font-semibold text-green-700">Đã điền ({filledAttrs.length})</span>
                                </div>
                                {filledAttrs.map((attr, ai) => {
                                  const aKey = String(attr.id ?? attr.maThuocTinh ?? ai);
                                  const selectedVal = (variantSelections[aKey] && variantSelections[aKey][0]) || '';
                                  
                                  return (
                                    <div key={`attr-panel-${aKey}`} className="border-2 border-green-300 p-4 rounded-lg bg-green-50">
                                      <div className="font-semibold text-gray-700 mb-2">{attr.tenThuocTinh}</div>
                                      <div className="flex flex-col space-y-2">
                                        {(attr.values || []).length > 0 ? (
                                          <div className="flex flex-wrap gap-2">
                                            {(attr.values || []).map((v, vi) => (
                                              <label 
                                                key={`radio-${aKey}-${vi}`} 
                                                className="inline-flex items-center gap-2 px-3 py-1 border rounded-lg cursor-pointer transition-colors hover:bg-white"
                                                style={{
                                                  backgroundColor: String(selectedVal) === String(v.tenGiaTri) ? '#D1E7FF' : 'white',
                                                  borderColor: String(selectedVal) === String(v.tenGiaTri) ? '#3B82F6' : '#D1D5DB'
                                                }}
                                              >
                                                <input
                                                  type="radio"
                                                  name={`attr-${aKey}`}
                                                  value={v.tenGiaTri}
                                                  checked={String(selectedVal) === String(v.tenGiaTri)}
                                                  onChange={() => setVariantSelections(prev => ({ ...prev, [aKey]: [String(v.tenGiaTri)] }))}
                                                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm">{v.tenGiaTri}</span>
                                              </label>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="text-sm text-gray-500">Không có giá trị sẵn</div>
                                        )}

                                        <div className="mt-1 pt-2 border-t border-gray-200">
                                          <label className="text-xs text-gray-600">Hoặc nhập giá trị tùy chỉnh</label>
                                          <input
                                            type="text"
                                            placeholder={`Nhập giá trị khác cho ${attr.tenThuocTinh}`}
                                            value={(attr.values || []).some(v => String(v.tenGiaTri) === String(selectedVal)) ? '' : selectedVal}
                                            onChange={(e) => setVariantSelections(prev => ({ ...prev, [aKey]: [e.target.value] }))}
                                            onFocus={() => setActiveEditingAttrKey(aKey)}
                                            onBlur={() => setActiveEditingAttrKey(null)}
                                            className="w-full p-2 border rounded mt-1"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Divider */}
                            {filledAttrs.length > 0 && unfilledAttrs.length > 0 && (
                              <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center">
                                  <div className="w-full border-t-2 border-gray-300"></div>
                                </div>
                              </div>
                            )}

                            {/* Unfilled Attributes Section */}
                            {unfilledAttrs.length > 0 && (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 px-2 py-1 bg-gray-100 rounded-lg">
                                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  <span className="text-sm font-semibold text-gray-600">Chưa điền ({unfilledAttrs.length})</span>
                                </div>
                                {unfilledAttrs.map((attr, ai) => {
                                  const aKey = String(attr.id ?? attr.maThuocTinh ?? ai);
                                  const selectedVal = (variantSelections[aKey] && variantSelections[aKey][0]) || '';
                                  
                                  return (
                                    <div key={`attr-panel-${aKey}`} className="border-2 p-4 rounded-lg bg-gray-50">
                                      <div className="font-semibold text-gray-700 mb-2">{attr.tenThuocTinh}</div>
                                      <div className="flex flex-col space-y-2">
                                        {(attr.values || []).length > 0 ? (
                                          <div className="flex flex-wrap gap-2">
                                            {(attr.values || []).map((v, vi) => (
                                              <label 
                                                key={`radio-${aKey}-${vi}`} 
                                                className="inline-flex items-center gap-2 px-3 py-1 border rounded-lg cursor-pointer transition-colors hover:bg-white"
                                                style={{
                                                  backgroundColor: String(selectedVal) === String(v.tenGiaTri) ? '#D1E7FF' : 'white',
                                                  borderColor: String(selectedVal) === String(v.tenGiaTri) ? '#3B82F6' : '#D1D5DB'
                                                }}
                                              >
                                                <input
                                                  type="radio"
                                                  name={`attr-${aKey}`}
                                                  value={v.tenGiaTri}
                                                  checked={String(selectedVal) === String(v.tenGiaTri)}
                                                  onChange={() => setVariantSelections(prev => ({ ...prev, [aKey]: [String(v.tenGiaTri)] }))}
                                                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm">{v.tenGiaTri}</span>
                                              </label>
                                            ))}
                                          </div>
                                        ) : (
                                          <div className="text-sm text-gray-500">Không có giá trị sẵn</div>
                                        )}

                                        <div className="mt-1 pt-2 border-t border-gray-200">
                                          <label className="text-xs text-gray-600">Hoặc nhập giá trị tùy chỉnh</label>
                                          <input
                                            type="text"
                                            placeholder={`Nhập giá trị khác cho ${attr.tenThuocTinh}`}
                                            value={(attr.values || []).some(v => String(v.tenGiaTri) === String(selectedVal)) ? '' : selectedVal}
                                            onChange={(e) => setVariantSelections(prev => ({ ...prev, [aKey]: [e.target.value] }))}
                                            onFocus={() => setActiveEditingAttrKey(aKey)}
                                            onBlur={() => setActiveEditingAttrKey(null)}
                                            className="w-full p-2 border rounded mt-1"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Manual Mode: Row-based input */}
                {variantMode === 'manual' && (
                  <div className="p-4 border-2 rounded-lg bg-white space-y-3">
                    <h5 className="font-semibold text-gray-700">Danh sách thuộc tính/giá trị</h5>
                    {explicitRows.map((r, idx) => (
                      <div key={`row-${idx}`} className="flex items-center gap-2">
                        <select
                          value={r.maThuocTinh}
                          onChange={(e) => {
                            const ma = e.target.value;
                            setExplicitRows(prev => prev.map((row, i) => i === idx ? { ...row, maThuocTinh: ma } : row));
                          }}
                          className="p-2 border rounded min-w-[150px]"
                        >
                          <option value="">-- Thuộc tính --</option>
                          {(Array.isArray(attributes) ? attributes : Object.values(attributes).flat()).map(a => (
                            <option key={a.id || a.maThuocTinh} value={a.id || a.maThuocTinh}>{a.tenThuocTinh}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={r.giaTri || ''}
                          onChange={(e) => {
                            const v = e.target.value;
                            setExplicitRows(prev => prev.map((row, i) => i === idx ? { ...row, giaTri: v } : row));
                          }}
                          placeholder="Giá trị (VD: Đỏ, 120cm)"
                          className="flex-1 p-2 border rounded"
                        />
                        <button
                          type="button"
                          onClick={() => setExplicitRows(prev => prev.filter((_, i) => i !== idx))}
                          className="p-2 bg-red-50 text-red-600 border rounded hover:bg-red-100"
                          disabled={explicitRows.length === 1}
                        >
                          X
                        </button>
                      </div>
                    ))}
                    <div className="flex justify-start">
                      <button
                        type="button"
                        onClick={() => setExplicitRows(prev => [...prev, { maThuocTinh: '', giaTri: '' }])}
                        className="mt-1 px-3 py-1 bg-green-50 text-green-700 border rounded hover:bg-green-100"
                      >
                        + Thêm hàng
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex justify-start space-x-2 border-t pt-3 mt-3">
                  <button
                    onClick={handleCreateSingleFromSelection}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    disabled={
                      variantMode === 'manual' 
                        ? (explicitRows.length === 0 || explicitRows.some(r => !r.maThuocTinh || String(r.giaTri).trim() === ''))
                        : Object.values(variantSelections).every(arr => arr.length === 0 || arr.every(v => String(v).trim() === ''))
                    }
                  >
                    Tạo biến thể
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* --- EDIT VARIANT MODAL (Details Only) --- */}
      <Modal
        isOpen={showEditVariantModal}
        onClose={() => { setShowEditVariantModal(false); setSelectedVariant(null); resetVariantForm(); setExplicitRows([]); }}
        title={`Chỉnh sửa biến thể: ${selectedVariant?.sku || 'Không tên'}`}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">SKU *</label>
            <input
              type="text"
              value={variantForm.sku}
              readOnly
              className="w-full p-2 border rounded-lg bg-gray-100 cursor-not-allowed"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Giá mua (VNĐ)</label>
              <input
                type="number"
                value={variantForm.giaMua}
                onChange={(e) => setVariantForm(prev => ({ ...prev, giaMua: e.target.value }))}
                className="w-full p-2 border rounded-lg"
                min="0"
                step="1000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Giá bán (VNĐ)</label>
              <input
                type="number"
                value={variantForm.giaBan}
                onChange={(e) => setVariantForm(prev => ({ ...prev, giaBan: e.target.value }))}
                className="w-full p-2 border rounded-lg"
                min="0"
                step="1000"
              />
            </div>
          </div>

          {/* Editable attributes section */}
          {attrLoading ? (
            <div className="py-4 text-center text-gray-600">Đang tải thuộc tính...</div>
          ) : attrError ? (
            <div className="p-4 bg-red-50 border rounded">
              <p className="text-sm text-red-700 mb-2">Lỗi khi tải thuộc tính: {attrError}</p>
              <div className="flex justify-end">
                <button onClick={() => fetchAttributes(false)} className="px-3 py-1 bg-blue-600 text-white rounded">Tải lại</button>
              </div>
            </div>
          ) : (
            // Editable attribute editor for existing and new mappings
            <div className="space-y-3 border-2 border-gray-200 p-4 rounded-lg bg-gray-50">
              <h4 className="font-semibold text-gray-700">Thuộc tính (sửa hoặc thêm giá trị)</h4>
              <div className="space-y-3">
                {/* Existing explicitRows for editing */}
                {Array.isArray(explicitRows) && explicitRows.length > 0 && explicitRows.map((r, idx) => {
                  const meta = Array.isArray(attributes)
                    ? attributes.find(a => String(a.id ?? a.maThuocTinh) === String(r.maThuocTinh))
                    : (attributes && typeof attributes === 'object'
                      ? Object.values(attributes).flat().find(a => String(a.id ?? a.maThuocTinh) === String(r.maThuocTinh))
                      : null);
                  const label = meta?.tenThuocTinh || `Thuộc tính ${r.maThuocTinh || ''}`;
                  return (
                    <div key={`edit-er-${idx}`} className="flex items-center gap-2">
                      <div className="min-w-[150px] text-sm text-gray-700 font-medium">{label}</div>
                      <input type="text" value={r.giaTri || ''} onChange={(e) => {
                        const v = e.target.value;
                        setExplicitRows(prev => prev.map((row, i) => i === idx ? { ...row, giaTri: v } : row));
                      }} placeholder="Giá trị (VD: Đỏ)" className="flex-1 p-2 border rounded" />
                    </div>
                  );
                })}

                {/* Add new attribute-value pairs */}
                <div className="flex items-center gap-2 mt-2">
                  <select
                    value={newAttr}
                    onChange={e => setNewAttr(e.target.value)}
                    className="p-2 border rounded min-w-[150px]"
                  >
                    <option value="">-- Chọn thuộc tính để thêm --</option>
                    {(Array.isArray(attributes)
                      ? attributes
                      : Object.values(attributes).flat()
                    ).filter(a => !explicitRows.some(r => String(r.maThuocTinh) === String(a.id ?? a.maThuocTinh))).map(a => (
                      <option key={a.id || a.maThuocTinh} value={a.id || a.maThuocTinh}>{a.tenThuocTinh}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newValue}
                    onChange={e => setNewValue(e.target.value)}
                    placeholder="Giá trị mới"
                    className="flex-1 p-2 border rounded"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newAttr && newValue) {
                        setExplicitRows(prev => [...prev, { maThuocTinh: newAttr, giaTri: newValue }]);
                        setNewAttr('');
                        setNewValue('');
                      }
                    }}
                    className="p-2 bg-green-50 text-green-700 border rounded hover:bg-green-100"
                  >
                    + Thêm thuộc tính
                  </button>
                </div>
              </div>
            </div>
          )}


          <div className="flex justify-end space-x-2 pt-4 border-t">
            <button
              onClick={() => { setShowEditVariantModal(false); setSelectedVariant(null); resetVariantForm(); setExplicitRows([]); }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleUpdateVariant}
              disabled={!variantForm.sku}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Variant Confirmation Modal - No changes */}
      <Modal
        isOpen={showDeleteVariantConfirm}
        onClose={() => { setShowDeleteVariantConfirm(false); setVariantToDelete(null); }}
        title="Xác nhận vô hiệu hóa biến thể"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Bạn có chắc muốn vô hiệu hóa biến thể "<strong>{variantToDelete?.tenBienThe || variantToDelete?.sku}</strong>"?
          </p>
          <p className="text-sm text-gray-500">
            Biến thể sẽ được đánh dấu là "Ngừng kinh doanh" và không thể sử dụng.
          </p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => { setShowDeleteVariantConfirm(false); setVariantToDelete(null); }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={confirmDeactivateVariant}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Vô hiệu hóa
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductManagement;