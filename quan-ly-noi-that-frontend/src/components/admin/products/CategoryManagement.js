import React, { useState, useEffect, useCallback } from 'react';
import { IoAdd, IoSearch, IoCreate, IoTrash, IoSave, IoClose } from 'react-icons/io5';
import Modal from '../../shared/Modal';
import ConfirmDialog from '../../shared/ConfirmDialog';
import Toast from '../../shared/Toast';
import api from '../../../api';

const CategoryManagement = () => {
  // loading / error states are handled locally where needed

  // Map category data from API to local shape: { maDanhMuc, tenDanhMuc, moTa, soLuongSanPham, parentId, children }
  const mapCategoryFromApi = (category) => ({
    // be defensive: category may be null or incomplete when API returns unexpected data
    maDanhMuc: category?.maDanhMuc ?? category?.id ?? null,
    tenDanhMuc: category?.tenDanhMuc ?? category?.name ?? '',
    moTa: category?.moTa ?? category?.description ?? '',
    soLuongSanPham: category?.soLuongSanPham ?? category?.productCount ?? 0,
    // API now returns explicit parentId. Prefer it, fall back to nested parent object if present.
    parentId: (category?.parentId ?? (category?.parent && (category.parent.maDanhMuc || category.parent.id)) ) || null,
    children: []
  });

  // Fetch categories
  // Load categories (flat + tree)
  const loadCategories = useCallback(async () => {
    try {
      const data = await api.get('/api/categories');
      if (Array.isArray(data)) {
  const flatAll = data.map(mapCategoryFromApi);
  // remove invalid entries (no id)
  const flat = flatAll.filter(i => i && (i.maDanhMuc !== null && i.maDanhMuc !== undefined));

  // build tree
  const byId = new Map();
  flat.forEach(item => byId.set(item.maDanhMuc, { ...item, children: [] }));
        const roots = [];
        byId.forEach(item => {
          if (item.parentId) {
            const parent = byId.get(item.parentId);
            if (parent) parent.children.push(item);
            else roots.push(item);
          } else {
            roots.push(item);
          }
        });

  setCategoriesFlat(flat);
  setCategoriesTree(roots);
  setCategories(flat);
      }
    } catch (err) {
      showToast('Không thể tải danh sách danh mục', 'error');
    }
  }, []);

  useEffect(() => { loadCategories(); }, [loadCategories]);

  const [categories, setCategories] = useState([]);
  // hierarchical and flat representations
  const [categoriesTree, setCategoriesTree] = useState([]);
  const [categoriesFlat, setCategoriesFlat] = useState([]);
  const [expandedIds, setExpandedIds] = useState(new Set());

  const [showModal, setShowModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const [formData, setFormData] = useState({
    tenDanhMuc: '',
    moTa: '',
    parentId: null
  });

  // Categories are name + description only

  // Filter categories based on search term
  const filteredCategories = categories.filter(category =>
    category.tenDanhMuc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.tenDanhMuc.trim()) {
      showToast('Vui lòng nhập tên danh mục', 'error');
      return;
    }

    // Prevent duplicates client-side
    const exists = categories.some(category =>
      category.tenDanhMuc.toLowerCase() === formData.tenDanhMuc.toLowerCase() &&
      category.maDanhMuc !== editingCategory?.maDanhMuc
    );
    if (exists) {
      showToast('Tên danh mục đã tồn tại', 'error');
      return;
    }

    try {
      if (editingCategory) {
        if (!editingCategory.maDanhMuc) {
          showToast('Không xác định được danh mục để cập nhật', 'error');
          return;
        }
        // Update via API
        const payload = { tenDanhMuc: formData.tenDanhMuc, moTa: formData.moTa };
        const updated = await api.put(`/api/categories/${editingCategory.maDanhMuc}`, payload);
        const mapped = mapCategoryFromApi(updated || { ...editingCategory, ...payload });
  setCategories(categories.map(c => c.maDanhMuc === mapped.maDanhMuc ? mapped : c));
        // handle parent linking/unlinking
        if (formData.parentId) {
          await api.post(`/api/categories/${mapped.maDanhMuc}/parents/${formData.parentId}`);
        } else {
          // if parent removed, unlink all existing parents
          try {
            const existingParents = await api.get(`/api/categories/${mapped.maDanhMuc}/parents`);
            if (Array.isArray(existingParents)) {
              for (const p of existingParents) {
                await api.del(`/api/categories/${mapped.maDanhMuc}/parents/${p.id ?? p.maDanhMuc}`);
              }
            }
          } catch (err) {
            // ignore unlink errors
          }
        }
        showToast('Cập nhật danh mục thành công');
        await loadCategories();
      } else {
        // Create via API
        const payload = { tenDanhMuc: formData.tenDanhMuc, moTa: formData.moTa };
        const created = await api.post('/api/categories', { body: payload });
        const childId = created?.maDanhMuc ?? created?.id;
        // if a parent was selected, link it AFTER the category has been persisted
        if (formData.parentId && childId) {
          await api.post(`/api/categories/${childId}/parents/${formData.parentId}`);
        }
        // reload to get accurate tree state
        await loadCategories();
        showToast('Thêm danh mục thành công');
      }
      closeModal();
    } catch (err) {
      showToast(err.data?.message || 'Lỗi khi lưu danh mục', 'error');
    }
  };

  const openModal = (category = null) => {
    setEditingCategory(category);
    setFormData({
      tenDanhMuc: category ? category.tenDanhMuc : '',
      moTa: category ? category.moTa : '',
      parentId: null
    });
    setShowModal(true);
    // if editing, fetch current parents and set first parent as selected
    if (category) {
      (async () => {
        try {
          const parents = await api.get(`/api/categories/${category.maDanhMuc}/parents`);
          if (Array.isArray(parents) && parents.length > 0) {
            const first = parents[0];
            setFormData(fd => ({ ...fd, parentId: first.maDanhMuc ?? first.id }));
          }
        } catch (err) {
          // ignore
        }
      })();
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ tenDanhMuc: '', moTa: '', parentId: null });
  };

  const handleDelete = (id) => {
    const category = categories.find(c => c && c.maDanhMuc === id);
    if (category && category.soLuongSanPham > 0) {
      showToast('Không thể xóa danh mục có sản phẩm. Vui lòng di chuyển sản phẩm trước khi xóa.', 'error');
      return;
    }
    setDeleteId(id);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await api.del(`/api/categories/${deleteId}`);
      await loadCategories();
      showToast('Xóa danh mục thành công');
    } catch (err) {
      showToast(err.data?.message || 'Lỗi khi xóa danh mục', 'error');
    } finally {
      setShowConfirmDialog(false);
      setDeleteId(null);
    }
  };

  // Render a simple initial avatar for category
  const renderCategoryAvatar = (name, className = 'w-10 h-10 rounded-full flex items-center justify-center text-white') => {
    const initial = name ? name.charAt(0).toUpperCase() : '?';
    // choose deterministic color based on char code
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-yellow-500', 'bg-red-500', 'bg-cyan-500'];
    const color = colors[(initial.charCodeAt(0) || 0) % colors.length];
    return (
      <div className={`${className} ${color}`}>
        {initial}
      </div>
    );
  };

  const getCategoryColor = (index) => {
    const colors = [
      'bg-blue-500 text-white',
      'bg-green-500 text-white',
      'bg-purple-500 text-white',
      'bg-pink-500 text-white',
      'bg-indigo-500 text-white',
      'bg-yellow-500 text-white',
      'bg-red-500 text-white',
      'bg-cyan-500 text-white'
    ];
    return colors[index % colors.length];
  };

  // Compute total products for a node (own + all descendants). Use recursion for safety.
  const getTotalProducts = (node) => {
    if (!node) return 0;
    const own = Number(node.soLuongSanPham || 0);
    const children = (node.children || []).reduce((sum, ch) => sum + getTotalProducts(ch), 0);
    return own + children;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý Danh mục</h1>
              <p className="text-gray-600 mt-1">Phân loại sản phẩm theo các danh mục để dễ quản lý và tìm kiếm</p>
            </div>

            <button
              onClick={() => openModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <IoAdd className="text-lg" />
              Thêm danh mục
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm danh mục..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Categories: show tree when no search, otherwise show filtered grid */}
        {searchTerm.trim() ? (
          filteredCategories.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <IoSearch className="text-4xl text-gray-400 mb-4 mx-auto" />
              <p className="text-gray-500">Không tìm thấy danh mục nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCategories.filter(Boolean).map((category, index) => (
                <div key={category.maDanhMuc ?? category.id ?? index} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className={`p-6 ${getCategoryColor(index)}`}>
                    <div className="flex items-center gap-3">
                      {renderCategoryAvatar(category.tenDanhMuc)}
                      <div>
                        <h3 className="font-semibold text-lg">{category.tenDanhMuc}</h3>
                        <p className="text-white/80 text-sm">#{category.maDanhMuc ?? category.id}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{category.soLuongSanPham}</div>
                        <div className="text-sm text-gray-500">Sản phẩm</div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${category.soLuongSanPham === 0 ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-600'}`}>
                        {category.soLuongSanPham === 0 ? 'Trống' : 'Có sản phẩm'}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => openModal(category)} className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"><IoCreate className="text-sm" />Chỉnh sửa</button>
                      <button onClick={() => handleDelete(category.maDanhMuc)} className={`px-3 py-2 rounded-lg transition-colors flex items-center justify-center ${category.soLuongSanPham > 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-50 hover:bg-red-100 text-red-600'}`} disabled={category.soLuongSanPham > 0}><IoTrash className="text-sm" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          categoriesTree.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <IoSearch className="text-4xl text-gray-400 mb-4 mx-auto" />
              <p className="text-gray-500">Không tìm thấy danh mục nào</p>
            </div>
          ) : (
            <div className="space-y-6">
              {categoriesTree.filter(Boolean).map((parent, pIndex) => (
                <div key={parent.maDanhMuc ?? parent.id ?? pIndex} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  <div className={`p-6 flex items-center justify-between ${getCategoryColor(pIndex)}`}>
                    <div className="flex items-center gap-3">
                      {renderCategoryAvatar(parent.tenDanhMuc)}
                      <div>
                        <h3 className="font-semibold text-lg">{parent.tenDanhMuc}</h3>
                        <p className="text-white/80 text-sm">#{parent.maDanhMuc ?? parent.id}</p>
                        {parent.moTa && <p className="text-white/80 text-sm mt-1">{parent.moTa}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center mr-4">
                        <div className="text-2xl font-bold text-white">{getTotalProducts(parent)}</div>
                          <div className="text-sm text-white/90">Tổng sản phẩm (gồm con)</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openModal(parent)} className="bg-white/20 text-white px-3 py-2 rounded-lg">Chỉnh sửa</button>
                        <button onClick={() => { setExpandedIds(prev => { const next = new Set(prev); if (next.has(parent.maDanhMuc)) next.delete(parent.maDanhMuc); else next.add(parent.maDanhMuc); return next; }); }} className="bg-white/10 text-white px-3 py-2 rounded-lg">{expandedIds.has(parent.maDanhMuc) ? 'Thu gọn' : 'Mở rộng'}</button>
                        <button onClick={() => handleDelete(parent.maDanhMuc ?? parent.id)} className="bg-red-50 text-red-600 px-3 py-2 rounded-lg">Xóa</button>
                      </div>
                    </div>
                  </div>
                  {expandedIds.has(parent.maDanhMuc) && (
                    <div className="p-6 border-t">
                      {parent.children.length === 0 ? (
                        <p className="text-gray-500">Chưa có danh mục con</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {(parent.children || []).filter(Boolean).map(child => (
                            <div key={child.maDanhMuc ?? child.id} className="p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="font-medium">{child.tenDanhMuc}</h4>
                                  {child.moTa && <p className="text-sm text-gray-600">{child.moTa}</p>}
                                  <p className="text-xs text-gray-400">#{child.maDanhMuc ?? child.id}</p>
                                  <p className="text-sm text-gray-500 mt-2">Sản phẩm: {child.soLuongSanPham ?? 0}</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <button onClick={() => openModal(child)} className="text-sm text-blue-600">Chỉnh sửa</button>
                                  <button onClick={() => handleDelete(child.maDanhMuc ?? child.id)} className="text-sm text-red-600">Xóa</button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* Summary Stats */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê tổng quan</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{categories.length}</div>
              <div className="text-sm text-blue-600">Tổng danh mục</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {categories.reduce((total, category) => total + category.soLuongSanPham, 0)}
              </div>
              <div className="text-sm text-green-600">Tổng sản phẩm</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {categories.filter(c => c.soLuongSanPham > 0).length}
              </div>
              <div className="text-sm text-purple-600">Danh mục có sản phẩm</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {categories.filter(c => c.soLuongSanPham === 0).length}
              </div>
              <div className="text-sm text-yellow-600">Danh mục trống</div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={closeModal} title={editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="tenDanhMuc" className="block text-sm font-medium text-gray-700 mb-1">
              Tên danh mục *
            </label>
            <input
              type="text"
              id="tenDanhMuc"
              value={formData.tenDanhMuc}
              onChange={(e) => setFormData({ ...formData, tenDanhMuc: e.target.value })}
              placeholder="Ví dụ: Ghế, Bàn, Sofa..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="moTa" className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              id="moTa"
              value={formData.moTa}
              onChange={(e) => setFormData({ ...formData, moTa: e.target.value })}
              placeholder="Mô tả ngắn cho danh mục"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>

          <div>
            <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 mb-1">
              Danh mục cha (tùy chọn)
            </label>
            <select
              id="parentId"
              value={formData.parentId ?? ''}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">-- Không chọn --</option>
              {categoriesFlat
                .filter(Boolean)
                .filter(c => c.maDanhMuc !== editingCategory?.maDanhMuc)
                .map(c => (
                  <option key={c.maDanhMuc ?? c.id} value={c.maDanhMuc ?? c.id}>{c.tenDanhMuc}</option>
                ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
            >
              <IoClose />
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <IoSave />
              {editingCategory ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmDelete}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa danh mục này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
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

export default CategoryManagement;
