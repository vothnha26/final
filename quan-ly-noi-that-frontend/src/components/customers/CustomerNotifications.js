import React, { useEffect, useState } from 'react';
import { IoNotifications, IoCheckmarkCircle, IoTime, IoStar, IoGift, IoCart, IoClose, IoSearch } from 'react-icons/io5';
import api from '../../api';
import { useNavigate } from 'react-router-dom';

const CustomerNotifications = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Normalize backend response (ThongBaoResponse) to UI model
  const normalize = (n) => ({
    id: n.id,
    type: n.loai || 'info',
    title: n.tieu_de || n.tieuDe || '',
    message: n.noi_dung || n.noiDung || '',
    timestamp: n.thoi_gian || n.ngay_tao || '',
    isRead: Boolean(n.da_doc),
    priority: (n.do_uu_tien || 'normal').toLowerCase().includes('high') ? 'high' : (n.do_uu_tien || 'normal'),
    action: n.duong_dan_hanh_dong ? 'Xem chi tiết' : '',
    actionPath: n.duong_dan_hanh_dong || ''
  });

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get('/api/v1/thong-bao/me');
      const list = Array.isArray(data) ? data : (data?.data || []);
      setNotifications(list.map(normalize));
    } catch (e) {
      setError('Không thể tải thông báo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getTypeIcon = (type) => {
    const icons = {
      order: IoCheckmarkCircle,
      promotion: IoGift,
      review: IoStar,
      stock: IoCart,
      shipping: IoTime
    };
    return icons[type] || IoNotifications;
  };

  const getTypeColor = (type) => {
    const colors = {
      order: 'text-green-600 bg-green-100',
      promotion: 'text-purple-600 bg-purple-100',
      review: 'text-yellow-600 bg-yellow-100',
      stock: 'text-blue-600 bg-blue-100',
      shipping: 'text-orange-600 bg-orange-100'
    };
    return colors[type] || 'text-gray-600 bg-gray-100';
  };

  const getTypeLabel = (type) => {
    const labels = {
      order: 'Đơn hàng',
      promotion: 'Khuyến mãi',
      review: 'Đánh giá',
      stock: 'Tồn kho',
      shipping: 'Vận chuyển'
    };
    return labels[type] || type;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'text-red-600',
      medium: 'text-yellow-600',
      low: 'text-gray-600'
    };
    return colors[priority] || 'text-gray-600';
  };

  const markAsRead = async (id) => {
    try {
      await api.put(`/api/v1/thong-bao/${id}/danh-dau-da-doc`, {});
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      alert('Không thể đánh dấu đã đọc');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/api/v1/thong-bao/danh-dau-tat-ca-da-doc', {});
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      alert('Không thể đánh dấu tất cả đã đọc');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/api/v1/thong-bao/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (e) {
      alert('Không thể xóa thông báo');
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    const matchesSearch = notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notif.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || notif.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const unreadCount = notifications.filter(notif => !notif.isRead).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Thông báo</h1>
              <p className="text-gray-600">
                {loading ? 'Đang tải...' : (unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : 'Tất cả thông báo đã được đọc')}
              </p>
              {error && (
                <p className="text-red-600 text-sm mt-1">{error}</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm font-medium"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Tìm kiếm thông báo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Filter */}
            <div className="md:w-48">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Tất cả loại</option>
                <option value="order">Đơn hàng</option>
                <option value="promotion">Khuyến mãi</option>
                <option value="review">Đánh giá</option>
                <option value="stock">Tồn kho</option>
                <option value="shipping">Vận chuyển</option>
              </select>
            </div>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {filteredNotifications.map((notif) => {
            const TypeIcon = getTypeIcon(notif.type);
            const typeColor = getTypeColor(notif.type);
            const priorityColor = getPriorityColor(notif.priority);

            return (
              <div
                key={notif.id}
                className={`bg-white rounded-lg shadow-sm p-6 border-l-4 ${
                  notif.isRead ? 'border-gray-200' : 'border-primary'
                } ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`p-2 rounded-full ${typeColor}`}>
                    <TypeIcon className="w-5 h-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className={`font-semibold ${notif.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                            {notif.title}
                          </h3>
                          {!notif.isRead && (
                            <span className="w-2 h-2 bg-primary rounded-full"></span>
                          )}
                        </div>
                        <p className={`text-sm mb-3 ${notif.isRead ? 'text-gray-500' : 'text-gray-700'}`}>
                          {notif.message}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{notif.timestamp}</span>
                          <span className={`font-medium ${priorityColor}`}>
                            {notif.priority === 'high' ? 'Cao' : notif.priority === 'medium' ? 'Trung bình' : 'Thấp'}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColor}`}>
                            {getTypeLabel(notif.type)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {!notif.isRead && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Đánh dấu đã đọc"
                          >
                            <IoCheckmarkCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Xóa thông báo"
                        >
                          <IoClose className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Action Button */}
                    {notif.action && (
                      <div className="mt-4">
                        <button
                          className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm font-medium"
                          onClick={() => {
                            if (notif.actionPath) {
                              if (notif.actionPath.startsWith('http')) {
                                window.open(notif.actionPath, '_blank');
                              } else {
                                navigate(notif.actionPath);
                              }
                            }
                          }}
                        >
                          {notif.action}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredNotifications.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <IoNotifications className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || filterType !== 'all' ? 'Không tìm thấy thông báo' : 'Chưa có thông báo'}
            </h3>
            <p className="text-gray-500">
              {searchTerm || filterType !== 'all' 
                ? 'Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm' 
                : 'Bạn sẽ nhận được thông báo khi có hoạt động mới'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerNotifications;

