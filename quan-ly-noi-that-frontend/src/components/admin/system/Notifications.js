import React, { useState, useEffect } from 'react';
import { IoNotifications, IoCheckmarkCircle, IoWarning, IoInformation, IoClose, IoTime, IoPeople, IoStorefront, IoCash } from 'react-icons/io5';
import api from '../../../api';

// Mapping functions for Vietnamese API field names
const mapNotificationFromApi = (notification) => ({
  id: notification.id,
  type: notification.loai,
  title: notification.tieu_de,
  message: notification.noi_dung,
  time: notification.thoi_gian,
  read: notification.da_doc || false,
  icon: getNotificationIcon(notification.loai),
  color: getNotificationColor(notification.loai),
  bgColor: getNotificationBgColor(notification.loai),
  userId: notification.nguoi_nhan_id,
  // map backend's recipient type (snake_case or camelCase)
  loaiNguoiNhan: notification.loai_nguoi_nhan || notification.loaiNguoiNhan || 'ALL',
  createdAt: notification.ngay_tao,
  actionUrl: notification.duong_dan_hanh_dong,
  priority: notification.do_uu_tien || 'normal'
});

const getNotificationIcon = (type) => {
  switch (type) {
    case 'success': return IoCheckmarkCircle;
    case 'warning': return IoWarning;
    case 'info': return IoInformation;
    case 'order': return IoCash;
    case 'customer': return IoPeople;
    case 'inventory': return IoStorefront;
    default: return IoNotifications;
  }
};

const getNotificationColor = (type) => {
  switch (type) {
    case 'success': return 'text-green-600';
    case 'warning': return 'text-yellow-600';
    case 'error': return 'text-red-600';
    case 'info': return 'text-blue-600';
    default: return 'text-gray-600';
  }
};

