import React, { useState, useEffect } from 'react';
import { IoAdd, IoSearch, IoCreate, IoTrash, IoSave, IoClose, IoColorPalette, IoResize } from 'react-icons/io5';
import Modal from '../../shared/Modal';
import ConfirmDialog from '../../shared/ConfirmDialog';
import Toast from '../../shared/Toast';
import api from '../../../api';

const AttributeValueManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Map attribute value data from API
  const mapAttributeValueFromApi = (attributeValue) => ({
    maGiaTri: attributeValue.maGiaTri || attributeValue.id,
    thuocTinh: {
      maThuocTinh: attributeValue.thuocTinh?.maThuocTinh || attributeValue.attributeId,
      tenThuocTinh: attributeValue.thuocTinh?.tenThuocTinh || attributeValue.attributeName
    },
    giaTri: attributeValue.giaTri || attributeValue.value,
    moTa: attributeValue.moTa || attributeValue.description || '',
    trangThai: attributeValue.trangThai || attributeValue.active || true
  });

  const mapAttributeValueToApi = (attributeValue) => ({
    maThuocTinh: attributeValue.thuocTinh.maThuocTinh,
    giaTri: attributeValue.giaTri,
    moTa: attributeValue.moTa,
    trangThai: attributeValue.trangThai
  });

  // Fetch attribute values and attributes
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch attributes first
        const attributesData = await api.get('/api/attributes');
        if (Array.isArray(attributesData)) {
          setAttributes(attributesData.map(attr => ({
            maThuocTinh: attr.maThuocTinh || attr.id,
            tenThuocTinh: attr.tenThuocTinh || attr.name
          })));
        }

        // Fetch attribute values
        const valuesData = await api.get('/api/attribute-values');
        if (Array.isArray(valuesData)) {
          setAttributeValues(valuesData.map(mapAttributeValueFromApi));
        }
      } catch (err) {
        setError('Không thể tải dữ liệu thuộc tính');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // API Functions
  const createAttributeValue = async (valueData) => {
    const response = await api.post('/api/attribute-values', valueData);
    return response;
  };

  const updateAttributeValue = async (id, valueData) => {
    const response = await api.put(`/api/attribute-values/${id}`, valueData);
    return response;
  };

  const deleteAttributeValue = async (id) => {
    const response = await api.delete(`/api/attribute-values/${id}`);
    return response;
  };

  const [attributeValues, setAttributeValues] = useState([]);

  const [attributes, setAttributes] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [editingValue, setEditingValue] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAttribute, setSelectedAttribute] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const [formData, setFormData] = useState({
    maThuocTinh: '',
    giaTri: ''
  });

  // Filter attribute values based on search term and selected attribute
  const filteredValues = attributeValues.filter(value => {
    const matchesSearch = value.giaTri.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         value.thuocTinh.tenThuocTinh.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAttribute = selectedAttribute === '' || 
                           value.thuocTinh.maThuocTinh.toString() === selectedAttribute;
    return matchesSearch && matchesAttribute;
  });

  // Group values by attribute
  const groupedValues = filteredValues.reduce((groups, value) => {
    const key = value.thuocTinh.tenThuocTinh;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(value);
    return groups;
  }, {});

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.maThuocTinh || !formData.giaTri.trim()) {
      showToast('Vui lòng điền đầy đủ thông tin', 'error');
      return;
    }

    try {
      const selectedAttr = attributes.find(attr => attr.maThuocTinh.toString() === formData.maThuocTinh);
      const valueData = mapAttributeValueToApi({
        thuocTinh: { maThuocTinh: selectedAttr.maThuocTinh },
        giaTri: formData.giaTri,
        moTa: '',
        trangThai: true
      });

      if (editingValue) {
        // Update existing value
        await updateAttributeValue(editingValue.maGiaTri, valueData);
        showToast('Cập nhật giá trị thuộc tính thành công');
      } else {
        // Add new value
        await createAttributeValue(valueData);
        showToast('Thêm giá trị thuộc tính thành công');
      }

      // Refresh data
      const valuesData = await api.get('/api/attribute-values');
      if (Array.isArray(valuesData)) {
        setAttributeValues(valuesData.map(mapAttributeValueFromApi));
      }

      closeModal();
    } catch (err) {
      showToast('Có lỗi xảy ra khi lưu giá trị thuộc tính', 'error');
    }
  };

  const openModal = (value = null) => {
    setEditingValue(value);
    setFormData({
      maThuocTinh: value ? value.thuocTinh.maThuocTinh.toString() : '',
      giaTri: value ? value.giaTri : ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingValue(null);
    setFormData({ maThuocTinh: '', giaTri: '' });
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setShowConfirmDialog(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteAttributeValue(deleteId);
      showToast('Xóa giá trị thuộc tính thành công');
      
      // Refresh data
      const valuesData = await api.get('/api/attribute-values');
      if (Array.isArray(valuesData)) {
        setAttributeValues(valuesData.map(mapAttributeValueFromApi));
      }
    } catch (err) {
      showToast('Có lỗi xảy ra khi xóa giá trị thuộc tính', 'error');
    } finally {
      setShowConfirmDialog(false);
      setDeleteId(null);
    }
  };

  const getAttributeIcon = (attributeName) => {
    switch (attributeName.toLowerCase()) {
      case 'màu sắc':
        return <IoColorPalette className="text-blue-500" />;
      case 'kích thước':
        return <IoResize className="text-green-500" />;
      default:
        return <div className="w-4 h-4 bg-gray-400 rounded-full"></div>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý Giá trị Thuộc tính</h1>
              <p className="text-gray-600 mt-1">Quản lý các giá trị cụ thể cho từng thuộc tính (Đỏ, Xanh cho Màu sắc)</p>
            </div>
            
            <button
              onClick={() => openModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <IoAdd className="text-lg" />
              Thêm giá trị
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

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm giá trị thuộc tính..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="md:w-64">
              <select
                value={selectedAttribute}
                onChange={(e) => setSelectedAttribute(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Tất cả thuộc tính</option>
                {attributes.map(attr => (
                  <option key={attr.maThuocTinh} value={attr.maThuocTinh}>
                    {attr.tenThuocTinh}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Values Display */}
        <div className="space-y-6">
          {Object.keys(groupedValues).length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <IoSearch className="text-4xl text-gray-400 mb-4 mx-auto" />
              <p className="text-gray-500">Không tìm thấy giá trị thuộc tính nào</p>
            </div>
          ) : (
            Object.entries(groupedValues).map(([attributeName, values]) => (
              <div key={attributeName} className="bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    {getAttributeIcon(attributeName)}
                    <h2 className="text-lg font-semibold text-gray-900">
                      {attributeName} ({values.length} giá trị)
                    </h2>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Mã giá trị
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Giá trị
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Thao tác
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {values.map((value) => (
                        <tr key={value.maGiaTri} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            #{value.maGiaTri}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {attributeName.toLowerCase() === 'màu sắc' && (
                                <div 
                                  className="w-6 h-6 rounded-full border-2 border-gray-300"
                                  style={{ 
                                    backgroundColor: value.giaTri.toLowerCase() === 'đỏ' ? '#ef4444' :
                                                   value.giaTri.toLowerCase() === 'xanh' ? '#3b82f6' :
                                                   value.giaTri.toLowerCase() === 'vàng' ? '#eab308' :
                                                   '#6b7280'
                                  }}
                                />
                              )}
                              <span className="text-sm font-medium text-gray-900">
                                {value.giaTri}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openModal(value)}
                                className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                                title="Chỉnh sửa"
                              >
                                <IoCreate className="text-lg" />
                              </button>
                              <button
                                onClick={() => handleDelete(value.maGiaTri)}
                                className="text-red-600 hover:text-red-900 p-1 rounded transition-colors"
                                title="Xóa"
                              >
                                <IoTrash className="text-lg" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={closeModal} title={editingValue ? 'Chỉnh sửa giá trị thuộc tính' : 'Thêm giá trị thuộc tính mới'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="maThuocTinh" className="block text-sm font-medium text-gray-700 mb-1">
              Thuộc tính *
            </label>
            <select
              id="maThuocTinh"
              value={formData.maThuocTinh}
              onChange={(e) => setFormData({ ...formData, maThuocTinh: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Chọn thuộc tính</option>
              {attributes.map(attr => (
                <option key={attr.maThuocTinh} value={attr.maThuocTinh}>
                  {attr.tenThuocTinh}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="giaTri" className="block text-sm font-medium text-gray-700 mb-1">
              Giá trị *
            </label>
            <input
              type="text"
              id="giaTri"
              value={formData.giaTri}
              onChange={(e) => setFormData({ ...formData, giaTri: e.target.value })}
              placeholder="Ví dụ: Đỏ, Gỗ sồi, Size L..."
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
              {editingValue ? 'Cập nhật' : 'Thêm mới'}
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
        message="Bạn có chắc chắn muốn xóa giá trị thuộc tính này? Hành động này không thể hoàn tác."
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

export default AttributeValueManagement;
