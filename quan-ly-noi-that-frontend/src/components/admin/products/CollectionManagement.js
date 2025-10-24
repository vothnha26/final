import React, { useState, useEffect, useCallback } from 'react';
import { IoAdd, IoSearch, IoCreate, IoTrash, IoSave, IoClose, IoLayers, IoText } from 'react-icons/io5';
import Modal from '../../shared/Modal';
import ConfirmDialog from '../../shared/ConfirmDialog';
import Toast from '../../shared/Toast';
import api from '../../../api';

const CollectionManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Map collection data from API
  const mapCollectionFromApi = (collection) => ({
    maBoSuuTap: collection.maBoSuuTap || collection.id,
    tenBoSuuTap: collection.tenBoSuuTap || collection.name,
    moTa: collection.moTa || collection.description || '',
    hinhAnh: collection.hinhAnh || collection.image || null,
    soLuongSanPham: collection.soLuongSanPham || collection.productCount || 0,
    ngayTao: collection.ngayTao || collection.createdAt || '',
    trangThai: collection.trangThai || collection.active || true
  });

  const mapCollectionToApi = (collection) => ({
    tenBoSuuTap: collection.tenBoSuuTap,
    moTa: collection.moTa,
    trangThai: collection.trangThai
  });

  // Fetch collections (exposed so handlers can refresh after edit/delete)
  const fetchCollections = useCallback(async () => {
    setIsLoading(true);
    try {
      // Backend controller exposes /api/collections
      const data = await api.get('/api/collections');
      if (Array.isArray(data)) {
        setCollections(data.map(mapCollectionFromApi));
      } else if (data && data.content) {
        setCollections(data.content.map(mapCollectionFromApi));
      }
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchCollections(); }, [fetchCollections]);

  const [collections, setCollections] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [editingCollection, setEditingCollection] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const [formData, setFormData] = useState({
    tenBoSuuTap: '',
    moTa: ''
  });

  // File selected for upload (image)
  const [selectedImageFile, setSelectedImageFile] = useState(null);

  // Manage products modal state
  const [showManageProductsModal, setShowManageProductsModal] = useState(false);
  const [managingCollection, setManagingCollection] = useState(null);
  const [managingProducts, setManagingProducts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);

  // Filter collections based on search term
  const filteredCollections = collections.filter(collection =>
    collection.tenBoSuuTap.toLowerCase().includes(searchTerm.toLowerCase()) ||
    collection.moTa.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.tenBoSuuTap.trim()) {
      showToast('Vui lòng nhập tên bộ sưu tập', 'error');
      return;
    }

    // Check if collection name already exists
    const exists = collections.some(collection => 
      collection.tenBoSuuTap.toLowerCase() === formData.tenBoSuuTap.toLowerCase() &&
      collection.maBoSuuTap !== editingCollection?.maBoSuuTap
    );

    if (exists) {
      showToast('Tên bộ sưu tập đã tồn tại', 'error');
      return;
    }

    // Persist to backend
    (async () => {
      setIsLoading(true);
      try {
        if (editingCollection) {
          await api.put(`/api/collections/${editingCollection.maBoSuuTap}`, { body: mapCollectionToApi(formData) });
          // If image selected, upload it with FormData to /api/collections/{id}/image
          if (selectedImageFile) {
            const fd = new FormData();
            fd.append('image', selectedImageFile);
            await api.post(`/api/collections/${editingCollection.maBoSuuTap}/image`, fd);
          }
          showToast('Cập nhật bộ sưu tập thành công');
        } else {
          const created = await api.post('/api/collections', { body: mapCollectionToApi(formData) });
          // created is the new collection entity with maBoSuuTap
          const newId = created.maBoSuuTap || created.id;
          if (selectedImageFile && newId) {
            const fd = new FormData();
            fd.append('image', selectedImageFile);
            await api.post(`/api/collections/${newId}/image`, fd);
          }
          showToast('Thêm bộ sưu tập thành công');
        }
        await fetchCollections();
        closeModal();
      } catch (err) {
        showToast('Lưu bộ sưu tập thất bại', 'error');
      } finally {
        setIsLoading(false);
      }
    })();
  };

  const openModal = (collection = null) => {
    setEditingCollection(collection);
    setFormData({
      tenBoSuuTap: collection ? collection.tenBoSuuTap : '',
      moTa: collection ? collection.moTa : ''
    });
    setSelectedImageFile(null);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCollection(null);
    setFormData({ tenBoSuuTap: '', moTa: '' });
    setSelectedImageFile(null);
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setShowConfirmDialog(true);
  };

  const confirmDelete = () => {
    (async () => {
      setIsLoading(true);
      try {
        await api.del(`/api/collections/${deleteId}`);
        showToast('Xóa bộ sưu tập thành công');
        await fetchCollections();
      } catch (err) {
        // Hiển thị thông báo lỗi chi tiết
        const errorMessage = err.data?.message || err.message || 'Xóa bộ sưu tập thất bại';
        showToast(errorMessage, 'error');
      } finally {
        setIsLoading(false);
        setShowConfirmDialog(false);
        setDeleteId(null);
      }
    })();
  };

  // --- Manage products helpers ---
  const openManageProducts = async (collection) => {
    setManagingCollection(collection);
    setShowManageProductsModal(true);
    await loadProductsForCollection(collection.maBoSuuTap);
  };

  const loadProductsForCollection = async (collectionId) => {
    setProductsLoading(true);
    try {
      // products in collection
      const inCollection = await api.get(`/api/collections/${collectionId}/products`);
      const mappedIn = Array.isArray(inCollection) ? inCollection : [];
      setManagingProducts(mappedIn.map(p => ({ maSanPham: p.maSanPham || p.id, tenSanPham: p.tenSanPham || p.name })));

      // available products (all products) - backend GET /api/products
      const all = await api.get('/api/products');
      const allList = Array.isArray(all) ? all : (all?.content || []);
      // filter out products already in collection
      const inIds = new Set(mappedIn.map(p => p.maSanPham || p.id));
      const available = allList.filter(p => !inIds.has(p.maSanPham ?? p.id)).map(p => ({ maSanPham: p.maSanPham || p.id, tenSanPham: p.tenSanPham || p.name }));
      setAvailableProducts(available);
    } catch (err) {
      showToast('Không thể tải danh sách sản phẩm', 'error');
      setManagingProducts([]);
      setAvailableProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  const addProductToCollection = async (collectionId, productId) => {
    try {
      setProductsLoading(true);
      await api.post(`/api/collections/${collectionId}/products/${productId}`);
      showToast('Đã thêm sản phẩm vào bộ sưu tập');
      // refresh lists and collections
      await loadProductsForCollection(collectionId);
      await fetchCollections();
    } catch (err) {
      showToast('Thêm sản phẩm thất bại', 'error');
    } finally {
      setProductsLoading(false);
    }
  };

  const removeProductFromCollection = async (collectionId, productId) => {
    try {
      setProductsLoading(true);
      await api.del(`/api/collections/${collectionId}/products/${productId}`);
      showToast('Đã xóa sản phẩm khỏi bộ sưu tập');
      await loadProductsForCollection(collectionId);
      await fetchCollections();
    } catch (err) {
      showToast('Xóa sản phẩm thất bại', 'error');
    } finally {
      setProductsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getCollectionIcon = (index) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];
    return colors[index % colors.length];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý Bộ sưu tập</h1>
              <p className="text-gray-600 mt-1">Nhóm các sản phẩm thành bộ sưu tập theo chủ đề để khách hàng dễ mua sắm</p>
            </div>
            
            <button
              onClick={() => openModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <IoAdd className="text-lg" />
              Thêm bộ sưu tập
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
                  placeholder="Tìm kiếm bộ sưu tập..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Collections Grid */}
        {filteredCollections.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <IoSearch className="text-4xl text-gray-400 mb-4 mx-auto" />
            <p className="text-gray-500">Không tìm thấy bộ sưu tập nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCollections.map((collection, index) => (
              <div key={collection.maBoSuuTap} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Collection Header */}
                <div className={`p-6 ${getCollectionIcon(index)} text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IoLayers className="text-2xl" />
                      <div>
                        <h3 className="font-semibold text-lg">{collection.tenBoSuuTap}</h3>
                        <p className="text-white/80 text-sm">#{collection.maBoSuuTap}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="bg-white/20 rounded-lg px-3 py-1">
                        <span className="text-sm font-medium">{collection.soLuongSanPham}</span>
                        <div className="text-xs opacity-80">sản phẩm</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Collection Content */}
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <IoText className="text-gray-400 mt-1 flex-shrink-0" />
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {collection.moTa || 'Chưa có mô tả'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>Ngày tạo: {formatDate(collection.ngayTao)}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(collection)}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <IoCreate className="text-sm" />
                      Chỉnh sửa
                    </button>
                    <button
                      onClick={() => openManageProducts(collection)}
                      className="flex-1 bg-green-50 hover:bg-green-100 text-green-600 px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <IoAdd className="text-sm" />
                      Quản lý sản phẩm
                    </button>
                    <button
                      onClick={() => handleDelete(collection.maBoSuuTap)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <IoTrash className="text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê tổng quan</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{collections.length}</div>
              <div className="text-sm text-blue-600">Tổng bộ sưu tập</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {collections.reduce((total, collection) => total + collection.soLuongSanPham, 0)}
              </div>
              <div className="text-sm text-green-600">Tổng sản phẩm</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {collections.length > 0 ? Math.round(collections.reduce((total, collection) => total + collection.soLuongSanPham, 0) / collections.length) : 0}
              </div>
              <div className="text-sm text-purple-600">Trung bình/bộ sưu tập</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {collections.filter(c => c.soLuongSanPham === 0).length}
              </div>
              <div className="text-sm text-yellow-600">Bộ sưu tập trống</div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={closeModal} title={editingCollection ? 'Chỉnh sửa bộ sưu tập' : 'Thêm bộ sưu tập mới'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="tenBoSuuTap" className="block text-sm font-medium text-gray-700 mb-1">
              Tên bộ sưu tập *
            </label>
            <input
              type="text"
              id="tenBoSuuTap"
              value={formData.tenBoSuuTap}
              onChange={(e) => setFormData({ ...formData, tenBoSuuTap: e.target.value })}
              placeholder="Ví dụ: Bộ sưu tập Nordic, Vintage..."
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
              placeholder="Mô tả về phong cách, đặc điểm của bộ sưu tập..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ảnh đại diện (tùy chọn)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setSelectedImageFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
              className="w-full"
            />
            {selectedImageFile && (
              <div className="mt-2">
                <img src={URL.createObjectURL(selectedImageFile)} alt="preview" className="w-32 h-32 object-cover rounded" />
              </div>
            )}
            {/* show existing image for editing */}
            {!selectedImageFile && editingCollection && editingCollection.hinhAnh && (
              <div className="mt-2">
                <img src={api.buildUrl(editingCollection.hinhAnh)} alt="current" className="w-32 h-32 object-cover rounded" />
              </div>
            )}
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
              {editingCollection ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manage Products Modal */}
      <Modal
        isOpen={showManageProductsModal}
        onClose={() => { setShowManageProductsModal(false); setManagingCollection(null); setManagingProducts([]); setAvailableProducts([]); }}
        title={managingCollection ? `Quản lý sản phẩm - ${managingCollection.tenBoSuuTap}` : 'Quản lý sản phẩm'}
      >
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <h4 className="font-semibold mb-2">Sản phẩm trong bộ sưu tập</h4>
              <div className="max-h-64 overflow-auto border rounded p-2">
                {productsLoading ? (
                  <div className="text-sm text-gray-500">Đang tải...</div>
                ) : managingProducts.length === 0 ? (
                  <div className="text-sm text-gray-500">Chưa có sản phẩm nào</div>
                ) : (
                  managingProducts.map(p => (
                    <div key={p.maSanPham} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div className="text-sm">{p.tenSanPham}</div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={async () => { await removeProductFromCollection(managingCollection.maBoSuuTap, p.maSanPham); }}
                          className="text-red-600 bg-red-50 px-2 py-1 rounded hover:bg-red-100 text-sm"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex-1">
              <h4 className="font-semibold mb-2">Sản phẩm khả dụng</h4>
              <div className="max-h-64 overflow-auto border rounded p-2">
                {productsLoading ? (
                  <div className="text-sm text-gray-500">Đang tải...</div>
                ) : availableProducts.length === 0 ? (
                  <div className="text-sm text-gray-500">Không có sản phẩm khả dụng</div>
                ) : (
                  availableProducts.map(p => (
                    <div key={p.maSanPham} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div className="text-sm">{p.tenSanPham}</div>
                      <div>
                        <button
                          onClick={async () => { await addProductToCollection(managingCollection.maBoSuuTap, p.maSanPham); }}
                          className="text-green-600 bg-green-50 px-2 py-1 rounded hover:bg-green-100 text-sm"
                        >
                          Thêm
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => { setShowManageProductsModal(false); setManagingCollection(null); setManagingProducts([]); setAvailableProducts([]); }}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmDelete}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa bộ sưu tập này? Các sản phẩm trong bộ sưu tập sẽ không bị xóa nhưng sẽ không còn thuộc bộ sưu tập này."
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

export default CollectionManagement;
