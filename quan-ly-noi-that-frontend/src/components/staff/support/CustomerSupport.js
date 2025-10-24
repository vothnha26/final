import React, { useState, useEffect, useRef, useCallback } from 'react';
import { IoChatbubbles, IoTime, IoCheckmarkCircle, IoClose, IoAdd, IoEye, IoCreate, IoTrash, IoCall, IoMail, IoPerson } from 'react-icons/io5';
import api, { BASE_URL } from '../../../api';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { useAuth } from '../../../contexts/AuthContext';

// Mapping functions for Vietnamese API field names
const mapTicketFromApi = (ticket) => ({
  id: ticket.id,
  ticketNumber: ticket.ma_ticket,
  customer: ticket.khach_hang,
  customerId: ticket.khach_hang_id,
  customerName: ticket.ten_khach_hang,
  customerEmail: ticket.email_khach_hang,
  customerPhone: ticket.sdt_khach_hang,
  subject: ticket.chu_de,
  description: ticket.mo_ta,
  category: ticket.danh_muc,
  priority: ticket.do_uu_tien,
  status: ticket.trang_thai,
  assignedTo: ticket.nhan_vien_phu_trach,
  assignedToId: ticket.nhan_vien_id,
  createdDate: ticket.ngay_tao,
  updatedDate: ticket.ngay_cap_nhat,
  resolvedDate: ticket.ngay_giai_quyet,
  messages: ticket.tin_nhan || [],
  attachments: ticket.tep_dinh_kem || [],
  tags: ticket.nhan || []
});

// mapTicketToApi / message mappers removed — UI uses fetched ticket objects directly

