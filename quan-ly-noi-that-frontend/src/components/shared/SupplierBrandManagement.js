import React, { useState, useEffect } from 'react';
import { IoAdd, IoSearch, IoCreate, IoTrash, IoSave, IoClose, IoBusiness, IoCall, IoMail, IoLocation } from 'react-icons/io5';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';
import api from '../api';

// Mapping functions for Vietnamese API field names
const mapSupplierFromApi = (supplier) => ({
  maNhaCungCap: supplier.ma_nha_cung_cap || supplier.id,
  tenNhaCungCap: supplier.ten_nha_cung_cap,
  diaChi: supplier.dia_chi,
  soDienThoai: supplier.so_dien_thoai,
  email: supplier.email,
  website: supplier.website,
  soLuongSanPham: supplier.so_luong_san_pham || 0,
  trangThai: supplier.trang_thai || 'active',
  ngayTao: supplier.ngay_tao,
  ghiChu: supplier.ghi_chu
});

const mapSupplierToApi = (supplier) => ({
  ten_nha_cung_cap: supplier.tenNhaCungCap,
  dia_chi: supplier.diaChi,
  so_dien_thoai: supplier.soDienThoai,
  email: supplier.email,
  website: supplier.website,
  trang_thai: supplier.trangThai,
  ghi_chu: supplier.ghiChu
});

const mapBrandFromApi = (brand) => ({
  maThuongHieu: brand.ma_thuong_hieu || brand.id,
  tenThuongHieu: brand.ten_thuong_hieu,
  moTa: brand.mo_ta,
  logo: brand.logo,
  website: brand.website,
  xuatXu: brand.xuat_xu,
  soLuongSanPham: brand.so_luong_san_pham || 0,
  trangThai: brand.trang_thai || 'active',
  ngayTao: brand.ngay_tao
});

const mapBrandToApi = (brand) => ({
  ten_thuong_hieu: brand.tenThuongHieu,
  mo_ta: brand.moTa,
  logo: brand.logo,
  website: brand.website,
  xuat_xu: brand.xuatXu,
  trang_thai: brand.trangThai
});

