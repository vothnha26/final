import React, { useState, useEffect, useRef } from 'react';
import { IoSend, IoClose, IoChatbubbles, IoCheckmarkDone } from 'react-icons/io5';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import api, { BASE_URL } from '../../api';
import { useAuth } from '../../contexts/AuthContext';

const CustomerChat = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [chatStatus, setChatStatus] = useState('idle'); // idle, connecting, connected, closed
  const [staffInfo, setStaffInfo] = useState(null);
  // Guest info (when not logged in)
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestCustomerId, setGuestCustomerId] = useState(null);

  // Chat history
  const [showHistory, setShowHistory] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('all'); // all | waiting | active | closed
  // Fetch chat history when widget opens, showHistory toggled, or filter changes
  useEffect(() => {
    const fetchHistory = async () => {
      setLoadingHistory(true);
      try {
        const cid = user?.maKhachHang || user?.ma_khach_hang || user?.id || guestCustomerId || localStorage.getItem('fs_livechat_customerId');
        if (!cid) {
          setChatHistory([]);
          setLoadingHistory(false);
          return;
        }
        let statusParam = '';
        if (historyFilter !== 'all') statusParam = `?status=${historyFilter}`;
        const sessions = await api.get(`/chat/sessions/customer/${cid}${statusParam}`);
        setChatHistory(Array.isArray(sessions) ? sessions : []);
      } catch (e) {
        setChatHistory([]);
      }
      setLoadingHistory(false);
    };
    if (isOpen && showHistory) {
      fetchHistory();
    }
  }, [isOpen, showHistory, user, guestCustomerId, historyFilter]);
  // Handler: click on a session in history
  const handleSelectHistorySession = async (session) => {
    if (!session.sessionId) return;
    setShowHistory(false);
    setSessionId(session.sessionId);
    setChatStatus('connected');
    try {
      localStorage.setItem('fs_livechat_sessionId', String(session.sessionId));
      if (user?.maKhachHang || user?.ma_khach_hang || user?.id || guestCustomerId)
        localStorage.setItem('fs_livechat_customerId', String(user?.maKhachHang || user?.ma_khach_hang || user?.id || guestCustomerId));
    } catch (_) {}
    // Load messages
    try {
      const msgs = await api.get(`/chat/session/${session.sessionId}/messages`);
      setMessages(Array.isArray(msgs) ? msgs : []);
    } catch (e) {
      setMessages([]);
    }
    // Connect STOMP
    const cid = user?.maKhachHang || user?.ma_khach_hang || user?.id || guestCustomerId;
    connectStomp(session.sessionId, cid);
    setStaffInfo(session.staffId && session.staffName ? { id: session.staffId, name: session.staffName } : null);
  };
  
  const messagesEndRef = useRef(null);
  const stompRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      if (stompRef.current) {
        try { stompRef.current.deactivate(); } catch (e) {}
      }
    };
  }, []);

  // Restore existing active session when widget opens
  useEffect(() => {
    const tryRestore = async () => {
      if (!isOpen) return;
      if (chatStatus !== 'idle') return;

      const sid = localStorage.getItem('fs_livechat_sessionId');
      const cidRaw = localStorage.getItem('fs_livechat_customerId');
      if (!sid) return;

      try {
        setSessionId(sid);
        setChatStatus('connected');
        // Load previous messages
        const msgs = await api.get(`/chat/session/${sid}/messages`);
        if (Array.isArray(msgs)) {
          setMessages(msgs);
        }
        // Connect to WebSocket topics
        const cid = cidRaw ? Number(cidRaw) || cidRaw : (user?.maKhachHang || user?.ma_khach_hang || user?.id || guestCustomerId);
        connectStomp(sid, cid);
        // Informational system message
        setMessages(prev => prev.length > 0 ? prev : [
          { id: `restored-${Date.now()}`, content: 'Đã tải lịch sử chat trước đó.', senderType: 'system', sentAt: new Date().toISOString() }
        ]);
      } catch (e) {
        // If restore fails, clear stored keys
        localStorage.removeItem('fs_livechat_sessionId');
        localStorage.removeItem('fs_livechat_customerId');
      }
    };
    tryRestore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const startChat = async () => {
    if (chatStatus === 'connecting') return;
    
    setChatStatus('connecting');
    try {
      const existingCustomerId = user?.maKhachHang || user?.ma_khach_hang || user?.id;
      const initialMessage = newMessage.trim() || 'Xin chào, tôi cần hỗ trợ';

      let startedSessionId;
      let currentCustomerId;

      if (existingCustomerId) {
        // Logged-in user
        const payload = { customerId: existingCustomerId, message: initialMessage };
        const response = await api.post('/chat/start', payload);
        startedSessionId = response.sessionId || response.id;
        currentCustomerId = existingCustomerId;
        if (response.staffId && response.staffName) {
          setStaffInfo({ id: response.staffId, name: response.staffName });
        }
      } else {
        // Guest flow: require minimal info
        if (!guestName.trim() || (!guestPhone.trim() && !guestEmail.trim())) {
          alert('Vui lòng nhập tên và SĐT hoặc email trước khi bắt đầu chat.');
          setChatStatus('idle');
          return;
        }
        const payload = { name: guestName.trim(), phone: guestPhone.trim(), email: guestEmail.trim(), message: initialMessage };
        const response = await api.post('/chat/guest/start', payload);
        startedSessionId = response.sessionId || response.id;
        currentCustomerId = response.customerId;
        setGuestCustomerId(response.customerId);
        if (response.staffId && response.staffName) {
          setStaffInfo({ id: response.staffId, name: response.staffName });
        }
      }

      setSessionId(startedSessionId);
      setChatStatus('connected');

      // Persist for restore on reopen
      try {
        localStorage.setItem('fs_livechat_sessionId', String(startedSessionId));
        if (currentCustomerId) localStorage.setItem('fs_livechat_customerId', String(currentCustomerId));
      } catch (_) {}

      // Welcome message
      setMessages([{ id: 'welcome', content: 'Chào bạn! Chúng tôi đã nhận được yêu cầu hỗ trợ của bạn.', senderType: 'system', sentAt: new Date().toISOString() }]);

      // Connect STOMP
      connectStomp(startedSessionId, currentCustomerId);

      if (newMessage.trim()) setNewMessage('');
    } catch (err) {
      console.error('Failed to start chat:', err);
      const status = err?.status || err?.response?.status;
      if (status === 429) {
        alert('Bạn thao tác quá nhanh, vui lòng thử lại sau.');
      } else {
        alert('Không thể kết nối với hệ thống hỗ trợ. Vui lòng thử lại sau.');
      }
      setChatStatus('idle');
    }
  };

  const connectStomp = (sId, customerId) => {
    if (stompRef.current?.connected) return;

  const sockUrl = `${String(BASE_URL || '').replace(/\/$/, '')}/ws-notifications`;

    const client = new Client({
      webSocketFactory: () => new SockJS(sockUrl),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {}
    });

    client.onConnect = () => {
      // Subscribe to session messages
      client.subscribe(`/topic/chat/session-${sId}`, (msg) => {
        try {
          const data = JSON.parse(msg.body);
          
          const newMsg = {
            id: data.id || Date.now(),
            content: data.content || '',
            senderType: data.senderType || 'customer',
            senderId: data.senderId,
            sentAt: data.sentAt || new Date().toISOString()
          };

          setMessages(prev => {
            // Dedupe by id
            if (prev.some(m => String(m.id) === String(newMsg.id))) {
              return prev;
            }
            return [...prev, newMsg];
          });

          setIsTyping(false);
        } catch (e) {
          console.error('Error parsing message:', e);
        }
      });

      // Subscribe to customer notifications
      if (customerId) {
        client.subscribe(`/topic/customer/${customerId}`, (msg) => {
          try {
            const data = JSON.parse(msg.body);
            
            if (data.type === 'staff_joined' && data.staffName) {
              setStaffInfo({ id: data.staffId, name: data.staffName });
              setMessages(prev => [...prev, {
                id: `system-${Date.now()}`,
                content: `${data.staffName} đã tham gia hỗ trợ bạn`,
                senderType: 'system',
                sentAt: new Date().toISOString()
              }]);
            } else if (data.type === 'session_closed') {
              setChatStatus('closed');
              setMessages(prev => [...prev, {
                id: `system-${Date.now()}`,
                content: 'Phiên chat đã kết thúc. Cảm ơn bạn đã sử dụng dịch vụ!',
                senderType: 'system',
                sentAt: new Date().toISOString()
              }]);
              try {
                localStorage.removeItem('fs_livechat_sessionId');
                localStorage.removeItem('fs_livechat_customerId');
              } catch (_) {}
            }
          } catch (e) {
            console.error('Error parsing notification:', e);
          }
        });
      }
    };

    client.onStompError = (frame) => {
      console.error('[CustomerChat] STOMP error:', frame);
    };

    stompRef.current = client;
    client.activate();
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || chatStatus !== 'connected' || !sessionId) return;

    const content = newMessage.trim();
    setNewMessage('');

    if (stompRef.current?.connected) {
      const payload = {
        senderType: 'customer',
        senderId: user?.maKhachHang || user?.ma_khach_hang || user?.id || guestCustomerId,
        content: content
      };

      try {
        stompRef.current.publish({
          destination: `/app/chat.send/${sessionId}`,
          body: JSON.stringify(payload)
        });
      } catch (e) {
        console.error('STOMP send failed:', e);
        // Fallback: API call
        api.post(`/chat/session/${sessionId}/message`, payload).catch(() => {});
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCustomerCloseSession = async () => {
    if (!sessionId) return;
    try {
      await api.post(`/chat/session/${sessionId}/close`);
      setChatStatus('closed');
      setMessages(prev => [...prev, {
        id: `system-${Date.now()}`,
        content: 'Bạn đã kết thúc phiên chat.',
        senderType: 'system',
        sentAt: new Date().toISOString()
      }]);
    } catch (e) {
      console.error('Customer close session failed:', e);
      alert('Không thể kết thúc phiên chat. Vui lòng thử lại.');
      return;
    } finally {
      try {
        localStorage.removeItem('fs_livechat_sessionId');
        localStorage.removeItem('fs_livechat_customerId');
      } catch (_) {}
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  };

  // Chat button khi đóng
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200"
          title="Chat với chúng tôi"
        >
          <IoChatbubbles className="h-6 w-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-96 h-[500px] flex flex-col overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <IoChatbubbles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold">Hỗ trợ khách hàng</h3>
              <p className="text-xs text-white/80">
                {chatStatus === 'connected' && staffInfo 
                  ? `${staffInfo.name} đang hỗ trợ`
                  : chatStatus === 'connecting'
                  ? 'Đang kết nối...'
                  : chatStatus === 'closed'
                  ? 'Đã kết thúc'
                  : 'Online'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(h => !h)}
              className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-lg border border-white/20"
              title="Lịch sử chat"
            >
              Lịch sử
            </button>
            {chatStatus === 'connected' && (
              <button
                onClick={handleCustomerCloseSession}
                className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-lg border border-white/20"
                title="Kết thúc chat"
              >
                Kết thúc
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-2 rounded-lg transition-colors"
              title="Đóng cửa sổ"
            >
              <IoClose className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Chat history modal/section */}
        {showHistory && (
          <div className="absolute top-0 left-0 w-full h-full bg-white/95 z-20 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <span className="font-semibold text-gray-700">Lịch sử chat</span>
              <button onClick={() => setShowHistory(false)} className="text-gray-500 hover:text-blue-500"><IoClose className="h-5 w-5" /></button>
            </div>
            {/* Filter tabs */}
            <div className="flex gap-2 px-4 pt-2 pb-1 border-b border-gray-100">
              <button onClick={()=>setHistoryFilter('all')} className={`text-xs px-3 py-1 rounded-full ${historyFilter==='all'?'bg-blue-500 text-white':'bg-gray-100 text-gray-700'}`}>Tất cả</button>
              <button onClick={()=>setHistoryFilter('waiting')} className={`text-xs px-3 py-1 rounded-full ${historyFilter==='waiting'?'bg-blue-500 text-white':'bg-gray-100 text-gray-700'}`}>Chờ nhân viên</button>
              <button onClick={()=>setHistoryFilter('active')} className={`text-xs px-3 py-1 rounded-full ${historyFilter==='active'?'bg-blue-500 text-white':'bg-gray-100 text-gray-700'}`}>Đang tư vấn</button>
              <button onClick={()=>setHistoryFilter('closed')} className={`text-xs px-3 py-1 rounded-full ${historyFilter==='closed'?'bg-blue-500 text-white':'bg-gray-100 text-gray-700'}`}>Đã kết thúc</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {loadingHistory ? (
                <div className="text-center text-gray-400">Đang tải...</div>
              ) : chatHistory.length === 0 ? (
                <div className="text-center text-gray-400">Không có lịch sử chat</div>
              ) : (
                <ul className="space-y-2">
                  {chatHistory.map(s => {
                    const status = (s.status || '').toLowerCase();
                    let statusLabel = 'Đã kết thúc';
                    if (status === 'active') statusLabel = 'Đang tư vấn';
                    else if (status === 'waiting') statusLabel = 'Chờ nhân viên';
                    return (
                      <li key={s.sessionId} className="border rounded-lg p-3 flex flex-col bg-gray-50 hover:bg-blue-50 cursor-pointer" onClick={() => handleSelectHistorySession(s)}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-700">{statusLabel}</span>
                          <span className="text-xs text-gray-400">{s.createdAt ? formatTime(s.createdAt) : ''}</span>
                        </div>
                        {s.staffName && <div className="text-xs text-gray-500 mt-1">Nhân viên: {s.staffName}</div>}
                        {s.closedAt && <div className="text-xs text-gray-400">Kết thúc: {formatTime(s.closedAt)}</div>}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
          {messages.length === 0 && chatStatus === 'idle' && (
            <div className="text-center text-gray-500 mt-8">
              <IoChatbubbles className="h-16 w-16 mx-auto mb-3 text-gray-300" />
              <p className="text-sm mb-2">Chào mừng bạn đến với hỗ trợ khách hàng!</p>
              <p className="text-xs">Nhập tin nhắn và nhấn "Bắt đầu chat" để kết nối với nhân viên hỗ trợ</p>
              {!user && (
                <div className="mt-4 text-left max-w-sm mx-auto space-y-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Họ tên</label>
                    <input value={guestName} onChange={(e)=>setGuestName(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Nguyễn Văn A" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Số điện thoại</label>
                      <input value={guestPhone} onChange={(e)=>setGuestPhone(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="09xx..." />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Email</label>
                      <input value={guestEmail} onChange={(e)=>setGuestEmail(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="ban@gmail.com" />
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400">Vui lòng nhập SĐT hoặc email để chúng tôi liên hệ lại khi cần.</p>
                </div>
              )}
            </div>
          )}

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

              const isCustomer = message.senderType === 'customer';
              
              return (
                <div
                  key={message.id}
                  className={`flex ${isCustomer ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  <div className={`max-w-[75%] ${isCustomer ? 'order-2' : 'order-1'}`}>
                    {!isCustomer && (
                      <div className="text-xs text-gray-500 mb-1 ml-1">
                        {staffInfo?.name || 'Nhân viên hỗ trợ'}
                      </div>
                    )}
                    <div
                      className={`px-4 py-2 rounded-2xl ${
                        isCustomer
                          ? 'bg-blue-500 text-white rounded-br-sm'
                          : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm break-words leading-relaxed">{message.content}</p>
                      <div className={`flex items-center gap-1 mt-1 ${isCustomer ? 'justify-end' : 'justify-start'}`}>
                        <span className={`text-xs ${isCustomer ? 'text-blue-100' : 'text-gray-400'}`}>
                          {formatTime(message.sentAt)}
                        </span>
                        {isCustomer && (
                          <IoCheckmarkDone className="h-3 w-3 text-blue-100" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {isTyping && (
            <div className="flex justify-start animate-fadeIn">
              <div className="bg-white border border-gray-200 px-4 py-3 rounded-2xl rounded-bl-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-gray-200">
          {chatStatus === 'idle' || chatStatus === 'connecting' ? (
            <div className="space-y-3">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn của bạn..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
              />
              <button
                onClick={startChat}
                disabled={chatStatus === 'connecting'}
                className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {chatStatus === 'connecting' ? 'Đang kết nối...' : 'Bắt đầu chat'}
              </button>
            </div>
          ) : chatStatus === 'closed' ? (
            <div className="text-center py-2">
              <p className="text-sm text-gray-500 mb-2">Phiên chat đã kết thúc</p>
              <button
                onClick={() => {
                  setMessages([]);
                  setSessionId(null);
                  setChatStatus('idle');
                  setStaffInfo(null);
                  setNewMessage('');
                  setGuestCustomerId(null);
                  try {
                    localStorage.removeItem('fs_livechat_sessionId');
                    localStorage.removeItem('fs_livechat_customerId');
                  } catch (_) {}
                }}
                className="text-blue-500 hover:text-blue-600 text-sm font-medium"
              >
                Bắt đầu chat mới
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IoSend className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerChat;