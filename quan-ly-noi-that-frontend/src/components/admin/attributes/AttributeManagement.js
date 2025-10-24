import React, { useState, useEffect, useCallback } from 'react';
import { IoAdd, IoChevronDown, IoChevronUp } from 'react-icons/io5';
import api from '../../../api';
import Modal from '../../shared/Modal';

const AttributeManagement = () => {
  const [attributes, setAttributes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedAttributes, setExpandedAttributes] = useState(new Set());

  const [showAddAttributeModal, setShowAddAttributeModal] = useState(false);
  const [showEditAttributeModal, setShowEditAttributeModal] = useState(false);
  const [showAddValueModal, setShowAddValueModal] = useState(false);
  const [showEditValueModal, setShowEditValueModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [selectedAttribute, setSelectedAttribute] = useState(null);
  const [selectedValue, setSelectedValue] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [attributeForm, setAttributeForm] = useState({
    tenThuocTinh: '',
    moTa: ''
  });

  const [valueForm, setValueForm] = useState({
    giaTri: '',
    moTa: ''
  });

  // Map API attribute object -> UI shape
  const mapAttributeFromApi = (a) => ({
    id: a.maThuocTinh || a.id,
    tenThuocTinh: a.tenThuocTinh || '',
    moTa: a.moTa || '',
    trangThai: a.trangThai !== false,
    giaTriThuocTinhs: a.giaTriThuocTinhs || []
  });

  // Map API value object -> UI shape
  const mapValueFromApi = (v) => ({
    id: v.maGiaTriThuocTinh || v.id,
    giaTri: v.giaTri || '',
    moTa: v.moTa || '',
    trangThai: v.trangThai !== false
  });

  const fetchAttributes = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.get('/api/attributes');
      if (Array.isArray(data)) {
        // Fetch values for each attribute
        const attributesWithValues = await Promise.all(
          data.map(async (attr) => {
            try {
              const values = await api.get(`/api/attributes/${attr.maThuocTinh || attr.id}/values`);
              return {
                ...mapAttributeFromApi(attr),
                giaTriThuocTinhs: Array.isArray(values) ? values.map(mapValueFromApi) : []
              };
            } catch (err) {
              return mapAttributeFromApi(attr);
            }
          })
        );
        setAttributes(attributesWithValues);
      } else {
        setAttributes([]);
      }
    } catch (err) {
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  const handleAddAttribute = async () => {
    try {
      const payload = {
        tenThuocTinh: attributeForm.tenThuocTinh,
        moTa: attributeForm.moTa
      };
      const created = await api.post('/api/attributes', { body: payload });
      const createdMapped = mapAttributeFromApi(created);
      setAttributes(prev => [...prev, createdMapped]);
      setShowAddAttributeModal(false);
      resetAttributeForm();
    } catch (err) {
      setError(err);
    }
  };

  const handleEditAttribute = async () => {
    try {
      const payload = {
        tenThuocTinh: attributeForm.tenThuocTinh,
        moTa: attributeForm.moTa
      };
      await api.put(`/api/attributes/${selectedAttribute.id}`, { body: payload });
      setAttributes(prev => prev.map(a => a.id === selectedAttribute.id ? { ...a, ...attributeForm } : a));
      setShowEditAttributeModal(false);
      setSelectedAttribute(null);
      resetAttributeForm();
    } catch (err) {
      setError(err);
    }
  };

  const handleAddValue = async () => {
    try {
      const payload = {
        giaTri: valueForm.giaTri,
        moTa: valueForm.moTa
      };
      const created = await api.post(`/api/attributes/${selectedAttribute.id}/values`, { body: payload });
      const createdMapped = mapValueFromApi(created);
      setAttributes(prev => prev.map(a =>
        a.id === selectedAttribute.id
          ? { ...a, giaTriThuocTinhs: [...a.giaTriThuocTinhs, createdMapped] }
          : a
      ));
      setShowAddValueModal(false);
      resetValueForm();
    } catch (err) {
      setError(err);
    }
  };

  const handleEditValue = async () => {
    try {
      const payload = {
        giaTri: valueForm.giaTri,
        moTa: valueForm.moTa
      };
      await api.put(`/api/attributes/values/${selectedValue.id}`, { body: payload });
      setAttributes(prev => prev.map(a =>
        a.id === selectedAttribute.id
          ? {
              ...a,
              giaTriThuocTinhs: a.giaTriThuocTinhs.map(v =>
                v.id === selectedValue.id ? { ...v, ...valueForm } : v
              )
            }
          : a
      ));
      setShowEditValueModal(false);
      setSelectedValue(null);
      resetValueForm();
    } catch (err) {
      setError(err);
    }
  };

  const handleDelete = (type, item, attributeId = null) => {
    setItemToDelete({ type, item, attributeId });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      if (itemToDelete.type === 'attribute') {
        await api.del(`/api/attributes/${itemToDelete.item.id}`);
        setAttributes(prev => prev.filter(a => a.id !== itemToDelete.item.id));
      } else if (itemToDelete.type === 'value') {
        await api.del(`/api/attributes/values/${itemToDelete.item.id}`);
        setAttributes(prev => prev.map(a =>
          a.id === itemToDelete.attributeId
            ? { ...a, giaTriThuocTinhs: a.giaTriThuocTinhs.filter(v => v.id !== itemToDelete.item.id) }
            : a
        ));
      }
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    } catch (err) {
      setError(err);
    }
  };

  const toggleExpanded = (attributeId) => {
    setExpandedAttributes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(attributeId)) {
        newSet.delete(attributeId);
      } else {
        newSet.add(attributeId);
      }
      return newSet;
    });
  };

  const resetAttributeForm = () => {
    setAttributeForm({
      tenThuocTinh: '',
      moTa: ''
    });
  };

  const resetValueForm = () => {
    setValueForm({
      giaTri: '',
      moTa: ''
    });
  };

  const openEditAttribute = (attribute) => {
    setSelectedAttribute(attribute);
    setAttributeForm({
      tenThuocTinh: attribute.tenThuocTinh,
      moTa: attribute.moTa
    });
    setShowEditAttributeModal(true);
  };

  const openAddValue = (attribute) => {
    setSelectedAttribute(attribute);
    setShowAddValueModal(true);
  };

  const openEditValue = (attribute, value) => {
    setSelectedAttribute(attribute);
    setSelectedValue(value);
    setValueForm({
      giaTri: value.giaTri,
      moTa: value.moTa
    });
    setShowEditValueModal(true);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý thuộc tính</h1>
        <button
          onClick={() => setShowAddAttributeModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <IoAdd className="w-5 h-5" />
          <span>Thêm thuộc tính</span>
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Đang tải...</div>
      ) : (
        <div className="space-y-4">
          {attributes.map(attribute => (
            <div key={attribute.id} className="border rounded-lg overflow-hidden">
              {/* Attribute Header */}
              <div
                className="bg-gray-50 p-4 cursor-pointer flex justify-between items-center hover:bg-gray-100"
                onClick={() => toggleExpanded(attribute.id)}
              >
                <div className="flex items-center space-x-4">
                  {expandedAttributes.has(attribute.id) ? (
                    <IoChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <IoChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                  <div>
                    <h3 className="font-medium text-lg">{attribute.tenThuocTinh}</h3>
                    <p className="text-sm text-gray-600">{attribute.moTa || 'Không có mô tả'}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    attribute.trangThai ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {attribute.trangThai ? 'Hoạt động' : 'Ngừng'}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditAttribute(attribute); }}
                    className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 border rounded"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); openAddValue(attribute); }}
                    className="text-green-600 hover:text-green-800 text-sm px-3 py-1 border rounded"
                  >
                    Thêm giá trị
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete('attribute', attribute); }}
                    className="text-red-600 hover:text-red-800 text-sm px-3 py-1 border rounded"
                  >
                    Xóa
                  </button>
                </div>
              </div>

              {/* Attribute Values */}
              {expandedAttributes.has(attribute.id) && (
                <div className="p-4 bg-white">
                  {attribute.giaTriThuocTinhs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {attribute.giaTriThuocTinhs.map(value => (
                        <div key={value.id} className="border rounded p-3 flex justify-between items-center">
                          <div>
                            <div className="font-medium">{value.giaTri}</div>
                            {value.moTa && <div className="text-sm text-gray-600">{value.moTa}</div>}
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => openEditValue(attribute, value)}
                              className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 border rounded"
                            >
                              Sửa
                            </button>
                            <button
                              onClick={() => handleDelete('value', value, attribute.id)}
                              className="text-red-600 hover:text-red-800 text-xs px-2 py-1 border rounded"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">Chưa có giá trị nào</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Attribute Modal */}
      <Modal
        isOpen={showAddAttributeModal}
        onClose={() => { setShowAddAttributeModal(false); resetAttributeForm(); }}
        title="Thêm thuộc tính mới"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tên thuộc tính *</label>
            <input
              type="text"
              value={attributeForm.tenThuocTinh}
              onChange={(e) => setAttributeForm(prev => ({ ...prev, tenThuocTinh: e.target.value }))}
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mô tả</label>
            <textarea
              value={attributeForm.moTa}
              onChange={(e) => setAttributeForm(prev => ({ ...prev, moTa: e.target.value }))}
              className="w-full p-2 border rounded-lg"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              onClick={() => { setShowAddAttributeModal(false); resetAttributeForm(); }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleAddAttribute}
              disabled={!attributeForm.tenThuocTinh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Thêm thuộc tính
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Attribute Modal */}
      <Modal
        isOpen={showEditAttributeModal}
        onClose={() => { setShowEditAttributeModal(false); setSelectedAttribute(null); resetAttributeForm(); }}
        title="Chỉnh sửa thuộc tính"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tên thuộc tính *</label>
            <input
              type="text"
              value={attributeForm.tenThuocTinh}
              onChange={(e) => setAttributeForm(prev => ({ ...prev, tenThuocTinh: e.target.value }))}
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mô tả</label>
            <textarea
              value={attributeForm.moTa}
              onChange={(e) => setAttributeForm(prev => ({ ...prev, moTa: e.target.value }))}
              className="w-full p-2 border rounded-lg"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              onClick={() => { setShowEditAttributeModal(false); setSelectedAttribute(null); resetAttributeForm(); }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleEditAttribute}
              disabled={!attributeForm.tenThuocTinh}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Value Modal */}
      <Modal
        isOpen={showAddValueModal}
        onClose={() => { setShowAddValueModal(false); setSelectedAttribute(null); resetValueForm(); }}
        title={`Thêm giá trị cho "${selectedAttribute?.tenThuocTinh}"`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Giá trị *</label>
            <input
              type="text"
              value={valueForm.giaTri}
              onChange={(e) => setValueForm(prev => ({ ...prev, giaTri: e.target.value }))}
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mô tả</label>
            <textarea
              value={valueForm.moTa}
              onChange={(e) => setValueForm(prev => ({ ...prev, moTa: e.target.value }))}
              className="w-full p-2 border rounded-lg"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              onClick={() => { setShowAddValueModal(false); setSelectedAttribute(null); resetValueForm(); }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleAddValue}
              disabled={!valueForm.giaTri}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Thêm giá trị
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Value Modal */}
      <Modal
        isOpen={showEditValueModal}
        onClose={() => { setShowEditValueModal(false); setSelectedAttribute(null); setSelectedValue(null); resetValueForm(); }}
        title={`Chỉnh sửa giá trị`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Giá trị *</label>
            <input
              type="text"
              value={valueForm.giaTri}
              onChange={(e) => setValueForm(prev => ({ ...prev, giaTri: e.target.value }))}
              className="w-full p-2 border rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mô tả</label>
            <textarea
              value={valueForm.moTa}
              onChange={(e) => setValueForm(prev => ({ ...prev, moTa: e.target.value }))}
              className="w-full p-2 border rounded-lg"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <button
              onClick={() => { setShowEditValueModal(false); setSelectedAttribute(null); setSelectedValue(null); resetValueForm(); }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleEditValue}
              disabled={!valueForm.giaTri}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setItemToDelete(null); }}
        title="Xác nhận xóa"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Bạn có chắc muốn xóa {itemToDelete?.type === 'attribute' ? 'thuộc tính' : 'giá trị'} "
            {itemToDelete?.item?.tenThuocTinh || itemToDelete?.item?.giaTri}"?
          </p>
          <p className="text-sm text-gray-500">
            Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => { setShowDeleteConfirm(false); setItemToDelete(null); }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Xóa
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AttributeManagement;