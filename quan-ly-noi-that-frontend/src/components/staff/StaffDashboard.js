import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import { IoPerson, IoStorefront, IoReceipt, IoChatbubbles, IoNotifications, IoTrendingUp } from 'react-icons/io5';

// Final cleaned StaffDashboard component
const StaffDashboard = () => {
  const [timeRange, setTimeRange] = useState('today');
  const [currentStats, setCurrentStats] = useState({ orders: 0, revenue: 0, customers: 0, products: 0, growth: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [notifications, setNotifications] = useState([]);
  // debugLogs removed per request

  useEffect(() => {
    const mapBackendStatus = (s) => {
      if (!s) return '';
      const key = String(s).toLowerCase();
      // map common backend statuses to our UI keys
      if (key.includes('hoan') || key.includes('hoan_thanh') || key === 'hoan_thanh') return 'delivered';
      if ((key.includes('dang') && key.includes('xu')) || key === 'dang_xu_ly') return 'processing';
      if ((key.includes('dang') && key.includes('giao')) || key === 'dang_giao') return 'shipping';
      if (key.includes('huy') || key.includes('huy_bo')) return 'cancelled';
      return key; // fallback: return original-ish value
    };

    const normalizeOrders = (orders) => {
      if (!Array.isArray(orders)) return [];
      return orders.map((o, i) => ({
        id: o.id ?? o.orderNumber ?? `#${i}`,
        orderNumber: o.orderNumber ?? (o.id ? `DH${o.id}` : ''),
        customer: o.customerName ?? o.customer ?? o.tenKhachHang ?? '',
        amount: o.amount ?? o.thanhTien ?? o.tongTien ?? o.tongTienSauGiam ?? 0,
        status: mapBackendStatus(o.status),
        rawStatus: o.status,
        time: o.createdAt ? (new Date(o.createdAt)).toLocaleString('vi-VN') : (o.time || o.createdAt || ''),
      }));
    };

    const fetchDashboard = async () => {
      try {
        // Admin UI dashboard route disabled/removed — skip this request to avoid 404 noise

        // 2) Try consolidated backend endpoint
        try {
          const res = await api.get('/api/v1/dashboard/staff');
          const data = res?.data ?? res;
          const parsed = !!data && typeof data === 'object';
          if (parsed) {
            const payload = data.data ? data.data : data;
            setCurrentStats({ orders: payload.ordersCount || 0, revenue: payload.revenue || 0, customers: payload.customersCount || 0, products: payload.productsCount || 0, growth: payload.growth || 0 });
            setRecentOrders(normalizeOrders(payload.recentOrders));
            setNotifications(Array.isArray(payload.lowStockAlerts) ? payload.lowStockAlerts.map((p, i) => ({ id: p.variantId || p.maBienThe || i, type: 'inventory', message: `${p.productName || p.tenSanPham || p.sku || p.ten || ''} sắp hết hàng`, priority: 'high' })) : []);
            return;
          }
        } catch (e) { /* error captured silently */ }

        // 3) Legacy endpoints fallback
        const [ordersRes, customersRes, productsRes] = await Promise.all([
          api.get('/api/banhang/donhang').catch(e => e),
          api.get('/api/khach-hang').catch(e => e),
          api.get('/api/san-pham').catch(e => e)
        ]);

        const ordersData = (ordersRes && ordersRes.data) ? ordersRes.data : [];
        const customersData = (customersRes && customersRes.data) ? customersRes.data : [];
        const productsData = (productsRes && productsRes.data) ? productsRes.data : [];

        let lowStockData = [];
        try { const lowRes = await api.get('/api/v1/quan-ly-ton-kho/san-pham-sap-het').catch(e => e); lowStockData = (lowRes && lowRes.data) ? lowRes.data : []; } catch (e) { lowStockData = []; }

        const revenue = Array.isArray(ordersData) ? ordersData.reduce((s, o) => s + (o.thanhTien || o.tongTien || o.tongTienSauGiam || 0), 0) : 0;
        setCurrentStats({ orders: Array.isArray(ordersData) ? ordersData.length : 0, revenue, customers: Array.isArray(customersData) ? customersData.length : 0, products: Array.isArray(productsData) ? productsData.length : 0, growth: 0 });
        setRecentOrders(Array.isArray(ordersData) ? ordersData.slice(0, 5) : []);
        setNotifications(Array.isArray(lowStockData) ? lowStockData.map((p, i) => ({ id: i, type: 'inventory', message: `${p.tenSanPham || p.ten || p.maBienThe} sắp hết hàng`, priority: 'high' })) : []);
      } catch (err) {
        // error captured silently
      }
    };

    fetchDashboard();
  }, [timeRange]);

  const formatPrice = (price) => {
    try {
      const formatted = new Intl.NumberFormat('vi-VN').format(price || 0);
      return `${formatted} ₫`; // Định dạng X.XXX.XXX ₫
    } catch (e) {
      return (price || 0).toString();
    }
  };
  const getStatusColor = (status) => ({ processing: 'text-blue-600 bg-blue-100', shipping: 'text-yellow-600 bg-yellow-100', delivered: 'text-green-600 bg-green-100' }[status] || 'text-gray-600 bg-gray-100');
  const getStatusLabel = (status) => ({ processing: 'Đang xử lý', shipping: 'Đang giao hàng', delivered: 'Đã giao hàng' }[status] || status || '');
  const getNotificationIcon = (type) => ({ order: IoReceipt, inventory: IoStorefront, customer: IoPerson }[type] || IoNotifications);
  const getPriorityColor = (priority) => ({ high: 'text-red-600', medium: 'text-yellow-600', low: 'text-gray-600' }[priority] || 'text-gray-600');
  const openInventoryWithImport = () => { try { localStorage.setItem('openImportModal', '1'); } catch (e) { } window.location.href = '/staff/inventory'; };

  const navigate = useNavigate();

  const isExternalUrl = (u) => {
    if (!u) return false;
    return /^https?:\/\//i.test(u) || u.startsWith('//');
  };

  const handleNotificationClick = (url) => {
    try {
      if (!url) return;
      if (isExternalUrl(url)) {
        window.open(url, '_blank', 'noopener');
        return;
      }
      const path = url.startsWith('/') ? url : `/${url}`;
      navigate(path);
    } catch (e) {
      
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Nhân viên</h1>
            <p className="text-gray-600">Tổng quan hoạt động kinh doanh</p>
          </div>
          <div className="flex items-center gap-4">
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg">
              <option value="today">Hôm nay</option>
              <option value="week">Tuần này</option>
              <option value="month">Tháng này</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* CARD: Đơn hàng (Lỗi JSX xảy ra ở đây) */}
          <div className="bg-white rounded-lg shadow-sm p-6 min-w-[220px] mx-auto">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg"><IoReceipt className="w-6 h-6 text-blue-600" /></div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Đơn hàng</p>
                <p className="text-3xl font-bold text-gray-900 break-words max-w-full whitespace-normal">{currentStats.orders.toLocaleString?.('vi-VN') || currentStats.orders}</p>
                <div className="flex items-center text-sm text-green-600"><IoTrendingUp className="w-4 h-4 mr-1" />+{currentStats.growth}%</div>
              </div>
            </div>
          </div> {/* <--- THẺ ĐÓNG BỊ THIẾU ĐÃ ĐƯỢC THÊM VÀO ĐÂY */}

          {/* CARD: Doanh thu */}
          <div className="bg-white rounded-lg shadow-sm p-6 min-w-[220px] mx-auto">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg"><IoTrendingUp className="w-6 h-6 text-green-600" /></div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Doanh thu</p>
                <p className="text-2xl font-bold text-gray-900 break-words max-w-full whitespace-normal">{formatPrice(currentStats.revenue || 0)}</p>
                <div className="flex items-center text-sm text-green-600"><IoTrendingUp className="w-4 h-4 mr-1" />+{currentStats.growth}%</div>
              </div>
            </div>
          </div>

          {/* CARD: Khách hàng */}
          <div className="bg-white rounded-lg shadow-sm p-6 min-w-[220px] mx-auto">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg"><IoPerson className="w-6 h-6 text-purple-600" /></div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Khách hàng</p>
                <p className="text-2xl font-bold text-gray-900 break-words max-w-full whitespace-normal">{currentStats.customers.toLocaleString?.('vi-VN') || currentStats.customers}</p>
                <div className="flex items-center text-sm text-green-600"><IoTrendingUp className="w-4 h-4 mr-1" />+{currentStats.growth}%</div>
              </div>
            </div>
          </div>

          {/* CARD: Sản phẩm */}
          <div className="bg-white rounded-lg shadow-sm p-6 min-w-[220px] mx-auto">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg"><IoStorefront className="w-6 h-6 text-orange-600" /></div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sản phẩm</p>
                <p className="text-2xl font-bold text-gray-900 break-words max-w-full whitespace-normal">{currentStats.products.toLocaleString?.('vi-VN') || currentStats.products}</p>
                <div className="flex items-center text-sm text-green-600"><IoTrendingUp className="w-4 h-4 mr-1" />+{currentStats.growth}%</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Đơn hàng gần đây</h3>
                <button
                  onClick={() => navigate('/staff/orders')}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 rounded-lg transition-colors"
                >
                  Xem tất cả
                </button>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentOrders.length > 0 ? recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center"><IoReceipt className="w-6 h-6 text-white" /></div>
                        <div>
                          <p className="font-semibold text-gray-900">#{order.id}</p>
                          <p className="text-sm text-gray-600">{order.customer || 'Khách lẻ'}</p>
                          <p className="text-xs text-gray-500 mt-1">{order.time}</p>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className="font-semibold text-gray-900 text-lg">{formatPrice(order.amount)}</p>
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                        <button
                          onClick={() => navigate(`/staff/orders/${order.id}`)}
                          className="px-4 py-2 text-sm font-medium text-primary border border-primary hover:bg-primary hover:text-white rounded-lg transition-colors"
                        >
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  )) : (
                    <div className="text-center py-8 text-gray-500">
                      <IoReceipt className="w-16 h-16 mx-auto mb-2 text-gray-300" />
                      <p>Chưa có đơn hàng nào</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200"><h3 className="text-lg font-semibold text-gray-900">Thông báo</h3></div>
              <div className="p-6">
                <div className="space-y-4">
                  {notifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    return (
                      <div key={notification.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="p-2 bg-primary rounded-full"><Icon className="w-4 h-4 text-white" /></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{notification.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500">{notification.time}</span>
                            <span className={`text-xs font-medium ${getPriorityColor(notification.priority)}`}>{notification.priority === 'high' ? 'Cao' : notification.priority === 'medium' ? 'Trung bình' : 'Thấp'}</span>
                          </div>
                        </div>
                        {notification.duongDanHanhDong ? (
                          <div className="flex items-center ml-3">
                            <button
                              onClick={() => handleNotificationClick(notification.duongDanHanhDong)}
                              className="px-3 py-1 text-sm bg-primary text-white rounded-md hover:opacity-95"
                              aria-label={`Đi tới ${notification.duongDanHanhDong}`}
                            >
                              Đi đến
                            </button>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 text-center"><button className="text-primary hover:text-primary/80 font-medium">Xem tất cả thông báo</button></div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 mt-8">
            <div className="bg-white rounded-lg shadow-sm p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Thao tác nhanh</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <button
                  onClick={() => navigate('/staff/customers')}
                  className="flex flex-col items-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all duration-300 shadow-sm hover:shadow-md group"
                >
                  <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <IoPerson className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 text-center">Quản lý khách hàng</span>
                </button>

                <button
                  onClick={() => navigate('/staff/orders')}
                  className="flex flex-col items-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-300 shadow-sm hover:shadow-md group"
                >
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <IoReceipt className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 text-center">Xử lý đơn hàng</span>
                </button>

                <button
                  onClick={() => navigate('/staff/chat')}
                  className="flex flex-col items-center p-6 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl hover:from-pink-100 hover:to-pink-200 transition-all duration-300 shadow-sm hover:shadow-md group"
                >
                  <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <IoChatbubbles className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 text-center">Hỗ trợ khách hàng</span>
                </button>

                <button
                  onClick={() => navigate('/staff/products')}
                  className="flex flex-col items-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl hover:from-orange-100 hover:to-orange-200 transition-all duration-300 shadow-sm hover:shadow-md group"
                >
                  <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <IoStorefront className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 text-center">Quản lý sản phẩm</span>
                </button>

                <button
                  onClick={openInventoryWithImport}
                  className="flex flex-col items-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all duration-300 shadow-sm hover:shadow-md group"
                  title="Mở giao diện nhập hàng"
                >
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <IoTrendingUp className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 text-center">Nhập hàng</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Spacer added to preserve original bottom spacing (was debug panel) */}
        <div className="py-8" />
      </div>
    </div>
  );
};


export default StaffDashboard;