const CustomerSupport = () => {
  const [tickets, setTickets] = useState([]);
  // loading/error handled inline with alerts/console as needed
  
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showCreateTicketModal, setShowCreateTicketModal] = useState(false);
  const [showEditTicketModal, setShowEditTicketModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const stompRef = useRef(null);
  const { user } = useAuth();
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterAssignedTo, setFilterAssignedTo] = useState('all');
  const [newTicket, setNewTicket] = useState({
    customer: '',
    subject: '',
    category: '',
    priority: 'medium',
    description: '',
    assignedTo: '',
    tags: []
  });

  // API Functions
  const fetchTickets = async () => {
    try {
      const response = await api.get('/api/v1/ho-tro-khach-hang/ticket');
      const data = response.data || response;
      if (Array.isArray(data)) setTickets(data.map(mapTicketFromApi));
      else setTickets([]);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      alert('Không thể tải danh sách ticket. Kiểm tra console để biết chi tiết.');
      setTickets([]);
    }
  };

  // create/update/message/assign helpers removed — the UI currently logs actions

  useEffect(() => {
    fetchTickets();
    // connect STOMP for staff notifications
    // connectStomp is stable here and we intentionally don't include it in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
    connectStomp();

    return () => {
      if (stompRef.current) {
        try { stompRef.current.deactivate(); } catch (e) {}
      }
    };
  }, [connectStomp]);

  const statusConfig = {
    open: { color: 'text-blue-600', bg: 'bg-blue-100', icon: IoTime, label: 'Mở' },
    in_progress: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: IoTime, label: 'Đang xử lý' },
    resolved: { color: 'text-green-600', bg: 'bg-green-100', icon: IoCheckmarkCircle, label: 'Đã giải quyết' },
    closed: { color: 'text-gray-600', bg: 'bg-gray-100', icon: IoClose, label: 'Đã đóng' }
  };

  const priorityConfig = {
    low: { color: 'text-gray-600', bg: 'bg-gray-100', label: 'Thấp' },
    medium: { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Trung bình' },
    high: { color: 'text-orange-600', bg: 'bg-orange-100', label: 'Cao' },
    urgent: { color: 'text-red-600', bg: 'bg-red-100', label: 'Khẩn cấp' }
  };

  const categoryConfig = {
    product_issue: { label: 'Lỗi sản phẩm', color: 'text-red-600' },
    return_policy: { label: 'Chính sách đổi trả', color: 'text-blue-600' },
    shipping: { label: 'Giao hàng', color: 'text-green-600' },
    payment: { label: 'Thanh toán', color: 'text-purple-600' },
    general: { label: 'Chung', color: 'text-gray-600' }
  };

  const getStatusInfo = (status) => {
    return statusConfig[status] || statusConfig.open;
  };

  const getPriorityInfo = (priority) => {
    return priorityConfig[priority] || priorityConfig.medium;
  };

  const getCategoryInfo = (category) => {
    return categoryConfig[category] || categoryConfig.general;
  };

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setShowTicketModal(true);
  };

  // directly use setShowCreateTicketModal(true) where needed

  const handleSaveTicket = () => {
    setShowCreateTicketModal(false);
    setNewTicket({
      customer: '',
      subject: '',
      category: '',
      priority: 'medium',
      description: '',
      assignedTo: '',
      tags: []
    });
  };

  const handleFilterTickets = () => {
    setShowFilterModal(true);
  };

  const handleApplyFilter = () => {
    setShowFilterModal(false);
  };

  const handleClearFilter = () => {
    setFilterStatus('all');
    setFilterPriority('all');
    setFilterAssignedTo('all');
  };

  const handleEditTicket = (ticket) => {
    setSelectedTicket(ticket);
    setShowEditTicketModal(true);
  };

  const handleSaveEditTicket = () => {
    setShowEditTicketModal(false);
    setSelectedTicket(null);
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // If a ticket is selected and we have a sessionId for it, send via STOMP
      const text = newMessage.trim();
      if (selectedTicket && stompRef.current && stompRef.current.connected && selectedTicket.sessionId) {
        const payload = {
          senderType: 'staff',
          senderId: user?.maNhanVien || user?.ma_nhan_vien || user?.id || null,
          content: text
        };
        try {
          stompRef.current.publish({ destination: `/app/chat.send/${selectedTicket.sessionId}`, body: JSON.stringify(payload) });
        } catch (e) {
          console.error('STOMP publish failed', e);
        }
        // Do not optimistically append when STOMP is connected; server will broadcast the saved message
        setNewMessage('');
        return;
      }

      // fallback: local UI update and API call
      setNewMessage('');
    }
  };

  const connectStomp = useCallback(() => {
    if (stompRef.current && stompRef.current.connected) return;

  const sockUrl = `${String(BASE_URL || '').replace(/\/$/, '')}/ws-notifications`;

    const client = new Client({
      webSocketFactory: () => new SockJS(sockUrl),
      reconnectDelay: 5000,
      debug: () => {}
    });

    client.onConnect = () => {
      // subscribe to staff personal topic
      const staffId = user?.maNhanVien || user?.ma_nhan_vien || user?.id || null;
      if (staffId) {
        client.subscribe(`/topic/staff/${staffId}`, (msg) => {
          try {
            const body = JSON.parse(msg.body);
            if (body.type === 'assigned' && body.sessionId) {
              // Map sessionId to ticket by customerId (khach_hang_id)
              const customerId = body.customerId;
              setTickets(prev => prev.map(t => {
                if (t.customerId && customerId && String(t.customerId) === String(customerId)) {
                  // attach sessionId to ticket
                  const updated = { ...t, sessionId: body.sessionId };
                  // subscribe to session topic for live messages
                  try {
                    client.subscribe(`/topic/chat/session-${body.sessionId}`, (m) => {
                      try {
                        const b = JSON.parse(m.body);
                        const incoming = { id: b.id || Date.now(), senderType: b.senderType, sender: b.senderType === 'staff' ? 'NV' : 'KH', message: b.content || b.text, sentAt: b.sentAt || new Date().toLocaleString() };
                        // dedupe
                        setTickets(prev2 => prev2.map(tt => {
                          if (tt.id !== updated.id) return tt;
                          const exists = (tt.messages || []).some(mm => String(mm.id) === String(incoming.id));
                          if (exists) return tt;
                          return { ...tt, messages: [...(tt.messages||[]), incoming] };
                        }));
                      } catch (ee) { console.warn('Failed to parse incoming session msg', ee); }
                    });
                  } catch (e) { console.warn('Failed to subscribe to session topic', e); }

                  // add a small system message to indicate a session is active
                  updated.messages = [...(updated.messages || []), { id: `sys-${Date.now()}`, senderType: 'system', sender: 'system', message: 'Phiên chat đã được tạo/được gán cho bạn.', sentAt: new Date().toLocaleString() }];
                  return updated;
                }
                return t;
              }));
            }
          } catch (e) { console.warn('Failed to parse staff topic message', e); }
        });
      }

      // subscribe to all session topics present in loaded tickets
      tickets.forEach(t => {
        if (t.sessionId) {
          client.subscribe(`/topic/chat/session-${t.sessionId}`, (msg) => {
            try {
              const body = JSON.parse(msg.body);
              const incoming = { id: body.id || Date.now(), senderType: body.senderType, sender: body.senderType === 'staff' ? 'NV' : 'KH', message: body.content || body.text, sentAt: body.sentAt || new Date().toLocaleString() };
              // dedupe per ticket
              setTickets(prev => prev.map(tt => {
                if (tt.id !== t.id) return tt;
                const exists = (tt.messages || []).some(mm => String(mm.id) === String(incoming.id));
                if (exists) return tt;
                return { ...tt, messages: [...(tt.messages||[]), incoming] };
              }));
            } catch (e) { console.warn('Failed to parse session message', e); }
          });
        }
      });
    };

    client.onStompError = (frame) => {
      console.error('STOMP error', frame);
    };

    stompRef.current = client;
    client.activate();
  }, [user, tickets]);

  const getTicketResponses = (ticketId) => {
    const t = tickets.find(t => (t.id || t.ticketNumber) === ticketId || (t.id && t.id.toString() === ticketId?.toString()));
    return t?.messages || [];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hỗ trợ khách hàng</h1>
          <p className="text-gray-600">Quản lý và xử lý các yêu cầu hỗ trợ từ khách hàng</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <IoChatbubbles className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng ticket</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <IoTime className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Đang xử lý</p>
                <p className="text-2xl font-bold text-gray-900">1</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <IoCheckmarkCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Đã giải quyết</p>
                <p className="text-2xl font-bold text-gray-900">1</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <IoTime className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Cần xử lý</p>
                <p className="text-2xl font-bold text-gray-900">1</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Danh sách ticket</h3>
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleFilterTickets}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <IoTime className="w-4 h-4" />
                Lọc
              </button>
              <button 
                onClick={() => setShowCreateTicketModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                <IoAdd className="w-4 h-4" />
                Tạo ticket mới
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chủ đề
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ưu tiên
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phụ trách
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tickets.map((ticket) => {
                  const statusInfo = getStatusInfo(ticket.status);
                  const priorityInfo = getPriorityInfo(ticket.priority);
                  const categoryInfo = getCategoryInfo(ticket.category);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{ticket.id}</div>
                        <div className="text-sm text-gray-500">{categoryInfo.label}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{ticket.customer}</div>
                        <div className="text-sm text-gray-500">{ticket.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 max-w-xs truncate">{ticket.subject}</div>
                        <div className="text-sm text-gray-500">#{ticket.orderId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityInfo.bg} ${priorityInfo.color}`}>
                          {priorityInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ticket.assignedTo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewTicket(ticket)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <IoEye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEditTicket(ticket)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <IoCreate className="w-4 h-4" />
                          </button>
                          <button className="text-red-600 hover:text-red-800">
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

        {/* Ticket Detail Modal */}
        {showTicketModal && selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Chi tiết ticket #{selectedTicket.id}
                  </h3>
                  <button
                    onClick={() => setShowTicketModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <IoClose className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Ticket Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Thông tin khách hàng</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <IoPerson className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-900">{selectedTicket.customer}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IoMail className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-900">{selectedTicket.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IoCall className="w-4 h-4 text-gray-500" />
                          <span className="text-sm text-gray-900">{selectedTicket.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Thông tin ticket</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Trạng thái:</span>
                          <span className={`text-sm font-medium ${getStatusInfo(selectedTicket.status).color}`}>
                            {getStatusInfo(selectedTicket.status).label}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Ưu tiên:</span>
                          <span className={`text-sm font-medium ${getPriorityInfo(selectedTicket.priority).color}`}>
                            {getPriorityInfo(selectedTicket.priority).label}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Phụ trách:</span>
                          <span className="text-sm font-medium">{selectedTicket.assignedTo}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Tạo lúc:</span>
                          <span className="text-sm font-medium">{selectedTicket.createdAt}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ticket Content */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Nội dung yêu cầu</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-2">{selectedTicket.subject}</h5>
                      <p className="text-sm text-gray-600">{selectedTicket.description}</p>
                    </div>
                  </div>

                  {/* Conversation */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Cuộc trò chuyện</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-4 max-h-60 overflow-y-auto mb-4">
                        {getTicketResponses(selectedTicket.id).map((response) => (
                          <div key={response.id} className={`flex ${response.senderType === 'staff' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              response.senderType === 'staff' 
                                ? 'bg-primary text-white' 
                                : 'bg-white border border-gray-200 text-gray-900'
                            }`}>
                              <div className="flex items-start gap-2">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                                  response.senderType === 'staff' 
                                    ? 'bg-white/20' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {response.senderType === 'staff' ? 'NV' : 'KH'}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium mb-1">{response.sender}</p>
                                  <p className="text-sm">{response.message}</p>
                                  <p className="text-xs mt-1 opacity-75">
                                    {response.sentAt}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* New Message Input */}
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex gap-2">
                          <textarea
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Nhập tin nhắn phản hồi..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                            rows={2}
                          />
                          <button
                            onClick={handleSendMessage}
                            disabled={!newMessage.trim()}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Gửi
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          💡 Tin nhắn sẽ được lưu vào lịch sử ticket và gửi email thông báo cho khách hàng
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Response Form */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Phản hồi</h4>
                    <div className="space-y-3">
                      <textarea
                        placeholder="Nhập phản hồi của bạn..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        rows={3}
                      />
                      <div className="flex items-center justify-end space-x-3">
                        <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
                          Đính kèm file
                        </button>
                        <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                          Gửi phản hồi
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => setShowTicketModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Đóng
                    </button>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      Đánh dấu đã giải quyết
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Ticket Modal */}
        {showCreateTicketModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Tạo ticket hỗ trợ mới
                  </h3>
                  <button
                    onClick={() => setShowCreateTicketModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <IoClose className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleSaveTicket(); }}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng</label>
                        <input
                          type="text"
                          value={newTicket.customer}
                          onChange={(e) => setNewTicket({...newTicket, customer: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Nhập tên khách hàng"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chủ đề</label>
                        <input
                          type="text"
                          value={newTicket.subject}
                          onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Nhập chủ đề ticket"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                        <select
                          value={newTicket.category}
                          onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        >
                          <option value="">Chọn danh mục</option>
                          <option value="technical">Kỹ thuật</option>
                          <option value="billing">Thanh toán</option>
                          <option value="shipping">Giao hàng</option>
                          <option value="product">Sản phẩm</option>
                          <option value="general">Chung</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mức độ ưu tiên</label>
                        <select
                          value={newTicket.priority}
                          onChange={(e) => setNewTicket({...newTicket, priority: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="low">Thấp</option>
                          <option value="medium">Trung bình</option>
                          <option value="high">Cao</option>
                          <option value="urgent">Khẩn cấp</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả vấn đề</label>
                      <textarea
                        value={newTicket.description}
                        onChange={(e) => setNewTicket({...newTicket, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        rows="4"
                        placeholder="Mô tả chi tiết vấn đề khách hàng gặp phải..."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Giao cho</label>
                      <select
                        value={newTicket.assignedTo}
                        onChange={(e) => setNewTicket({...newTicket, assignedTo: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Chọn nhân viên</option>
                        <option value="Huy">Huy</option>
                        <option value="Nhã">Nhã</option>
                        <option value="Bảo">Bảo</option>
                        <option value="Phúc">Phúc</option>
                        <option value="Lộc">Lộc</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                      <input
                        type="text"
                        value={newTicket.tags.join(', ')}
                        onChange={(e) => setNewTicket({...newTicket, tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Nhập tags cách nhau bởi dấu phẩy"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowCreateTicketModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                    >
                      Tạo ticket
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Filter Modal */}
        {showFilterModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Lọc ticket
                  </h3>
                  <button
                    onClick={() => setShowFilterModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <IoClose className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trạng thái
                    </label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="all">Tất cả</option>
                      <option value="open">Mở</option>
                      <option value="in_progress">Đang xử lý</option>
                      <option value="resolved">Đã giải quyết</option>
                      <option value="closed">Đã đóng</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mức độ ưu tiên
                    </label>
                    <select
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="all">Tất cả</option>
                      <option value="low">Thấp</option>
                      <option value="medium">Trung bình</option>
                      <option value="high">Cao</option>
                      <option value="urgent">Khẩn cấp</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phụ trách
                    </label>
                    <select
                      value={filterAssignedTo}
                      onChange={(e) => setFilterAssignedTo(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="all">Tất cả</option>
                      <option value="Huy">Huy</option>
                      <option value="Nhã">Nhã</option>
                      <option value="Bảo">Bảo</option>
                      <option value="Phúc">Phúc</option>
                      <option value="Lộc">Lộc</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleClearFilter}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Xóa bộ lọc
                  </button>
                  <button
                    onClick={handleApplyFilter}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Ticket Modal */}
        {showEditTicketModal && selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Chỉnh sửa ticket #{selectedTicket.id}
                  </h3>
                  <button
                    onClick={() => setShowEditTicketModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <IoClose className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleSaveEditTicket(); }}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Khách hàng</label>
                        <input
                          type="text"
                          value={selectedTicket.customer}
                          onChange={(e) => setSelectedTicket({...selectedTicket, customer: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chủ đề</label>
                        <input
                          type="text"
                          value={selectedTicket.subject}
                          onChange={(e) => setSelectedTicket({...selectedTicket, subject: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Danh mục</label>
                        <select
                          value={selectedTicket.category}
                          onChange={(e) => setSelectedTicket({...selectedTicket, category: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        >
                          <option value="product_issue">Lỗi sản phẩm</option>
                          <option value="return_policy">Chính sách đổi trả</option>
                          <option value="shipping">Giao hàng</option>
                          <option value="payment">Thanh toán</option>
                          <option value="warranty">Bảo hành</option>
                          <option value="refund">Hoàn tiền</option>
                          <option value="general">Chung</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mức độ ưu tiên</label>
                        <select
                          value={selectedTicket.priority}
                          onChange={(e) => setSelectedTicket({...selectedTicket, priority: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="low">Thấp</option>
                          <option value="medium">Trung bình</option>
                          <option value="high">Cao</option>
                          <option value="urgent">Khẩn cấp</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả vấn đề</label>
                      <textarea
                        value={selectedTicket.description}
                        onChange={(e) => setSelectedTicket({...selectedTicket, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        rows="4"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Giao cho</label>
                      <select
                        value={selectedTicket.assignedTo}
                        onChange={(e) => setSelectedTicket({...selectedTicket, assignedTo: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="Huy">Huy</option>
                        <option value="Nhã">Nhã</option>
                        <option value="Bảo">Bảo</option>
                        <option value="Phúc">Phúc</option>
                        <option value="Lộc">Lộc</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                      <select
                        value={selectedTicket.status}
                        onChange={(e) => setSelectedTicket({...selectedTicket, status: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="open">Mở</option>
                        <option value="in_progress">Đang xử lý</option>
                        <option value="resolved">Đã giải quyết</option>
                        <option value="closed">Đã đóng</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowEditTicketModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                    >
                      Lưu thay đổi
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

export default CustomerSupport;


