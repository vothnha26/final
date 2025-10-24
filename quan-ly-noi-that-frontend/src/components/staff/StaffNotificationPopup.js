import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  IoNotifications, 
  IoCheckmarkCircle, 
  IoWarning, 
  IoInformationCircle,
  IoCart,
  IoAlert,
  IoClose
} from 'react-icons/io5';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import api, { BASE_URL } from '../../api';

const StaffNotificationPopup = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const popupRef = useRef(null);
  const navigate = useNavigate();
  const stompRef = useRef(null);
  const pollerRef = useRef(null);

  // Normalize backend response to frontend format
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

  // Fetch notifications from API
  useEffect(() => {    
    // Initial fetch
    const fetchNotifications = async () => {
      try {
        const response = await api.get('/api/v1/thong-bao/staff/me');
        const data = response?.data ?? response;
        setNotifications(normalizeNotifications(data));
      } catch (error) {
        
      }
    };
    
    fetchNotifications();

    // WebSocket connection for real-time updates
  const wsUrl = `${String(BASE_URL || '').replace(/\/$/, '')}/ws-notifications`;
  const socket = new SockJS(wsUrl);
    const stompClient = new Client({
      webSocketFactory: () => socket
    });

    stompClient.onConnect = () => {
      
      // Subscribe to ALL notifications (for all staff)
  stompClient.subscribe('/topic/thong-bao/all', (message) => {
        try {
          const notification = JSON.parse(message.body);
          const normalized = normalizeNotifications([notification])[0];
          setNotifications(prev => [normalized, ...prev]);
        } catch (e) {
          
        }
      });

      // Subscribe to STAFF notifications (if user has staff ID)
      if (user?.maNhanVien) {
  stompClient.subscribe(`/topic/thong-bao/staff/${user.maNhanVien}`, (message) => {
          try {
            const notification = JSON.parse(message.body);
            const normalized = normalizeNotifications([notification])[0];
            setNotifications(prev => [normalized, ...prev]);
          } catch (e) {
            
          }
        });
      }
    };

    stompClient.activate();
    stompRef.current = stompClient;

    // Fallback polling every 30s
    const startPolling = () => {
      if (pollerRef.current) return;
      pollerRef.current = setInterval(() => {
        api.get('/api/v1/thong-bao/staff/me').then(res => {
          const data = res?.data ?? res;
          setNotifications(normalizeNotifications(data));
        }).catch(() => {});
      }, 30000);
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
      order: IoCart,
      stock: IoAlert,
      shipping: IoCheckmarkCircle,
      warning: IoWarning,
      info: IoInformationCircle,
      success: IoCheckmarkCircle,
      error: IoAlert
    };
    const IconComponent = icons[type] || IoInformationCircle;
    return <IconComponent className="w-5 h-5 text-white" />;
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

  const markAsRead = (id) => {
    api.put(`/api/v1/thong-bao/${id}/danh-dau-da-doc`).then(() => {
      setNotifications(notifications.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      ));
    }).catch(err => {
      
    });
  };

  const markAllAsRead = () => {
    api.put('/api/v1/thong-bao/staff/danh-dau-tat-ca-da-doc').then(() => {
      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
      setIsOpen(false);
    }).catch(err => {

    });
  };

  const deleteNotification = (id, e) => {
    e.stopPropagation();
    api.delete(`/api/v1/thong-bao/${id}`).then(() => {
      setNotifications(notifications.filter(notif => notif.id !== id));
    }).catch(err => {

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
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 60) return 'Vừa xong';
    if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
    return date.toLocaleDateString('vi-VN');
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
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <IoNotifications className="w-5 h-5" />
              <h3 className="font-semibold">Thông báo nhân viên</h3>
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
                    !notif.read ? 'bg-indigo-50/50' : ''
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
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-sm font-medium ${!notif.read ? 'text-gray-900' : 'text-gray-600'}`}>
                            {notif.title}
                          </h4>
                          <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                            {notif.message}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-400">
                              {formatTime(notif.timestamp)}
                            </span>
                            {notif.priority === 'high' && (
                              <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs rounded-full font-medium">
                                Ưu tiên cao
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => deleteNotification(notif.id, e)}
                          className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                        >
                          <IoClose className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                <IoNotifications className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Không có thông báo nào</p>
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 rounded-b-lg border-t border-gray-200">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/staff/notifications');
                }}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium w-full text-center py-1"
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

export default StaffNotificationPopup;
