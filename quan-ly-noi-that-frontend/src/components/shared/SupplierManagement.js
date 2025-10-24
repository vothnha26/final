import React, { useState, useEffect } from 'react';
import { IoBusiness, IoAdd, IoCreate, IoTrash, IoEye, IoCall, IoMail, IoLocation, IoTime, IoRefresh } from 'react-icons/io5';
import api from '../../api';

const SupplierManagement = () => {
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Map supplier data from API
  const mapSupplierFromApi = (supplier) => ({
    id: supplier.maNhaCungCap || supplier.id,
    name: supplier.tenNhaCungCap || supplier.name,
    contactPerson: supplier.nguoiLienHe || supplier.contactPerson,
    phone: supplier.soDienThoai || supplier.phone,
    email: supplier.email || supplier.email,
    address: supplier.diaChi || supplier.address,
    category: supplier.loaiHang || supplier.category,
    rating: supplier.danhGia || supplier.rating || 0,
    notes: supplier.ghiChu || supplier.notes || '',
    status: supplier.trangThai || supplier.active || true,
    createdAt: supplier.ngayTao || supplier.createdAt || '',
    productCount: supplier.soLuongSanPham || supplier.productCount || 0,
    lastOrderDate: supplier.ngayDatHangCuoi || supplier.lastOrderDate || ''
  });

  const mapSupplierToApi = (supplier) => ({
    tenNhaCungCap: supplier.name,
    nguoiLienHe: supplier.contactPerson,
    soDienThoai: supplier.phone,
    email: supplier.email,
    diaChi: supplier.address,
    loaiHang: supplier.category,
    danhGia: supplier.rating,
    ghiChu: supplier.notes,
    trangThai: supplier.status
  });

  // Fetch suppliers
  useEffect(() => {
    const fetchSuppliers = async () => {
      setIsLoading(true);
      try {
        const data = await api.get('/api/suppliers'); // Fixed: aligned with backend controller
        if (Array.isArray(data)) {
          setSuppliers(data.map(mapSupplierFromApi));
        }
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSuppliers();
  }, []);

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    category: '',
    rating: 0,
    notes: ''
  });

  const [suppliers, setSuppliers] = useState([
    {
      id: 'SUP001',
      name: 'Công ty Nội thất ABC',
      contactPerson: 'Nguyễn Văn A',
      phone: '0901234567',
      email: 'contact@abc.com',
      address: '123 Đường ABC, Quận 1, TP.HCM',
      status: 'active',
      rating: 4.5,
      totalOrders: 25,
      totalValue: 150000000,
      lastOrder: '2024-01-15',
      paymentTerms: '30 ngày',
      deliveryTime: '3-5 ngày',
      notes: 'Nhà cung cấp uy tín, giao hàng đúng hẹn',
      createdBy: 'Bảo',
      createdAt: '2024-01-01'
    },
    {
      id: 'SUP002',
      name: 'Xưởng sản xuất XYZ',
      contactPerson: 'Trần Thị B',
      phone: '0912345678',
      email: 'info@xyz.com',
      address: '456 Đường XYZ, Quận 2, TP.HCM',
      status: 'active',
      rating: 4.2,
      totalOrders: 18,
      totalValue: 95000000,
      lastOrder: '2024-01-12',
      paymentTerms: '15 ngày',
      deliveryTime: '2-3 ngày',
      notes: 'Chuyên sản xuất ghế gỗ cao cấp',
      createdBy: 'Bảo',
      createdAt: '2024-01-05'
    },
    {
      id: 'SUP003',
      name: 'Nhà cung cấp DEF',
      contactPerson: 'Lê Văn C',
      phone: '0923456789',
      email: 'sales@def.com',
      address: '789 Đường DEF, Quận 3, TP.HCM',
      status: 'inactive',
      rating: 3.8,
      totalOrders: 8,
      totalValue: 45000000,
      lastOrder: '2023-12-20',
      paymentTerms: '45 ngày',
      deliveryTime: '5-7 ngày',
      notes: 'Tạm ngừng hợp tác do chất lượng không ổn định',
      createdBy: 'Bảo',
      createdAt: '2023-11-15'
    }
  ]);

  const [products] = useState([
    {
      id: 'PROD001',
      name: 'Ghế gỗ cao cấp',
      supplier: 'SUP001',
      price: 2500000,
      quantity: 50,
      lastDelivery: '2024-01-15'
    },
    {
      id: 'PROD002',
      name: 'Bàn ăn 6 người',
      supplier: 'SUP002',
      price: 3500000,
      quantity: 25,
      lastDelivery: '2024-01-12'
    }
  ]);

  const statusConfig = {
    active: { color: 'text-green-600', bg: 'bg-green-100', label: 'Hoạt động' },
    inactive: { color: 'text-red-600', bg: 'bg-red-100', label: 'Ngừng hoạt động' },
    pending: { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Chờ duyệt' }
  };

  const getStatusInfo = (status) => {
    return statusConfig[status] || statusConfig.pending;
  };

  const handleViewSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setShowSupplierModal(true);
  };

  const handleAddSupplier = () => {
    setShowAddModal(true);
  };

  const handleSaveSupplier = () => {
    setShowAddModal(false);
    setNewSupplier({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      category: '',
      rating: 0,
      notes: ''
    });
  };

  const handleEditSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setShowSupplierModal(true);
  };

  const handleDeleteSupplier = (supplier) => {
    if (window.confirm(`Bạn có chắc muốn xóa nhà cung cấp ${supplier.name}?`)) {

    }
  };

  const getSupplierProducts = (supplierId) => {
    return products.filter(product => product.supplier === supplierId);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý nhà cung cấp</h1>
          <p className="text-gray-600">Quản lý thông tin nhà cung cấp và đối tác</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <IoBusiness className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng nhà cung cấp</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <IoTime className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Đang hoạt động</p>
                <p className="text-2xl font-bold text-gray-900">2</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <IoBusiness className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng đơn hàng</p>
                <p className="text-2xl font-bold text-gray-900">51</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <IoBusiness className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng giá trị</p>
                <p className="text-2xl font-bold text-gray-900">290M</p>
              </div>
            </div>
          </div>
        </div>

        {/* Suppliers List */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Danh sách nhà cung cấp</h3>
            <div className="flex items-center space-x-2">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <IoRefresh className="w-4 h-4" />
                Làm mới
              </button>
              <button
                onClick={handleAddSupplier}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                <IoAdd className="w-4 h-4" />
                Thêm nhà cung cấp
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nhà cung cấp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Liên hệ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đánh giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đơn hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {suppliers.map((supplier) => {
                  const statusInfo = getStatusInfo(supplier.status);

                  return (
                    <tr key={supplier.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{supplier.name}</div>
                        <div className="text-sm text-gray-500">{supplier.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{supplier.contactPerson}</div>
                        <div className="text-sm text-gray-500">{supplier.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">{supplier.rating}</span>
                          <span className="text-sm text-gray-500 ml-1">/5</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{supplier.totalOrders} đơn</div>
                        <div className="text-sm text-gray-500">{formatCurrency(supplier.totalValue)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewSupplier(supplier)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <IoEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditSupplier(supplier)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <IoCreate className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(supplier)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <IoTrash className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Supplier Detail Modal */}
        {showSupplierModal && selectedSupplier && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Chi tiết nhà cung cấp
                  </h3>
                  <button
                    onClick={() => setShowSupplierModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <IoRefresh className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Supplier Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Thông tin cơ bản</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Tên công ty:</span>
                          <span className="text-sm font-medium">{selectedSupplier.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Mã nhà cung cấp:</span>
                          <span className="text-sm font-medium">{selectedSupplier.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Người liên hệ:</span>
                          <span className="text-sm font-medium">{selectedSupplier.contactPerson}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Điện thoại:</span>
                          <span className="text-sm font-medium">{selectedSupplier.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Email:</span>
                          <span className="text-sm font-medium">{selectedSupplier.email}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Thông tin kinh doanh</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Đánh giá:</span>
                          <span className="text-sm font-medium">{selectedSupplier.rating}/5</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Tổng đơn hàng:</span>
                          <span className="text-sm font-medium">{selectedSupplier.totalOrders}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Tổng giá trị:</span>
                          <span className="text-sm font-medium">{formatCurrency(selectedSupplier.totalValue)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Đơn hàng cuối:</span>
                          <span className="text-sm font-medium">{selectedSupplier.lastOrder}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Trạng thái:</span>
                          <span className={`text-sm font-medium ${getStatusInfo(selectedSupplier.status).color}`}>
                            {getStatusInfo(selectedSupplier.status).label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address and Terms */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Địa chỉ</h4>
                      <div className="flex items-start gap-2">
                        <IoLocation className="w-4 h-4 text-gray-500 mt-1" />
                        <span className="text-sm text-gray-900">{selectedSupplier.address}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Điều khoản</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Thanh toán:</span>
                          <span className="text-sm font-medium">{selectedSupplier.paymentTerms}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Giao hàng:</span>
                          <span className="text-sm font-medium">{selectedSupplier.deliveryTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Ghi chú</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm text-gray-700">{selectedSupplier.notes}</p>
                    </div>
                  </div>

                  {/* Products */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Sản phẩm cung cấp</h4>
                    <div className="space-y-2">
                      {getSupplierProducts(selectedSupplier.id).map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <span className="text-sm font-medium text-gray-900">{product.name}</span>
                            <div className="text-sm text-gray-500">
                              {formatCurrency(product.price)} • {product.quantity} sản phẩm
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            Giao cuối: {product.lastDelivery}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => setShowSupplierModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Đóng
                    </button>
                    <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                      Chỉnh sửa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Supplier Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Thêm nhà cung cấp mới
                  </h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <IoRefresh className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleSaveSupplier(); }}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên nhà cung cấp</label>
                        <input
                          type="text"
                          value={newSupplier.name}
                          onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Nhập tên nhà cung cấp"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Người liên hệ</label>
                        <input
                          type="text"
                          value={newSupplier.contactPerson}
                          onChange={(e) => setNewSupplier({ ...newSupplier, contactPerson: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Nhập tên người liên hệ"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                        <input
                          type="tel"
                          value={newSupplier.phone}
                          onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Nhập số điện thoại"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={newSupplier.email}
                          onChange={(e) => setNewSupplier({ ...newSupplier, email: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Nhập email"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                      <textarea
                        value={newSupplier.address}
                        onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        rows="3"
                        placeholder="Nhập địa chỉ đầy đủ"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                        <select
                          value={newSupplier.category}
                          onChange={(e) => setNewSupplier({ ...newSupplier, category: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        >
                          <option value="">Chọn danh mục</option>
                          <option value="furniture">Nội thất</option>
                          <option value="materials">Vật liệu</option>
                          <option value="tools">Dụng cụ</option>
                          <option value="services">Dịch vụ</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Đánh giá (1-5)</label>
                        <input
                          type="number"
                          value={newSupplier.rating}
                          onChange={(e) => setNewSupplier({ ...newSupplier, rating: parseInt(e.target.value) })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          min="1"
                          max="5"
                          placeholder="1-5"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                      <textarea
                        value={newSupplier.notes}
                        onChange={(e) => setNewSupplier({ ...newSupplier, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        rows="3"
                        placeholder="Nhập ghi chú bổ sung..."
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                    >
                      Thêm nhà cung cấp
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupplierManagement;



