import React, { useState, useEffect } from 'react';
import api from '../../../api';
import DataTable from '../../shared/DataTable';
import Modal from '../../shared/Modal';

const CategoryManagement = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [categoryForm, setCategoryForm] = useState({
    tenDanhMuc: '',
    moTa: '',
    maDanhMucCha: ''
  });

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // Fetch categories
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get('/api/categories');
      const categoryList = Array.isArray(data) ? data : (data?.content || []);
      setCategories(categoryList);
    } catch (err) {
      setError(err.message || 'Không thể tải danh sách danh mục');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async () => {
    try {
      const payload = {
        tenDanhMuc: categoryForm.tenDanhMuc,
        moTa: categoryForm.moTa,
        maDanhMucCha: categoryForm.maDanhMucCha ? parseInt(categoryForm.maDanhMucCha) : null
      };
      await api.post('/api/categories', { body: payload });
      await fetchCategories();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      alert('Lỗi thêm danh mục: ' + (err.message || 'Unknown error'));
    }
  };

  const handleEditCategory = async () => {
    if (!selectedCategory?.maDanhMuc) return;
    try {
      const payload = {
        tenDanhMuc: categoryForm.tenDanhMuc,
        moTa: categoryForm.moTa,
        maDanhMucCha: categoryForm.maDanhMucCha ? parseInt(categoryForm.maDanhMucCha) : null
      };
      await api.put(`/api/categories/${selectedCategory.maDanhMuc}`, { body: payload });
      await fetchCategories();
      setShowEditModal(false);
      setSelectedCategory(null);
      resetForm();
    } catch (err) {
      alert('Lỗi cập nhật danh mục: ' + (err.message || 'Unknown error'));
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete?.maDanhMuc) return;
    try {
      await api.del(`/api/categories/${categoryToDelete.maDanhMuc}`);
      await fetchCategories();
      setShowDeleteConfirm(false);
      setCategoryToDelete(null);
    } catch (err) {
      alert('Lỗi xóa danh mục: ' + (err.message || 'Unknown error'));
    }
  };

  const openEditModal = (category) => {
    setSelectedCategory(category);
    setCategoryForm({
      tenDanhMuc: category.tenDanhMuc || '',
      moTa: category.moTa || '',
      maDanhMucCha: category.maDanhMucCha || ''
    });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (category) => {
    setCategoryToDelete(category);
    setShowDeleteConfirm(true);
  };

  const resetForm = () => {
    setCategoryForm({
      tenDanhMuc: '',
      moTa: '',
      maDanhMucCha: ''
    });
  };

  // Table columns
  const columns = [
    {
      key: 'maDanhMuc',
      label: 'Mã',
      render: (value) => <span>#{value}</span>
    },
    {
      key: 'tenDanhMuc',
      label: 'Tên danh mục',
      render: (value, row) => (
        <div>
          <div className="font-medium">{value}</div>
          {row.tenDanhMucCha && (
            <div className="text-xs text-gray-500">Thuộc: {row.tenDanhMucCha}</div>
          )}
        </div>
      )
    },
    {
      key: 'moTa',
      label: 'Mô tả',
      render: (value) => value || <span className="text-gray-400">—</span>
    },
    {
      key: 'trangThai',
      label: 'Trạng thái',
      render: (value) => (
        <span className={`px-2 py-1 text-xs rounded ${
          value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value ? 'Hoạt động' : 'Không hoạt động'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Thao tác',
      render: (_, row) => (
        <div className="flex gap-2">
          <button
            onClick={() => openEditModal(row)}
            className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
          >
            Sửa
          </button>
          <button
            onClick={() => openDeleteConfirm(row)}
            className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
          >
            Xóa
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="bg-white rounded shadow">
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Quản lý danh mục</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Thêm danh mục
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="m-4 p-3 bg-red-50 text-red-600 rounded">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="p-4">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Đang tải...</div>
          ) : (
            <DataTable
              data={categories}
              columns={columns}
              emptyMessage="Chưa có danh mục nào"
            />
          )}
        </div>
      </div>

      {/* Add Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        title="Thêm danh mục mới"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tên danh mục *</label>
            <input
              type="text"
              value={categoryForm.tenDanhMuc}
              onChange={(e) => setCategoryForm({ ...categoryForm, tenDanhMuc: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="Nhập tên danh mục"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mô tả</label>
            <textarea
              value={categoryForm.moTa}
              onChange={(e) => setCategoryForm({ ...categoryForm, moTa: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="Nhập mô tả"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Danh mục cha</label>
            <select
              value={categoryForm.maDanhMucCha}
              onChange={(e) => setCategoryForm({ ...categoryForm, maDanhMucCha: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">-- Không có --</option>
              {categories.map((cat) => (
                <option key={cat.maDanhMuc} value={cat.maDanhMuc}>
                  {cat.tenDanhMuc}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => {
                setShowAddModal(false);
                resetForm();
              }}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleAddCategory}
              disabled={!categoryForm.tenDanhMuc}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Thêm
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedCategory(null);
          resetForm();
        }}
        title="Chỉnh sửa danh mục"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tên danh mục *</label>
            <input
              type="text"
              value={categoryForm.tenDanhMuc}
              onChange={(e) => setCategoryForm({ ...categoryForm, tenDanhMuc: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="Nhập tên danh mục"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Mô tả</label>
            <textarea
              value={categoryForm.moTa}
              onChange={(e) => setCategoryForm({ ...categoryForm, moTa: e.target.value })}
              className="w-full border rounded px-3 py-2"
              placeholder="Nhập mô tả"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Danh mục cha</label>
            <select
              value={categoryForm.maDanhMucCha}
              onChange={(e) => setCategoryForm({ ...categoryForm, maDanhMucCha: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">-- Không có --</option>
              {categories
                .filter((cat) => cat.maDanhMuc !== selectedCategory?.maDanhMuc)
                .map((cat) => (
                  <option key={cat.maDanhMuc} value={cat.maDanhMuc}>
                    {cat.tenDanhMuc}
                  </option>
                ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => {
                setShowEditModal(false);
                setSelectedCategory(null);
                resetForm();
              }}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleEditCategory}
              disabled={!categoryForm.tenDanhMuc}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cập nhật
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setCategoryToDelete(null);
        }}
        title="Xác nhận xóa"
      >
        <div className="space-y-4">
          <p>Bạn có chắc chắn muốn xóa danh mục <strong>{categoryToDelete?.tenDanhMuc}</strong>?</p>
          <p className="text-sm text-gray-500">Hành động này không thể hoàn tác.</p>

          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={() => {
                setShowDeleteConfirm(false);
                setCategoryToDelete(null);
              }}
              className="px-4 py-2 border rounded hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleDeleteCategory}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Xóa
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CategoryManagement;
