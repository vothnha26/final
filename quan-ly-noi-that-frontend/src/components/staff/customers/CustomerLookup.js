import React, { useState, useEffect } from 'react';
import { IoSearch, IoEye, IoPerson, IoCall, IoLocation, IoStar, IoCart, IoWallet } from 'react-icons/io5';
import api from '../../../api';

const CustomerLookup = () => {
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedVipLevel, setSelectedVipLevel] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [tiers, setTiers] = useState([]);

  const getVipBadge = (name, color) => {
    if (!name) return (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-700">—</span>
    );
    const bg = (color || '#f3f4f6') + '22';
    const fg = color || '#374151';
    const border = color || '#e5e7eb';
    return (
      <span
        className="inline-flex px-2 py-1 text-xs font-semibold rounded-full"
        style={{ backgroundColor: bg, color: fg, border: `1px solid ${border}` }}
      >
        {name}
      </span>
    );
  };

  const mapCustomerFromApi = (c) => ({
    id: c.maKhachHang || c.id || c.ma || c.maKhachHang,
    name: c.hoTen || c.name || c.ten || '',
    email: c.email || '',
    phone: c.soDienThoai || c.phone || '',
    address: c.diaChi || c.address || '',
    totalOrders: c.tongDonHang ?? c.tongSoDonHang ?? c.totalOrders ?? 0,
    totalSpent: c.tongChiTieu ?? c.totalSpent ?? 0,
    lastOrder: c.donHangCuoi || c.lastOrder || '',
    status: c.trangThai === false ? 'inactive' : (c.trangThai || 'active'),
    vipLevelId: c?.hangThanhVien?.maHangThanhVien ?? c?.maHangThanhVien ?? null,
    vipLevelName: c?.hangThanhVien?.tenHang ?? null,
    vipLevelColor: c?.hangThanhVien?.mauSac ?? null,
    joinDate: c.ngayThamGia || c.ngayTao || c.joinDate || ''
  });

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        const data = await api.get('/api/v1/khach-hang');
        if (Array.isArray(data)) {
          setCustomers(data.map(mapCustomerFromApi));
        } else if (data && data.content) {
          setCustomers(data.content.map(mapCustomerFromApi));
        } else {
          setCustomers([]);
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching customers:', err);
        setError('Không thể tải danh sách khách hàng');
        setCustomers([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const data = await api.get('/api/hang-thanh-vien');
        if (Array.isArray(data)) {
          setTiers(data);
        } else if (data && data.content) {
          setTiers(data.content);
        }
      } catch (err) {
        console.error('Error fetching tiers:', err);
      }
    };
    fetchTiers();
  }, []);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = 
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm);
    const matchesStatus = selectedStatus === 'all' || customer.status === selectedStatus;
    const matchesVipLevel = selectedVipLevel === 'all' || customer.vipLevelId?.toString() === selectedVipLevel;
    return matchesSearch && matchesStatus && matchesVipLevel;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch (e) {
      return dateString;
    }
  };

  const handleViewDetail = async (customer) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
    
    // Fetch customer orders
    setLoadingOrders(true);
    try {
      const orders = await api.get(`/api/v1/khach-hang/${customer.id}/don-hang`);
      const list = Array.isArray(orders) ? orders : (orders?.content ?? []);

      // Map orders to normalized shape for UI
      const mapped = list.map((o) => ({
        id: o.maDonHang ?? o.id,
        date: o.ngayDatHang ?? o.ngayDatHangStr ?? o.ngayTao ?? o.createdAt,
        status: o.trangThai ?? o.status,
        itemsCount: Array.isArray(o.chiTietDonHangList)
          ? o.chiTietDonHangList.reduce((sum, it) => sum + (it?.soLuong ?? 0), 0)
          : (o.soLuong ?? 0),
        total: o.thanhTien ?? o.tongTienGoc ?? o.total ?? 0,
      }));
      setCustomerOrders(mapped);
    } catch (err) {
      console.error('❌ Error fetching orders:', err);
      setCustomerOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔍 Tra cứu khách hàng</h1>
          <p className="text-gray-600">Tìm kiếm và xem thông tin chi tiết khách hàng</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm theo tên, email, SĐT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Ngừng hoạt động</option>
            </select>

            {/* VIP Level Filter */}
            <select
              value={selectedVipLevel}
              onChange={(e) => setSelectedVipLevel(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tất cả hạng</option>
              {tiers.map((tier) => (
                <option key={tier.maHangThanhVien} value={tier.maHangThanhVien}>
                  {tier.tenHang}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Tổng khách hàng</p>
                <p className="text-2xl font-bold text-gray-900">{customers.length}</p>
              </div>
              <IoPerson className="text-4xl text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Đang hoạt động</p>
                <p className="text-2xl font-bold text-green-600">
                  {customers.filter(c => c.status === 'active').length}
                </p>
              </div>
              <IoStar className="text-4xl text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Kết quả tìm kiếm</p>
                <p className="text-2xl font-bold text-purple-600">{filteredCustomers.length}</p>
              </div>
              <IoSearch className="text-4xl text-purple-500" />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải dữ liệu...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">{error}</div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <IoPerson className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Không tìm thấy khách hàng nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Khách hàng
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Liên hệ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hạng thành viên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tổng đơn
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tổng chi tiêu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Thao tác
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                              {customer.name.charAt(0).toUpperCase()}
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                            <div className="text-sm text-gray-500">ID: {customer.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 flex items-center gap-1">
                          <IoCall className="text-gray-400" />
                          {customer.phone}
                        </div>
                        <div className="text-sm text-gray-500">{customer.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getVipBadge(customer.vipLevelName, customer.vipLevelColor)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-gray-900">
                          <IoCart className="text-blue-500" />
                          {customer.totalOrders}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                          <IoWallet className="text-green-500" />
                          {formatCurrency(customer.totalSpent)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          customer.status === 'active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {customer.status === 'active' ? 'Hoạt động' : 'Ngừng hoạt động'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleViewDetail(customer)}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                          <IoEye />
                          Xem chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Chi tiết khách hàng</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Avatar & Name */}
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-3xl">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{selectedCustomer.name}</h3>
                  <p className="text-gray-600">ID: {selectedCustomer.id}</p>
                  {getVipBadge(selectedCustomer.vipLevelName, selectedCustomer.vipLevelColor)}
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-700 mb-1">
                    <IoCall className="text-blue-500" />
                    <span className="font-semibold">Số điện thoại</span>
                  </div>
                  <p className="text-gray-900 ml-6">{selectedCustomer.phone}</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-700 mb-1">
                    <span className="font-semibold">📧 Email</span>
                  </div>
                  <p className="text-gray-900 ml-6">{selectedCustomer.email}</p>
                </div>
              </div>

              {/* Address */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-700 mb-1">
                  <IoLocation className="text-red-500" />
                  <span className="font-semibold">Địa chỉ</span>
                </div>
                <p className="text-gray-900 ml-6">{selectedCustomer.address || 'Chưa cập nhật'}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <IoCart className="text-3xl text-blue-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">Tổng đơn hàng</p>
                  <p className="text-2xl font-bold text-blue-600">{selectedCustomer.totalOrders}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <IoWallet className="text-3xl text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">Tổng chi tiêu</p>
                  <p className="text-xl font-bold text-green-600">{formatCurrency(selectedCustomer.totalSpent)}</p>
                </div>
              </div>

              {/* Additional Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Ngày tham gia</p>
                  <p className="text-gray-900 font-medium">{formatDate(selectedCustomer.joinDate)}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Đơn hàng cuối</p>
                  <p className="text-gray-900 font-medium">{formatDate(selectedCustomer.lastOrder)}</p>
                </div>
              </div>

              {/* Status */}
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-1">Trạng thái</p>
                <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${
                  selectedCustomer.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {selectedCustomer.status === 'active' ? '✓ Đang hoạt động' : '✗ Ngừng hoạt động'}
                </span>
              </div>

              {/* Order History */}
              <div className="border-t border-gray-200 pt-4">
                <h4 className="font-bold text-lg text-gray-900 mb-3">📦 Lịch sử đơn hàng</h4>
                {loadingOrders ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Đang tải đơn hàng...</p>
                  </div>
                ) : customerOrders.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Chưa có đơn hàng nào</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {customerOrders.map((order, idx) => (
                      <div key={order.id || idx} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold text-gray-900">
                              #{order.id}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatDate(order.date)}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            ['HOAN_THANH','COMPLETED'].includes(order.status)
                              ? 'bg-green-100 text-green-800'
                              : ['DA_HUY','HUY','CANCELLED'].includes(order.status)
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status || 'Đang xử lý'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            {order.itemsCount || 0} sản phẩm
                          </span>
                          <span className="font-bold text-blue-600">
                            {formatCurrency(order.total || 0)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setCustomerOrders([]);
                }}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerLookup;