const getNotificationBgColor = (type) => {
  switch (type) {
    case 'success': return 'bg-green-100';
    case 'warning': return 'bg-yellow-100';
    case 'error': return 'bg-red-100';
    case 'info': return 'bg-blue-100';
    default: return 'bg-gray-100';
  }
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [quickCreate, setQuickCreate] = useState({ loai: 'info', tieuDe: '', noiDung: '', loaiNguoiNhan: 'ALL' });

  const [selectedFilter, setSelectedFilter] = useState('all');

  // API Functions
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/thong-bao');
      const data = response && response.data ? response.data : response;
      if (Array.isArray(data) && data.length > 0) {
        // Only show notifications intended for ADMIN or STAFF on this page
        const mapped = data.map(mapNotificationFromApi);
        const adminOnly = mapped.filter(n => ['ADMIN', 'STAFF'].includes(String(n.loaiNguoiNhan || '').toUpperCase()));
        setNotifications(adminOnly);
        setError('');
        return;
      }

      // fallback: try details endpoint
      const detailsRes = await api.get('/api/v1/thong-bao/details').catch(() => null);
      const detailsData = detailsRes && detailsRes.data ? detailsRes.data : detailsRes;
      if (Array.isArray(detailsData) && detailsData.length > 0) {
        const mapped = detailsData.map(mapNotificationFromApi);
        const adminOnly = mapped.filter(n => ['ADMIN', 'STAFF'].includes(String(n.loaiNguoiNhan || '').toUpperCase()));
        setNotifications(adminOnly);
        setError('');
        return;
      }

      // fallback: try /me for user-specific notifications
      const meRes = await api.get('/api/v1/thong-bao/me').catch(() => null);
      const meData = meRes && meRes.data ? meRes.data : meRes;
      if (Array.isArray(meData) && meData.length > 0) {
        const mapped = meData.map(mapNotificationFromApi);
        const adminOnly = mapped.filter(n => ['ADMIN', 'STAFF'].includes(String(n.loaiNguoiNhan || '').toUpperCase()));
        setNotifications(adminOnly);
        setError('');
        return;
      }

      // If no data found, store helpful note for debugging
      setNotifications([]);
      setError('API returned no notifications. Checked /api/v1/thong-bao, /details and /me — all empty or non-array.');
    } catch (error) {
      // api.request attaches .status and .data for non-ok responses — surface them
      const status = error && error.status ? error.status : 'network-error';
      const body = error && error.data ? JSON.stringify(error.data) : String(error);
      setError(`Error fetching notifications (status: ${status}) — ${body}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await api.get('/api/v1/thong-bao/chua-doc/count');
      const data = res && res.data ? res.data : res;
      const count = data && (data.unread ?? data.count ?? 0);
      setUnreadCount(Number(count || 0));
    } catch (e) { }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/api/v1/thong-bao/${notificationId}/danh-dau-da-doc`);
      setNotifications(prev => prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      ));
    } catch (error) {

    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/api/v1/thong-bao/danh-dau-tat-ca-da-doc');
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
      setUnreadCount(0);
    } catch (error) {

    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/api/v1/thong-bao/${notificationId}`);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
    } catch (error) {

    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // Set up polling for new notifications
    const interval = setInterval(fetchNotifications, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // legacy mock data removed

  const filters = [
    { id: 'all', name: 'Tất cả', count: notifications.length },
    { id: 'unread', name: 'Chưa đọc', count: notifications.filter(n => !n.read).length },
    { id: 'success', name: 'Thành công', count: notifications.filter(n => n.type === 'success').length },
    { id: 'warning', name: 'Cảnh báo', count: notifications.filter(n => n.type === 'warning').length },
    { id: 'info', name: 'Thông tin', count: notifications.filter(n => n.type === 'info').length }
  ];

  const filteredNotifications = notifications.filter(notification => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'unread') return !notification.read;
    return notification.type === selectedFilter;
  });

  // direct handlers used (markAsRead, markAllAsRead, deleteNotification)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Thông báo</h1>
            <span className="inline-flex items-center px-2 py-1 text-sm font-medium bg-red-100 text-red-800 rounded">Chưa đọc: {unreadCount}</span>
          </div>
          <p className="text-gray-600">Quản lý và theo dõi các thông báo hệ thống</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedFilter === filter.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
              >
                {filter.name} ({filter.count})
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="mb-4 text-sm text-gray-600">Đang tải thông báo…</div>
        )}

        {error && (
          <div className="mb-4 text-sm text-red-600">{error}</div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
              >
                <IoCheckmarkCircle className="w-5 h-5" />
                Đánh dấu tất cả đã đọc
              </button>
              <button
                onClick={() => setShowQuickCreate(s => !s)}
                className="flex items-center gap-2 text-green-600 hover:text-green-800"
              >
                Tạo thông báo nhanh
              </button>
              <button className="flex items-center gap-2 text-gray-600 hover:text-gray-800">
                <IoTime className="w-5 h-5" />
                Xóa thông báo cũ
              </button>
            </div>
            <div className="text-sm text-gray-500">
              {filteredNotifications.length} thông báo
            </div>
          </div>
        </div>

        {showQuickCreate && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tạo thông báo nhanh</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select className="p-2 border rounded" value={quickCreate.loai} onChange={(e) => setQuickCreate(q => ({ ...q, loai: e.target.value }))}>
                <option value="info">info</option>
                <option value="success">success</option>
                <option value="warning">warning</option>
                <option value="order">order</option>
                <option value="inventory">inventory</option>
              </select>
              <input className="p-2 border rounded" placeholder="Tiêu đề" value={quickCreate.tieuDe} onChange={(e) => setQuickCreate(q => ({ ...q, tieuDe: e.target.value }))} />
              <input className="p-2 border rounded" placeholder="Nội dung" value={quickCreate.noiDung} onChange={(e) => setQuickCreate(q => ({ ...q, noiDung: e.target.value }))} />
              <div className="flex items-center gap-2">
                <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={async () => {
                  try {
                    const payload = { ...quickCreate };
                    await api.post('/api/v1/thong-bao/tong-quat', payload);
                    // refresh
                    await fetchNotifications();
                    await fetchUnreadCount();
                    setShowQuickCreate(false);
                  } catch (e) { }
                }}>Gửi</button>
                <button className="px-4 py-2 border rounded" onClick={() => setShowQuickCreate(false)}>Hủy</button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <IoNotifications className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không có thông báo</h3>
              <p className="text-gray-500">Chưa có thông báo nào phù hợp với bộ lọc hiện tại</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => {
              const IconComponent = notification.icon;
              return (
                <div
                  key={notification.id}
                  className={`bg-white rounded-lg shadow-sm p-6 border-l-4 ${notification.read ? 'border-gray-200' : 'border-primary'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-full ${notification.bgColor}`}>
                        <IconComponent className={`w-6 h-6 ${notification.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="w-2 h-2 bg-primary rounded-full"></span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-2">{notification.message}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <IoTime className="w-4 h-4" />
                            {notification.time}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${notification.type === 'success' ? 'bg-green-100 text-green-800' :
                              notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                                notification.type === 'info' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                            }`}>
                            {notification.type === 'success' ? 'Thành công' :
                              notification.type === 'warning' ? 'Cảnh báo' :
                                notification.type === 'info' ? 'Thông tin' : 'Khác'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Đánh dấu đã đọc
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <IoClose className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cài đặt thông báo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Thông báo đơn hàng</h4>
                  <p className="text-sm text-gray-500">Nhận thông báo khi có đơn hàng mới</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Cảnh báo tồn kho</h4>
                  <p className="text-sm text-gray-500">Thông báo khi sản phẩm sắp hết hàng</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Thông báo VIP</h4>
                  <p className="text-sm text-gray-500">Thông báo khi khách hàng đạt cấp VIP</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Thông báo thanh toán</h4>
                  <p className="text-sm text-gray-500">Thông báo khi có thanh toán thành công</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;

