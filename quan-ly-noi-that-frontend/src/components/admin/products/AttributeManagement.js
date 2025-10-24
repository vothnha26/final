import React, { useState, useEffect } from 'react';
import { IoAdd, IoSearch, IoCreate, IoTrash, IoSave, IoClose } from 'react-icons/io5';
import Modal from '../../shared/Modal';
import ConfirmDialog from '../../shared/ConfirmDialog';
import Toast from '../../shared/Toast';
import api from '../../../api';

const AttributeManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Map attribute data from API
  const mapAttributeFromApi = (attribute) => ({
    maThuocTinh: attribute.maThuocTinh || attribute.id,
    tenThuocTinh: attribute.tenThuocTinh || attribute.name,
    moTa: attribute.moTa || attribute.description || '',
    trangThai: attribute.trangThai || attribute.active || true
  });

  const mapAttributeToApi = (attribute) => ({
    tenThuocTinh: attribute.tenThuocTinh,
    moTa: attribute.moTa,
    trangThai: attribute.trangThai
  });

  // Fetch attributes
  useEffect(() => {
    const fetchAttributes = async () => {
      setIsLoading(true);
      try {
        const data = await api.get('/api/attributes');
        if (Array.isArray(data)) {
          setAttributes(data.map(mapAttributeFromApi));
        }
      } catch (err) {
        setError('Không thể tải danh sách thuộc tính');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAttributes();
  }, []);

  // API Functions
  const createAttribute = async (attributeData) => {
    const response = await api.post('/api/attributes', attributeData);
    return response;
  };

  const updateAttribute = async (id, attributeData) => {
    const response = await api.put(`/api/attributes/${id}`, attributeData);
    return response;
  };

  const deleteAttribute = async (id) => {
    const response = await api.delete(`/api/attributes/${id}`);
    return response;
  };

  const [attributes, setAttributes] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const [formData, setFormData] = useState({
    tenThuocTinh: ''
  });

  // Filter attributes based on search term
  const filteredAttributes = attributes.filter(attr =>
    attr.tenThuocTinh.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.tenThuocTinh.trim()) {
      showToast('Vui lòng nhập tên thuộc tính', 'error');
      return;
    }

    try {
      const attributeData = mapAttributeToApi({
        tenThuocTinh: formData.tenThuocTinh,
        moTa: '',
        trangThai: true
      });

      if (editingAttribute) {
        // Update existing attribute
        await updateAttribute(editingAttribute.maThuocTinh, attributeData);
        showToast('Cập nhật thuộc tính thành công');
        
        // Refresh data
        const data = await api.get('/api/attributes');
        if (Array.isArray(data)) {
          setAttributes(data.map(mapAttributeFromApi));
        }
      } else {
        // Add new attribute
        await createAttribute(attributeData);
        showToast('Thêm thuộc tính thành công');
        
        // Refresh data
        const data = await api.get('/api/attributes');
        if (Array.isArray(data)) {
          setAttributes(data.map(mapAttributeFromApi));
        }
      }

      closeModal();
    } catch (err) {
      showToast('Có lỗi xảy ra khi lưu thuộc tính', 'error');
    }
  };

  const openModal = (attribute = null) => {
    setEditingAttribute(attribute);
    setFormData({
      tenThuocTinh: attribute ? attribute.tenThuocTinh : ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAttribute(null);
    setFormData({ tenThuocTinh: '' });
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteAttribute(deleteId);
      showToast('Xóa thuộc tính thành công');
      
      // Refresh data
      const data = await api.get('/api/attributes');
      if (Array.isArray(data)) {
        setAttributes(data.map(mapAttributeFromApi));
      }
    } catch (err) {
      showToast('Có lỗi xảy ra khi xóa thuộc tính', 'error');
    } finally {
      setShowConfirmDialog(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý Thuộc tính</h1>
              <p className="text-gray-600 mt-1">Quản lý các thuộc tính sản phẩm như màu sắc, chất liệu, kích thước</p>
            </div>
            
            <button
              onClick={() => openModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <IoAdd className="text-lg" />
              Thêm thuộc tính
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <IoClose className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="mb-6 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Đang tải...</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm thuộc tính..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Attributes Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Danh sách thuộc tính ({filteredAttributes.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã thuộc tính
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tên thuộc tính
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAttributes.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <IoSearch className="text-4xl text-gray-400 mb-2" />
                        <p>Không tìm thấy thuộc tính nào</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAttributes.map((attribute) => (
                    <tr key={attribute.maThuocTinh} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{attribute.maThuocTinh}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {attribute.tenThuocTinh}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openModal(attribute)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                            title="Chỉnh sửa"
                          >
                            <IoCreate className="text-lg" />
                          </button>
                          <button
                            onClick={() => handleDelete(attribute.maThuocTinh)}
                            className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                            title="Xóa"
                          >
                            <IoTrash className="text-lg" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={closeModal} title={editingAttribute ? 'Chỉnh sửa thuộc tính' : 'Thêm thuộc tính mới'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="tenThuocTinh" className="block text-sm font-medium text-gray-700 mb-1">
              Tên thuộc tính *
            </label>
            <input
              type="text"
              id="tenThuocTinh"
              value={formData.tenThuocTinh}
              onChange={(e) => setFormData({ ...formData, tenThuocTinh: e.target.value })}
              placeholder="Ví dụ: Màu sắc, Chất liệu, Kích thước..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
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
              {editingAttribute ? 'Cập nhật' : 'Thêm mới'}
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
        message="Bạn có chắc chắn muốn xóa thuộc tính này? Hành động này không thể hoàn tác."
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

export default AttributeManagement;
