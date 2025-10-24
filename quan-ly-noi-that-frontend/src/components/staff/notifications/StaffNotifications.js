import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IoNotifications,
  IoCheckmarkCircle,
  IoWarning,
  IoInformationCircle,
  IoCart,
  IoAlert,
  IoTrash,
  IoCheckmarkDoneOutline,
  IoFilter,
  IoSearch,
  IoClose
} from 'react-icons/io5';
import api from '../../../api';

const StaffNotifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all'); // all, order, stock, shipping, etc.
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState([]);

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/v1/thong-bao/staff/me');
      const data = response?.data ?? response;
      setNotifications(normalizeNotifications(data));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const normalizeNotifications = (data) => {
    if (!Array.isArray(data)) return [];
    return data.map(item => ({
      id: item.ma_thong_bao ?? item.id,
      title: item.tieu_de ?? item.title ?? '',
      message: item.noi_dung ?? item.message ?? '',
      type: item.loai ?? item.type ?? 'info',
      timestamp: item.ngay_tao ?? item.timestamp ?? new Date().toISOString(),
      read: item.da_doc ?? item.read ?? false,
      priority: item.do_uu_tien ?? item.priority ?? 'normal',
      action: item.duong_dan_hanh_dong ?? item.action
    }));
  };

  const getTypeIcon = (type) => {
    const icons = {
      order: IoCart,
      stock: IoAlert,
      shipping: IoCheckmarkCircle,
      warning: IoWarning,
      info: IoInformationCircle,
      success: IoCheckmarkCircle,
      error: IoAlert
    };
    const IconComponent = icons[type] || IoInformationCircle;
    return IconComponent;
  };

  const getTypeColor = (type) => {
    const colors = {
      order: 'bg-blue-500',
      stock: 'bg-orange-500',
      shipping: 'bg-green-500',
      warning: 'bg-yellow-500',
      info: 'bg-blue-400',
      success: 'bg-green-500',
      error: 'bg-red-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  const getTypeBadgeColor = (type) => {
    const colors = {
      order: 'bg-blue-100 text-blue-700',
      stock: 'bg-orange-100 text-orange-700',
      shipping: 'bg-green-100 text-green-700',
      warning: 'bg-yellow-100 text-yellow-700',
      info: 'bg-blue-100 text-blue-700',
      success: 'bg-green-100 text-green-700',
      error: 'bg-red-100 text-red-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const getTypeLabel = (type) => {
    const labels = {
      order: 'Đơn hàng',
      stock: 'Tồn kho',
      shipping: 'Giao hàng',
      warning: 'Cảnh báo',
      info: 'Thông tin',
      success: 'Thành công',
      error: 'Lỗi'
    };
    return labels[type] || 'Khác';
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
    return date.toLocaleString('vi-VN');
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/api/v1/thong-bao/${id}/danh-dau-da-doc`);
      setNotifications(notifications.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/api/v1/thong-bao/staff/danh-dau-tat-ca-da-doc');
      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const markSelectedAsRead = async () => {
    try {
      await Promise.all(
        selectedNotifications.map(id =>
          api.put(`/api/v1/thong-bao/${id}/danh-dau-da-doc`)
        )
      );
      setNotifications(notifications.map(notif =>
        selectedNotifications.includes(notif.id) ? { ...notif, read: true } : notif
      ));
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Error marking selected as read:', error);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/api/v1/thong-bao/${id}`);
      setNotifications(notifications.filter(notif => notif.id !== id));
      setSelectedNotifications(selectedNotifications.filter(selectedId => selectedId !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const deleteSelected = async () => {
    try {
      await Promise.all(
        selectedNotifications.map(id => api.delete(`/api/v1/thong-bao/${id}`))
      );
      setNotifications(notifications.filter(notif => !selectedNotifications.includes(notif.id)));
      setSelectedNotifications([]);
    } catch (error) {
      console.error('Error deleting selected:', error);
    }
  };

  const toggleSelectNotification = (id) => {
    if (selectedNotifications.includes(id)) {
      setSelectedNotifications(selectedNotifications.filter(selectedId => selectedId !== id));
    } else {
      setSelectedNotifications([...selectedNotifications, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.length === filteredNotifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(filteredNotifications.map(n => n.id));
    }
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notif => {
    // Filter by read status
    if (filter === 'unread' && notif.read) return false;
    if (filter === 'read' && !notif.read) return false;

    // Filter by type
    if (typeFilter !== 'all' && notif.type !== typeFilter) return false;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        notif.title.toLowerCase().includes(query) ||
        notif.message.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <IoNotifications className="text-indigo-600" />
              Thông báo nhân viên
            </h1>
            <p className="text-gray-600 mt-1">
              Quản lý tất cả thông báo của bạn • {unreadCount} chưa đọc
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <IoCheckmarkDoneOutline className="w-5 h-5" />
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm thông báo..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <IoClose className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Read Status Filter */}
            <div className="flex items-center gap-2">
              <IoFilter className="text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">Tất cả</option>
                <option value="unread">Chưa đọc</option>
                <option value="read">Đã đọc</option>
              </select>
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Tất cả loại</option>
              <option value="order">Đơn hàng</option>
              <option value="stock">Tồn kho</option>
              <option value="shipping">Giao hàng</option>
              <option value="warning">Cảnh báo</option>
              <option value="info">Thông tin</option>
            </select>
          </div>

          {/* Bulk Actions */}
          {selectedNotifications.length > 0 && (
            <div className="mt-4 flex items-center gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
              <span className="text-sm font-medium text-indigo-900">
                Đã chọn {selectedNotifications.length} thông báo
              </span>
              <button
                onClick={markSelectedAsRead}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Đánh dấu đã đọc
              </button>
              <button
                onClick={deleteSelected}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Xóa
              </button>
              <button
                onClick={() => setSelectedNotifications([])}
                className="ml-auto text-sm text-gray-600 hover:text-gray-700"
              >
                Bỏ chọn
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Đang tải thông báo...</p>
        </div>
      ) : filteredNotifications.length > 0 ? (
        <div className="space-y-3">
          {/* Select All */}
          <div className="bg-white rounded-lg shadow-sm p-3 flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedNotifications.length === filteredNotifications.length && filteredNotifications.length > 0}
              onChange={toggleSelectAll}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-600">
              Chọn tất cả ({filteredNotifications.length})
            </span>
          </div>

          {/* Notifications */}
          {filteredNotifications.map((notif) => {
            const IconComponent = getTypeIcon(notif.type);
            return (
              <div
                key={notif.id}
                className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow ${
                  !notif.read ? 'border-l-4 border-indigo-500' : ''
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedNotifications.includes(notif.id)}
                      onChange={() => toggleSelectNotification(notif.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />

                    {/* Icon */}
                    <div className={`p-3 rounded-full ${getTypeColor(notif.type)} flex-shrink-0`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`text-lg font-semibold ${!notif.read ? 'text-gray-900' : 'text-gray-600'}`}>
                            {notif.title}
                          </h3>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeBadgeColor(notif.type)}`}>
                            {getTypeLabel(notif.type)}
                          </span>
                          {!notif.read && (
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                              Mới
                            </span>
                          )}
                          {notif.priority === 'high' && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                              Ưu tiên cao
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500 whitespace-nowrap">
                          {formatTime(notif.timestamp)}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-3">{notif.message}</p>

                      <div className="flex items-center gap-3">
                        {!notif.read && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                          >
                            <IoCheckmarkCircle className="w-4 h-4" />
                            Đánh dấu đã đọc
                          </button>
                        )}
                        {notif.action && (
                          <button
                            onClick={() => {
                              markAsRead(notif.id);
                              // Navigate to staff route if action URL exists
                              navigate(notif.action);
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            Xem chi tiết →
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="ml-auto text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                        >
                          <IoTrash className="w-4 h-4" />
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <IoNotifications className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Không có thông báo</h3>
          <p className="text-gray-600">
            {searchQuery || filter !== 'all' || typeFilter !== 'all'
              ? 'Không tìm thấy thông báo phù hợp với bộ lọc'
              : 'Bạn chưa có thông báo nào'}
          </p>
        </div>
      )}
    </div>
  );
};

export default StaffNotifications;