const SupplierBrandManagement = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // API Functions
  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/suppliers');
      setSuppliers(response.data.map(mapSupplierFromApi));
    } catch (error) {
      setError('Không thể tải danh sách nhà cung cấp');
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await api.get('/api/suppliers');
      setBrands(response.data.map(mapBrandFromApi));
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const createSupplier = async (supplierData) => {
    try {
      const response = await api.post('/api/suppliers', mapSupplierToApi(supplierData));
      return mapSupplierFromApi(response.data);
    } catch (error) {
      throw new Error('Không thể tạo nhà cung cấp');
    }
  };

  const updateSupplier = async (id, supplierData) => {
    try {
      const response = await api.put(`/api/suppliers/${id}`, mapSupplierToApi(supplierData));
      return mapSupplierFromApi(response.data);
    } catch (error) {
      throw new Error('Không thể cập nhật nhà cung cấp');
    }
  };

  const deleteSupplier = async (id) => {
    try {
      await api.delete(`/api/suppliers/${id}`);
    } catch (error) {
      throw new Error('Không thể xóa nhà cung cấp');
    }
  };

  const createBrand = async (brandData) => {
    try {
      // TODO: Backend chưa có endpoint cho brands
      // const response = await api.post('/api/brands', mapBrandToApi(brandData));
      // return mapBrandFromApi(response.data);
      throw new Error('API brands chưa được triển khai');
    } catch (error) {
      throw new Error('Không thể tạo thương hiệu');
    }
  };

  const updateBrand = async (id, brandData) => {
    try {
      const response = await api.put(`/api/v1/thuong-hieu/${id}`, mapBrandToApi(brandData));
      return mapBrandFromApi(response.data);
    } catch (error) {
      throw new Error('Không thể cập nhật thương hiệu');
    }
  };

  const deleteBrand = async (id) => {
    try {
      await api.delete(`/api/v1/thuong-hieu/${id}`);
    } catch (error) {
      throw new Error('Không thể xóa thương hiệu');
    }
  };

  useEffect(() => {
    fetchSuppliers();
    fetchBrands();
  }, []);

  const [mockSuppliers] = useState([
    {
      maNhaCungCap: 1,
      tenNhaCungCap: 'IKEA Vietnam',
      diaChi: '123 Đường Nguyễn Văn Linh, Quận 7, TP.HCM',
      soDienThoai: '028-1234-5678',
      email: 'contact@ikea.vn',
      website: 'https://ikea.vn',
      soLuongSanPham: 45,
      trangThai: 'active'
    },
    {
      maNhaCungCap: 2,
      tenNhaCungCap: 'Hòa Phát Home',
      diaChi: '456 Đường Lê Văn Việt, Quận 9, TP.HCM',
      soDienThoai: '028-2345-6789',
      email: 'info@hoaphat.com.vn',
      website: 'https://hoaphat.com.vn',
      soLuongSanPham: 32,
      trangThai: 'active'
    },
    {
      maNhaCungCap: 3,
      tenNhaCungCap: 'An Cường Wood',
      diaChi: '789 Đường Võ Văn Kiệt, Quận 5, TP.HCM',
      soDienThoai: '028-3456-7890',
      email: 'sales@ancuong.vn',
      website: 'https://ancuong.vn',
      soLuongSanPham: 28,
      trangThai: 'active'
    },
    {
      maNhaCungCap: 4,
      tenNhaCungCap: 'Nitori Vietnam',
      diaChi: '321 Đường Nguyễn Thị Minh Khai, Quận 1, TP.HCM',
      soDienThoai: '028-4567-8901',
      email: 'contact@nitori.vn',
      website: 'https://nitori.vn',
      soLuongSanPham: 18,
      trangThai: 'inactive'
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const [formData, setFormData] = useState({
    tenNhaCungCap: '',
    diaChi: '',
    soDienThoai: '',
    email: '',
    website: '',
    trangThai: 'active'
  });

  // Filter suppliers
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.tenNhaCungCap.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || supplier.trangThai === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.tenNhaCungCap.trim()) {
      showToast('Vui lòng nhập tên nhà cung cấp', 'error');
      return;
    }

    // Check if supplier name already exists
    const exists = suppliers.some(supplier => 
      supplier.tenNhaCungCap.toLowerCase() === formData.tenNhaCungCap.toLowerCase() &&
      supplier.maNhaCungCap !== editingSupplier?.maNhaCungCap
    );

    if (exists) {
      showToast('Tên nhà cung cấp đã tồn tại', 'error');
      return;
    }

    if (editingSupplier) {
      // Update existing supplier
      setSuppliers(suppliers.map(supplier =>
        supplier.maNhaCungCap === editingSupplier.maNhaCungCap
          ? { 
              ...supplier, 
              ...formData,
              soLuongSanPham: supplier.soLuongSanPham // Keep existing product count
            }
          : supplier
      ));
      showToast('Cập nhật nhà cung cấp thành công');
    } else {
      // Add new supplier
      const newSupplier = {
        maNhaCungCap: Math.max(...suppliers.map(s => s.maNhaCungCap), 0) + 1,
        ...formData,
        soLuongSanPham: 0
      };
      setSuppliers([...suppliers, newSupplier]);
      showToast('Thêm nhà cung cấp thành công');
    }

    closeModal();
  };

  const openModal = (supplier = null) => {
    setEditingSupplier(supplier);
    setFormData({
      tenNhaCungCap: supplier ? supplier.tenNhaCungCap : '',
      diaChi: supplier ? supplier.diaChi : '',
      soDienThoai: supplier ? supplier.soDienThoai : '',
      email: supplier ? supplier.email : '',
      website: supplier ? supplier.website : '',
      trangThai: supplier ? supplier.trangThai : 'active'
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSupplier(null);
    setFormData({
      tenNhaCungCap: '',
      diaChi: '',
      soDienThoai: '',
      email: '',
      website: '',
      trangThai: 'active'
    });
  };

  const handleDelete = (id) => {
    const supplier = suppliers.find(s => s.maNhaCungCap === id);
    if (supplier && supplier.soLuongSanPham > 0) {
      showToast('Không thể xóa nhà cung cấp có sản phẩm. Vui lòng di chuyển sản phẩm trước khi xóa.', 'error');
      return;
    }
    setDeleteId(id);
    setShowConfirmDialog(true);
  };

  const confirmDelete = () => {
    setSuppliers(suppliers.filter(supplier => supplier.maNhaCungCap !== deleteId));
    setShowConfirmDialog(false);
    setDeleteId(null);
    showToast('Xóa nhà cung cấp thành công');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Hoạt động</span>;
      case 'inactive':
        return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Tạm dừng</span>;
      default:
        return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Không rõ</span>;
    }
  };

  const toggleSupplierStatus = (id) => {
    setSuppliers(suppliers.map(supplier =>
      supplier.maNhaCungCap === id
        ? { ...supplier, trangThai: supplier.trangThai === 'active' ? 'inactive' : 'active' }
        : supplier
    ));
    showToast('Cập nhật trạng thái nhà cung cấp thành công');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý Nhà cung cấp & Thương hiệu</h1>
              <p className="text-gray-600 mt-1">Quản lý thông tin các nhà cung cấp và thương hiệu sản phẩm</p>
            </div>
            
            <button
              onClick={() => openModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <IoAdd className="text-lg" />
              Thêm nhà cung cấp
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm nhà cung cấp..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Tạm dừng</option>
            </select>
          </div>
        </div>

        {/* Suppliers Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Danh sách nhà cung cấp ({filteredSuppliers.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nhà cung cấp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thông tin liên hệ
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sản phẩm
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredSuppliers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <IoSearch className="text-4xl text-gray-400 mb-2" />
                        <p>Không tìm thấy nhà cung cấp nào</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <tr key={supplier.maNhaCungCap} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <IoBusiness className="text-blue-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {supplier.tenNhaCungCap}
                            </div>
                            <div className="text-sm text-gray-500">
                              ID: #{supplier.maNhaCungCap}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          {supplier.diaChi && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <IoLocation className="text-xs" />
                              <span className="truncate max-w-xs">{supplier.diaChi}</span>
                            </div>
                          )}
                          {supplier.soDienThoai && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <IoCall className="text-xs" />
                              <span>{supplier.soDienThoai}</span>
                            </div>
                          )}
                          {supplier.email && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <IoMail className="text-xs" />
                              <span className="truncate max-w-xs">{supplier.email}</span>
                            </div>
                          )}
                          {supplier.website && (
                            <div className="text-sm">
                              <a 
                                href={supplier.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 truncate max-w-xs inline-block"
                              >
                                {supplier.website}
                              </a>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm font-semibold text-gray-900">
                          {supplier.soLuongSanPham}
                        </div>
                        <div className="text-xs text-gray-500">sản phẩm</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => toggleSupplierStatus(supplier.maNhaCungCap)}
                          className="cursor-pointer"
                        >
                          {getStatusBadge(supplier.trangThai)}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openModal(supplier)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded transition-colors"
                            title="Chỉnh sửa"
                          >
                            <IoCreate className="text-lg" />
                          </button>
                          <button
                            onClick={() => handleDelete(supplier.maNhaCungCap)}
                            className={`p-1 rounded transition-colors ${
                              supplier.soLuongSanPham > 0
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-red-600 hover:text-red-900'
                            }`}
                            disabled={supplier.soLuongSanPham > 0}
                            title={supplier.soLuongSanPham > 0 ? 'Không thể xóa nhà cung cấp có sản phẩm' : 'Xóa'}
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

        {/* Summary Stats */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê nhà cung cấp</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{suppliers.length}</div>
              <div className="text-sm text-blue-600">Tổng nhà cung cấp</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {suppliers.filter(s => s.trangThai === 'active').length}
              </div>
              <div className="text-sm text-green-600">Đang hoạt động</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {suppliers.filter(s => s.trangThai === 'inactive').length}
              </div>
              <div className="text-sm text-yellow-600">Tạm dừng</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {suppliers.reduce((total, supplier) => total + supplier.soLuongSanPham, 0)}
              </div>
              <div className="text-sm text-purple-600">Tổng sản phẩm</div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={closeModal} title={editingSupplier ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="tenNhaCungCap" className="block text-sm font-medium text-gray-700 mb-1">
              Tên nhà cung cấp *
            </label>
            <input
              type="text"
              id="tenNhaCungCap"
              value={formData.tenNhaCungCap}
              onChange={(e) => setFormData({ ...formData, tenNhaCungCap: e.target.value })}
              placeholder="Ví dụ: IKEA Vietnam, Hòa Phát Home..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="diaChi" className="block text-sm font-medium text-gray-700 mb-1">
              Địa chỉ
            </label>
            <textarea
              id="diaChi"
              value={formData.diaChi}
              onChange={(e) => setFormData({ ...formData, diaChi: e.target.value })}
              placeholder="Địa chỉ chi tiết của nhà cung cấp"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="soDienThoai" className="block text-sm font-medium text-gray-700 mb-1">
                Số điện thoại
              </label>
              <input
                type="tel"
                id="soDienThoai"
                value={formData.soDienThoai}
                onChange={(e) => setFormData({ ...formData, soDienThoai: e.target.value })}
                placeholder="028-1234-5678"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="contact@supplier.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="url"
              id="website"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              placeholder="https://supplier.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="trangThai" className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              id="trangThai"
              value={formData.trangThai}
              onChange={(e) => setFormData({ ...formData, trangThai: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">Hoạt động</option>
              <option value="inactive">Tạm dừng</option>
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
              {editingSupplier ? 'Cập nhật' : 'Thêm mới'}
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
        message="Bạn có chắc chắn muốn xóa nhà cung cấp này? Hành động này không thể hoàn tác."
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

export default SupplierBrandManagement;


