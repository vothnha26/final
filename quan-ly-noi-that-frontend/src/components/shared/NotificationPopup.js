import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  IoNotifications, 
  IoCheckmarkCircle, 
  IoTime, 
  IoStar, 
  IoGift, 
  IoCart,
  IoClose
} from 'react-icons/io5';
import { useAuth } from '../../contexts/AuthContext';
import api, { BASE_URL } from '../../api';
import SockJS from 'sockjs-client';
import { Client as StompClient } from '@stomp/stompjs';

const NotificationPopup = () => {
  const navigate = useNavigate();
  const popupRef = useRef(null);
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const stompRef = useRef(null);
  const pollerRef = useRef(null);

  // Chuẩn hóa dữ liệu thông báo từ backend về dạng thống nhất cho UI
  const normalizeNotifications = (arr) => {
    if (!Array.isArray(arr)) return [];
    return arr.map((n, index) => {
      const id = n?.maThongBao ?? n?.ma_thong_bao ?? n?.id ?? index;
      return {
        id,
        title: n?.tieuDe ?? n?.tieu_de ?? n?.title ?? '',
        message: n?.noiDung ?? n?.noi_dung ?? n?.message ?? '',
        read: n?.daDoc ?? n?.da_doc ?? n?.isRead ?? false,
        time: n?.thoiGian ?? n?.thoi_gian ?? n?.timestamp ?? n?.createdAt ?? n?.created_at ?? '',
        type: n?.loai ?? n?.type ?? 'info',
        action: n?.action ?? null,
        raw: n,
      };
    });
  };

  // Lấy thông báo động từ backend khi user thay đổi
  useEffect(() => {
    if (!user || !user.maKhachHang) {
      return;
    }

    api.get(`/api/v1/thong-bao/me`)
      .then(res => {
        const data = res?.data ?? res;
        setNotifications(normalizeNotifications(data));
      })
      .catch(() => {});
  }, [user]);

  // WebSocket: kết nối STOMP để nhận thông báo realtime
  useEffect(() => {
    if (!user || !user.maKhachHang) {
      return;
    }

  // Lấy baseURL chuẩn từ api.js (ưu tiên biến môi trường), tránh hardcode port
  const wsUrl = `${String(BASE_URL || '').replace(/\/$/, '')}/ws-notifications`;

    const client = new StompClient({
      webSocketFactory: () => new SockJS(wsUrl),
      reconnectDelay: 5000,
      onConnect: () => {
        // Subscribe kênh chung
        client.subscribe('/topic/thong-bao/all', (message) => {
          try {
            const body = JSON.parse(message.body);
            const [item] = normalizeNotifications([body]);
            if (item) setNotifications((prev) => [item, ...prev]);
          } catch (e) {}
        });
        // Subscribe kênh theo khách hàng
        const customerTopic = `/topic/thong-bao/customer/${user.maKhachHang}`;
        client.subscribe(customerTopic, (message) => {
          try {
            const body = JSON.parse(message.body);
            const [item] = normalizeNotifications([body]);
            if (item) setNotifications((prev) => [item, ...prev]);
          } catch (e) {}
        });
      }
    });
    client.activate();
    stompRef.current = client;

    // Fallback polling mỗi 15s nếu không có websocket hoặc miss message
    const startPolling = () => {
      if (pollerRef.current) return;
      pollerRef.current = setInterval(() => {
        api.get(`/api/v1/thong-bao/me`).then(res => {
          const data = res?.data ?? res;
          setNotifications(normalizeNotifications(data));
        }).catch(() => {});
      }, 15000);
    };
    startPolling();

    return () => {
      if (stompRef.current) {
        stompRef.current.deactivate();
        stompRef.current = null;
      }
      if (pollerRef.current) {
        clearInterval(pollerRef.current);
        pollerRef.current = null;
      }
    };
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getTypeIcon = (type) => {
    const icons = {
      order: IoCheckmarkCircle,
      promotion: IoGift,
      review: IoStar,
      stock: IoCart,
      shipping: IoTime
    };
    const Icon = icons[type] || IoNotifications;
    return <Icon className="w-5 h-5" />;
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

  const markAsRead = (id) => {
    api.put(`/api/v1/thong-bao/${id}/danh-dau-da-doc`).then(() => {
      setNotifications(notifications.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      ));
    });
  };

  const markAllAsRead = () => {
    api.put(`/api/v1/thong-bao/danh-dau-tat-ca-da-doc`).then(() => {
      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
      setIsOpen(false);
    }).catch(() => {});
  };

  const deleteNotification = (id, e) => {
    e.stopPropagation();
    api.delete(`/api/v1/thong-bao/${id}`).then(() => {
      setNotifications(notifications.filter(notif => notif.id !== id));
    });
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.action) {
      setIsOpen(false);
      navigate(notification.action);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString('vi-VN');
  };

  return (
    <div className="relative" ref={popupRef}>
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <IoNotifications className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 animate-fadeIn">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <IoNotifications className="w-5 h-5" />
              <h3 className="font-semibold">Thông báo</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  markAllAsRead();
                }}
                className="text-xs font-medium hover:bg-white/10 px-2 py-1 rounded transition-colors"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notif, index) => (
                <div
                  key={notif.id ?? index}
                  onClick={() => handleNotificationClick(notif)}
                  className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !notif.read ? 'bg-blue-50/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={`p-2 rounded-full ${getTypeColor(notif.type)} flex-shrink-0`}>
                      {getTypeIcon(notif.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm font-medium ${notif.read ? 'text-gray-700' : 'text-gray-900'}`}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {notif.message}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-400">{formatTime(notif.time)}</span>
                        <button
                          onClick={(e) => deleteNotification(notif.id, e)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <IoClose className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <IoNotifications className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">Chưa có thông báo mới</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/notifications');
                }}
                className="w-full text-sm text-center text-blue-600 hover:text-blue-700 font-medium"
              >
                Xem tất cả thông báo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationPopup;
