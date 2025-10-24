import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  IoChatbubbles,
  IoSend,
  IoClose,
  IoPersonCircle,
  IoCheckmarkDone,
  IoRefresh,
  IoSearch,
  IoWarning,
  IoTrashOutline,
  IoShieldCheckmark
} from 'react-icons/io5';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import api, { BASE_URL } from '../../api';
import { useAuth } from '../../contexts/AuthContext';

const LiveChat = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('active'); // active, waiting, all, closed
  const [tabBadges, setTabBadges] = useState({ waiting: 0, active: 0 });
  const [highlightId, setHighlightId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const messagesEndRef = useRef(null);
  const stompRef = useRef(null);
  const subscriptionRef = useRef(null); // Track current subscription
  const staffSubscriptionRef = useRef({ id: null, sub: null }); // Track staff notification subscription
  const pollIntervalRef = useRef(null); // Add polling for messages
  const statusCheckCounterRef = useRef(0); // throttle status checks
  const selectedSessionRef = useRef(null); // latest selected session snapshot
  const loadSessionsRef = useRef(null); // latest loadSessions fn
  const staffIdRef = useRef(null); // current staff id
  const highlightTimerRef = useRef(null);

  // Poll messages as fallback when WebSocket might be unreliable
  const pollMessages = useCallback(async () => {
    if (!selectedSession?.id) return;
    try {
      const msgs = await api.get(`/chat/session/${selectedSession.id}/messages`);
      if (Array.isArray(msgs)) {
        setMessages(prev => {
          // Deduplicate by id to avoid duplicates from WebSocket + polling
          const existing = new Set(prev.map(m => String(m.id)));
          const newMsgs = msgs.filter(m => !existing.has(String(m.id)));
          if (newMsgs.length > 0) {
            return [...prev, ...newMsgs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          }
          return prev;
        });
      }
    } catch (e) {

    }
  }, [selectedSession?.id]);

  // Start/stop polling when session changes
  useEffect(() => {
    const currentInterval = pollIntervalRef.current;

    // Clear any existing polling interval
    if (currentInterval) {
      clearInterval(currentInterval);
      pollIntervalRef.current = null;
    }

    // Start polling if we have a selected session
    if (selectedSession?.id) {
      // Poll every 3 seconds for new messages
      pollIntervalRef.current = setInterval(async () => {
        // Always poll messages for the currently selected session
        pollMessages();
        // Every ~9s (3 ticks), if session isn't active or ownership is unknown, re-check status
        statusCheckCounterRef.current = (statusCheckCounterRef.current + 1) % 3;
        const latestSelected = selectedSessionRef.current;
        if (statusCheckCounterRef.current === 0 && latestSelected && latestSelected.status !== 'active') {
          try {
            const latest = await api.get(`/api/v1/live-chat/session/${latestSelected.id}`);
            // If the session is now active but assigned to another staff, deselect and refresh
            const staffId = staffIdRef.current;
            const ownerId = latest?.staff?.maNhanVien || latest?.staff?.id;
            if (latest?.status === 'active' && ownerId && String(ownerId) !== String(staffId)) {
              // Stop listening and clear selection
              if (subscriptionRef.current) {
                try { subscriptionRef.current.unsubscribe(); } catch (e) { }
                subscriptionRef.current = null;
              }
              setSelectedSession(null);
              setMessages([]);
              // Refresh sidebar lists to reflect new status
              if (typeof loadSessionsRef.current === 'function') {
                loadSessionsRef.current();
              }
              // Optional notice
              try { alert('Phiên chat này đã được nhân viên khác nhận.'); } catch (e) { }
              return;
            }
            // Update local session status if it changed
            if (latest && latest.status !== latestSelected.status) {
              setSelectedSession(latest);
              // If it becomes active and belongs to me, we will subscribe on next open manually
            }
          } catch (e) {
            // ignore transient errors
          }
        }
      }, 3000);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [selectedSession?.id, pollMessages]);
  const { user } = useAuth();
  // Keep refs in sync to avoid stale closures in timers/subscriptions
  useEffect(() => {
    selectedSessionRef.current = selectedSession;
  }, [selectedSession]);
  useEffect(() => {
    loadSessionsRef.current = loadSessions;
  });
  useEffect(() => {
    staffIdRef.current = user?.maNhanVien || user?.ma_nhan_vien || user?.id;
  }, [user, filter]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load sessions when filter changes
  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // Connect STOMP only once on mount
  useEffect(() => {
    loadSessions();
    connectStomp();

    return () => {
      // Cleanup subscriptions
      if (subscriptionRef.current) {
        try { subscriptionRef.current.unsubscribe(); } catch (e) { }
      }
      const currentPollInterval = pollIntervalRef.current;
      if (currentPollInterval) {
        clearInterval(currentPollInterval);
      }
      if (stompRef.current) {
        try { stompRef.current.deactivate(); } catch (e) { }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Safety net: poll the sessions list every 5s when viewing waiting/all
  useEffect(() => {
    let interval;
    if (filter === 'waiting' || filter === 'all') {
      interval = setInterval(() => {
        if (typeof loadSessionsRef.current === 'function') {
          loadSessionsRef.current();
        }
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [filter]);

  const connectStomp = () => {
    if (stompRef.current?.connected) return;

    const sockUrl = `${String(BASE_URL || '').replace(/\/$/, '')}/ws-notifications`;

    const client = new Client({
      webSocketFactory: () => new SockJS(sockUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => { }
    });

    const subscribeStaffNotifications = () => {
      const client = stompRef.current;
      if (!client?.connected) return;
      const currentStaffId = staffIdRef.current;
      if (!currentStaffId) return;

      // If already subscribed to the same staff topic, skip
      if (staffSubscriptionRef.current?.id && String(staffSubscriptionRef.current.id) === String(currentStaffId)) {
        return;
      }

      // Unsubscribe old staff topic
      if (staffSubscriptionRef.current?.sub) {
        try { staffSubscriptionRef.current.sub.unsubscribe(); } catch (e) { }
        staffSubscriptionRef.current = { id: null, sub: null };
      }

      // Subscribe to current staff topic
      const sub = client.subscribe(`/topic/staff/${currentStaffId}`, (msg) => {
        try {
          const data = JSON.parse(msg.body);

          if (data.type === 'new_chat') {
            const status = (data.status || 'waiting').toLowerCase();
            if (status === filter) {
              if (typeof loadSessionsRef.current === 'function') {
                loadSessionsRef.current();
              }
              setHighlightId(data.sessionId);
              if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
              highlightTimerRef.current = setTimeout(() => setHighlightId(null), 3000);
            } else {
              setTabBadges((prev) => ({
                ...prev,
                [status]: (prev[status] || 0) + 1,
              }));
            }
            // Browser notification
            if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
              new Notification('Chat mới', {
                body: `Khách: ${data.customerName || ''}`.trim(),
                icon: '/favicon.ico'
              });
            }
          }
        } catch (e) {

        }
      });

      staffSubscriptionRef.current = { id: currentStaffId, sub };
    };

    client.onConnect = () => {
      // Subscribe (or resubscribe) to staff notifications with latest user
      subscribeStaffNotifications();
    };

    client.onStompError = (frame) => {

    };

    stompRef.current = client;
    client.activate();

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  // Re-subscribe to staff notifications when user changes and STOMP is already connected
  useEffect(() => {
    const client = stompRef.current;
    if (client?.connected) {
      try {
        // Call the same logic as onConnect
        const currentStaffId = staffIdRef.current;
        if (!currentStaffId) return;
        if (staffSubscriptionRef.current?.id && String(staffSubscriptionRef.current.id) === String(currentStaffId)) {
          return; // already on correct topic
        }
        // Unsubscribe old and subscribe new
        if (staffSubscriptionRef.current?.sub) {
          try { staffSubscriptionRef.current.sub.unsubscribe(); } catch (e) { }
          staffSubscriptionRef.current = { id: null, sub: null };
        }
        const sub = client.subscribe(`/topic/staff/${currentStaffId}`, (msg) => {
          try {
            const data = JSON.parse(msg.body);
            if (data.type === 'new_chat') {
              const status = (data.status || 'waiting').toLowerCase();
              if (status === filter) {
                if (typeof loadSessionsRef.current === 'function') {
                  loadSessionsRef.current();
                }
                setHighlightId(data.sessionId);
                if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
                highlightTimerRef.current = setTimeout(() => setHighlightId(null), 3000);
              } else {
                setTabBadges((prev) => ({
                  ...prev,
                  [status]: (prev[status] || 0) + 1,
                }));
              }
              if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
                new Notification('Chat mới', { body: `Khách: ${data.customerName || ''}`.trim(), icon: '/favicon.ico' });
              }
            }
          } catch (e) { }
        });
        staffSubscriptionRef.current = { id: currentStaffId, sub };
      } catch { }
    }
  }, [user, filter]);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const query = filter === 'all' ? {} : { status: filter };
      const response = await api.get('/api/v1/live-chat', { query });
      setSessions(response || []);
    } catch (err) {
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const loadSessionDetail = async (sessionId) => {
    try {
      // Unsubscribe from previous session
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.unsubscribe();
          subscriptionRef.current = null;
        } catch (e) {
          
        }
      }

      const response = await api.get(`/api/v1/live-chat/session/${sessionId}`);
      setSelectedSession(response);

      // Load messages
      const messagesResponse = await api.get(`/chat/session/${sessionId}/messages`);
      setMessages(messagesResponse || []);

      // Only subscribe to live messages if this session is active AND owned by current staff
      const staffId = staffIdRef.current;
      const ownerId = response?.staff?.maNhanVien || response?.staff?.id;
      const canSubscribe = response?.status === 'active' && ownerId && String(ownerId) === String(staffId);

      if (canSubscribe && stompRef.current?.connected) {
        subscriptionRef.current = stompRef.current.subscribe(`/topic/chat/session-${sessionId}`, (msg) => {
          try {
            const data = JSON.parse(msg.body);

            // Handle session closed event
            if (data.type === 'session_closed') {
              setMessages(prev => [...prev, {
                id: `system-${Date.now()}`,
                content: 'Phiên chat đã kết thúc',
                senderType: 'system',
                sentAt: new Date().toISOString()
              }]);
              // Reload session to update status
              setTimeout(() => loadSessions(), 1000);
              return;
            }

            // Safety: ignore messages if this session is no longer active or not mine
            const latestSelected = selectedSessionRef.current;
            if (!latestSelected || latestSelected.status !== 'active') return;
            const currentOwnerId = latestSelected?.staff?.maNhanVien || latestSelected?.staff?.id;
            if (currentOwnerId && String(currentOwnerId) !== String(staffId)) return;

            // Regular message
            const newMsg = {
              id: data.id || Date.now(),
              content: data.content || '',
              senderType: data.senderType || 'staff',
              senderId: data.senderId,
              sentAt: data.sentAt || new Date().toISOString()
            };

            setMessages(prev => {
              if (prev.some(m => String(m.id) === String(newMsg.id))) {
                return prev;
              }
              return [...prev, newMsg];
            });
          } catch (e) {
            
          }
        });
      }

      // Mark as read
      await api.put(`/api/v1/live-chat/session/${sessionId}/mark-read`).catch(() => { });
    } catch (err) {
      // If forbidden (e.g., another staff owns it), inform and refresh
      try { alert('Bạn không có quyền xem phiên chat này. Có thể đã được nhân viên khác nhận.'); } catch (e) { }
    }
  };

  const handleClaimSession = async (sessionId) => {
    try {
      await api.post(`/api/v1/live-chat/session/${sessionId}/claim`);
      await loadSessions();
      await loadSessionDetail(sessionId);
    } catch (err) {
      alert('Không thể nhận chat này. Có thể đã được nhân viên khác nhận.');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedSession) return;

    const content = newMessage.trim();

    const staffId = user?.maNhanVien || user?.ma_nhan_vien || user?.id || user?.maTaiKhoan;

    setNewMessage('');

    if (!staffId) {
      alert('Không tìm thấy thông tin nhân viên. Vui lòng đăng nhập lại.');
      return;
    }

    const payload = {
      senderType: 'staff',
      senderId: staffId,
      content: content
    };

    // Try WebSocket first
    if (stompRef.current?.connected) {
      try {
        stompRef.current.publish({
          destination: `/app/chat.send/${selectedSession.id}`,
          body: JSON.stringify(payload)
        });

        return;
      } catch (e) {

      }
    }

    // Fallback to REST API if WebSocket not connected or failed
    try {
      const response = await api.post(`/chat/session/${selectedSession.id}/message`, payload);

      // Manually add message to UI since WebSocket didn't broadcast it
      const newMsg = {
        id: response.id || Date.now(),
        content: content,
        senderType: 'staff',
        senderId: staffId,
        sentAt: response.sentAt || new Date().toISOString()
      };

      setMessages(prev => {
        if (prev.some(m => String(m.id) === String(newMsg.id))) {
          return prev;
        }
        return [...prev, newMsg];
      });

    } catch (err) {
      alert('Không thể gửi tin nhắn. Vui lòng thử lại.');
      // Restore message to input if failed
      setNewMessage(content);
    }
  };

  const handleCloseSession = async () => {
    if (!selectedSession) return;

    if (!window.confirm('Bạn có chắc muốn kết thúc phiên chat này?')) return;

    try {
      await api.post(`/chat/session/${selectedSession.id}/close`);
      setSelectedSession(null);
      setMessages([]);
      await loadSessions();
    } catch (err) {
      alert('Không thể kết thúc phiên chat');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Bạn có chắc muốn xóa tin nhắn này?')) return;

    try {
      await api.del(`/chat/message/${messageId}`);
      // Remove message from local state
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (err) {
      alert('Không thể xóa tin nhắn. Vui lòng thử lại.');
    }
  };

  const handleDeleteSession = async () => {
    if (!selectedSession) return;

    if (!window.confirm('Bạn có chắc muốn xóa phiên chat này? Tất cả tin nhắn sẽ bị xóa vĩnh viễn.')) return;

    try {
      await api.del(`/chat/session/${selectedSession.id}`);
      // Clear selected session and reload list
      setSelectedSession(null);
      setMessages([]);
      await loadSessions();
    } catch (err) {
      alert('Không thể xóa phiên chat. Vui lòng thử lại.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'Vừa xong';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`;
    if (diff < 86400000) return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'bg-green-100 text-green-700',
      waiting: 'bg-yellow-100 text-yellow-700',
      closed: 'bg-gray-100 text-gray-700'
    };

    const labels = {
      active: 'Đang chat',
      waiting: 'Chờ nhận',
      closed: 'Đã đóng'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status] || badges.active}`}>
        {labels[status] || status}
      </span>
    );
  };

  const filteredSessions = sessions.filter(session => {
    if (!searchTerm) return true;
    const customerName = session.customer?.hoTen || session.customer?.tenDangNhap || '';
    return customerName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Count sessions per customer to detect spam
  const getCustomerSessionCount = (customerId) => {
    if (!customerId) return 0;
    return sessions.filter(s =>
      s.customer?.maKhachHang === customerId &&
      (s.status === 'active' || s.status === 'waiting')
    ).length;
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex bg-gray-50">
      {/* Sidebar - Danh sách chat */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 mb-4">
            <IoChatbubbles className="h-6 w-6 text-blue-500" />
            Live Chat
          </h2>

          {/* Search */}
          <div className="relative mb-3">
            <IoSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm khách hàng..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('active')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'active'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              <span className="inline-flex items-center gap-2">
                Đang chat
                {tabBadges.active > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center text-[10px] min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white">
                    {tabBadges.active}
                  </span>
                )}
              </span>
            </button>
            <button
              onClick={() => setFilter('waiting')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'waiting'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              <span className="inline-flex items-center gap-2">
                Chờ nhận
                {tabBadges.waiting > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center text-[10px] min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white">
                    {tabBadges.waiting}
                  </span>
                )}
              </span>
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              Tất cả
            </button>
          </div>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <IoChatbubbles className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Không có chat nào</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredSessions.map((session) => (
                <div
                  key={session.id}
                  onClick={() => loadSessionDetail(session.id)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedSession?.id === session.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    } ${highlightId === session.id ? 'ring-2 ring-blue-400/50 rounded-md bg-blue-50' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      <IoPersonCircle className="h-10 w-10 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900 truncate">
                            {session.customer?.hoTen || session.customer?.tenDangNhap || 'Khách hàng'}
                          </h4>
                          {session.customer?.tenDangNhap ? (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                              <IoShieldCheckmark className="h-3 w-3" />
                              Thành viên
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                              Khách vãng lai
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatTime(session.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(session.status)}
                        {getCustomerSessionCount(session.customer?.maKhachHang) > 1 && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-700 flex items-center gap-1">
                            <IoWarning className="h-3 w-3" />
                            {getCustomerSessionCount(session.customer?.maKhachHang)} phiên
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-1">
                        Mã KH: {session.customer?.maKhachHang || 'N/A'}
                      </p>
                      <p className="text-sm text-gray-600 truncate">
                        {session.lastMessage || 'Chưa có tin nhắn'}
                      </p>
                      {session.status === 'waiting' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleClaimSession(session.id);
                          }}
                          className="mt-2 w-full px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded hover:bg-blue-600 transition-colors"
                        >
                          Nhận chat
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Refresh button */}
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={loadSessions}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <IoRefresh className="h-4 w-4" />
            <span className="text-sm font-medium">Làm mới</span>
          </button>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {selectedSession ? (
          <>
            {/* Chat header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <IoPersonCircle className="h-10 w-10 text-gray-400" />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">
                      {selectedSession.customer?.hoTen || selectedSession.customer?.tenDangNhap || 'Khách hàng'}
                    </h3>
                    {selectedSession.customer?.tenDangNhap ? (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                        <IoShieldCheckmark className="h-3 w-3" />
                        Thành viên
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                        Khách vãng lai
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>Mã KH: {selectedSession.customer?.maKhachHang || 'N/A'}</span>
                    <span>•</span>
                    {getStatusBadge(selectedSession.status)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDeleteSession}
                  className="px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                  title="Xóa phiên chat"
                >
                  <IoTrashOutline className="h-4 w-4" />
                  Xóa phiên
                </button>
                {selectedSession.status === 'active' && (
                  <button
                    onClick={handleCloseSession}
                    className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors flex items-center gap-2"
                  >
                    <IoClose className="h-5 w-5" />
                    Kết thúc chat
                  </button>
                )}
              </div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
              <div className="space-y-3">
                {messages.map((message) => {
                  if (message.senderType === 'system') {
                    return (
                      <div key={message.id} className="flex justify-center">
                        <div className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                          {message.content}
                        </div>
                      </div>
                    );
                  }

                  const isStaff = message.senderType === 'staff';

                  return (
                    <div
                      key={message.id}
                      className={`flex ${isStaff ? 'justify-end' : 'justify-start'} animate-fadeIn group`}
                    >
                      <div className={`max-w-[70%] ${isStaff ? 'order-2' : 'order-1'} relative`}>
                        {!isStaff && (
                          <div className="text-xs text-gray-500 mb-1 ml-1">
                            {selectedSession.customer?.hoTen || 'Khách hàng'}
                          </div>
                        )}
                        <div
                          className={`px-4 py-2 rounded-2xl ${isStaff
                            ? 'bg-blue-500 text-white rounded-br-sm'
                            : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                            }`}
                        >
                          <p className="text-sm break-words leading-relaxed">{message.content}</p>
                          <div className={`flex items-center gap-1 mt-1 ${isStaff ? 'justify-end' : 'justify-start'}`}>
                            <span className={`text-xs ${isStaff ? 'text-blue-100' : 'text-gray-400'}`}>
                              {formatTime(message.sentAt)}
                            </span>
                            {isStaff && (
                              <IoCheckmarkDone className="h-3 w-3 text-blue-100" />
                            )}
                          </div>
                        </div>
                        {isStaff && (
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all"
                            title="Xóa tin nhắn"
                          >
                            <IoTrashOutline className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div ref={messagesEndRef} />
            </div>

            {/* Input area */}
            <div className="bg-white border-t border-gray-200 p-4">
              {selectedSession.status === 'active' ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <IoSend className="h-5 w-5" />
                    <span className="font-medium">Gửi</span>
                  </button>
                </div>
              ) : selectedSession.status === 'waiting' ? (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500 mb-3">Chat này chưa được nhận</p>
                  <button
                    onClick={() => handleClaimSession(selectedSession.id)}
                    className="px-6 py-2 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Nhận chat ngay
                  </button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Phiên chat đã kết thúc</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-400">
              <IoChatbubbles className="h-24 w-24 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">Chọn một cuộc trò chuyện</p>
              <p className="text-sm">Chọn chat từ danh sách bên trái để bắt đầu hỗ trợ khách hàng</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveChat;
