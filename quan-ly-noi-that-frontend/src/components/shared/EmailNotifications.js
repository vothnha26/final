import React, { useState, useEffect } from 'react';
import { IoMail, IoCheckmarkCircle, IoTime, IoSend, IoEye, IoCreate, IoTrash, IoRefresh, IoAdd } from 'react-icons/io5';
import api from '../api';

// Mapping functions for Vietnamese API field names
const mapEmailFromApi = (email) => ({
  id: email.id,
  to: email.nguoi_nhan,
  subject: email.chu_de,
  status: email.trang_thai,
  type: email.loai_email,
  sentDate: email.ngay_gui,
  content: email.noi_dung,
  templateId: email.mau_id,
  template: email.mau,
  openCount: email.so_lan_mo || 0,
  clickCount: email.so_lan_click || 0,
  deliveryStatus: email.trang_thai_gui || 'pending'
});

const mapEmailToApi = (email) => ({
  nguoi_nhan: email.to,
  chu_de: email.subject,
  noi_dung: email.content,
  loai_email: email.type,
  mau_id: email.templateId
});

const mapTemplateFromApi = (template) => ({
  id: template.id,
  name: template.ten,
  subject: template.chu_de,
  type: template.loai,
  content: template.noi_dung,
  variables: template.bien_so || [],
  isActive: template.kich_hoat,
  createdDate: template.ngay_tao,
  lastUsed: template.lan_su_dung_cuoi
});

const mapTemplateToApi = (template) => ({
  ten: template.name,
  chu_de: template.subject,
  loai: template.type,
  noi_dung: template.content,
  bien_so: template.variables,
  kich_hoat: template.isActive || true
});

const EmailNotifications = () => {
  const [emails, setEmails] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [showEmailDetailModal, setShowEmailDetailModal] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    type: 'general',
    content: '',
    variables: []
  });

  // API Functions
  const fetchEmails = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/email/gui-email');
      setEmails(response.data.map(mapEmailFromApi));
    } catch (error) {
      setError('Không thể tải danh sách email');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/api/v1/email/mau-email');
      setTemplates(response.data.map(mapTemplateFromApi));
    } catch (error) {

    }
  };

  const sendEmail = async (emailData) => {
    try {
      const response = await api.post('/api/v1/email/gui-email', mapEmailToApi(emailData));
      return response.data;
    } catch (error) {
      throw new Error('Không thể gửi email');
    }
  };

  const createTemplate = async (templateData) => {
    try {
      const response = await api.post('/api/v1/email/mau-email', mapTemplateToApi(templateData));
      return mapTemplateFromApi(response.data);
    } catch (error) {
      throw new Error('Không thể tạo mẫu email');
    }
  };

  const updateTemplate = async (id, templateData) => {
    try {
      const response = await api.put(`/api/v1/email/mau-email/${id}`, mapTemplateToApi(templateData));
      return mapTemplateFromApi(response.data);
    } catch (error) {
      throw new Error('Không thể cập nhật mẫu email');
    }
  };

  const deleteTemplate = async (id) => {
    try {
      await api.delete(`/api/v1/email/mau-email/${id}`);
    } catch (error) {
      throw new Error('Không thể xóa mẫu email');
    }
  };

  useEffect(() => {
    fetchEmails();
    fetchTemplates();
  }, []);

  const [emailTemplates] = useState([
    {
      id: 1,
      name: 'Cảm ơn mua hàng',
      subject: 'Cảm ơn bạn đã mua hàng tại FurniShop',
      type: 'purchase_thank_you',
      status: 'active',
      createdBy: 'Huy',
      createdAt: '2024-01-10',
      lastUsed: '2024-01-15',
      usageCount: 45,
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #3B82F6;">Cảm ơn bạn đã mua hàng!</h2>
          <p>Xin chào {{customer_name}},</p>
          <p>Cảm ơn bạn đã tin tưởng và mua hàng tại FurniShop. Chúng tôi rất vui được phục vụ bạn.</p>
          <p><strong>Thông tin đơn hàng:</strong></p>
          <ul>
            <li>Mã đơn hàng: {{order_id}}</li>
            <li>Tổng tiền: {{total_amount}}</li>
            <li>Ngày đặt: {{order_date}}</li>
          </ul>
          <p>Đơn hàng của bạn đang được xử lý và sẽ được giao trong thời gian sớm nhất.</p>
          <p>Trân trọng,<br>Đội ngũ FurniShop</p>
        </div>
      `
    },
    {
      id: 2,
      name: 'Xác nhận đơn hàng',
      subject: 'Xác nhận đơn hàng #{{order_id}}',
      type: 'order_confirmation',
      status: 'active',
      createdBy: 'Huy',
      createdAt: '2024-01-08',
      lastUsed: '2024-01-16',
      usageCount: 32,
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #10B981;">Đơn hàng đã được xác nhận</h2>
          <p>Xin chào {{customer_name}},</p>
          <p>Đơn hàng #{{order_id}} của bạn đã được xác nhận thành công.</p>
          <p><strong>Chi tiết đơn hàng:</strong></p>
          <ul>
            <li>Mã đơn hàng: {{order_id}}</li>
            <li>Tổng tiền: {{total_amount}}</li>
            <li>Phương thức thanh toán: {{payment_method}}</li>
            <li>Địa chỉ giao hàng: {{shipping_address}}</li>
          </ul>
          <p>Chúng tôi sẽ thông báo cho bạn khi đơn hàng được giao.</p>
          <p>Trân trọng,<br>Đội ngũ FurniShop</p>
        </div>
      `
    },
    {
      id: 3,
      name: 'Thông báo giao hàng',
      subject: 'Đơn hàng đang được giao - #{{order_id}}',
      type: 'shipping_notification',
      status: 'active',
      createdBy: 'Huy',
      createdAt: '2024-01-12',
      lastUsed: '2024-01-17',
      usageCount: 28,
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #F59E0B;">Đơn hàng đang được giao</h2>
          <p>Xin chào {{customer_name}},</p>
          <p>Đơn hàng #{{order_id}} của bạn đang được giao hàng.</p>
          <p><strong>Thông tin giao hàng:</strong></p>
          <ul>
            <li>Mã vận đơn: {{tracking_number}}</li>
            <li>Đơn vị vận chuyển: {{carrier}}</li>
            <li>Dự kiến giao: {{estimated_delivery}}</li>
            <li>Tài xế: {{driver_name}} - {{driver_phone}}</li>
          </ul>
          <p>Bạn có thể theo dõi đơn hàng tại: <a href="{{tracking_url}}">Xem chi tiết</a></p>
          <p>Trân trọng,<br>Đội ngũ FurniShop</p>
        </div>
      `
    }
  ]);

  const [emailHistory] = useState([
    {
      id: 1,
      templateName: 'Cảm ơn mua hàng',
      recipient: 'nguyenvana@email.com',
      subject: 'Cảm ơn bạn đã mua hàng tại FurniShop',
      status: 'sent',
      sentAt: '2024-01-15 14:30:00',
      sentBy: 'Nhã',
      orderId: 'ORD001'
    },
    {
      id: 2,
      templateName: 'Xác nhận đơn hàng',
      recipient: 'tranthib@email.com',
      subject: 'Xác nhận đơn hàng #ORD002',
      status: 'sent',
      sentAt: '2024-01-16 09:15:00',
      sentBy: 'Nhã',
      orderId: 'ORD002'
    },
    {
      id: 3,
      templateName: 'Thông báo giao hàng',
      recipient: 'levanc@email.com',
      subject: 'Đơn hàng đang được giao - #ORD003',
      status: 'failed',
      sentAt: '2024-01-17 11:20:00',
      sentBy: 'Nhã',
      orderId: 'ORD003'
    }
  ]);

  const templateTypes = [
    { id: 'purchase_thank_you', name: 'Cảm ơn mua hàng', color: 'bg-blue-100 text-blue-800' },
    { id: 'order_confirmation', name: 'Xác nhận đơn hàng', color: 'bg-green-100 text-green-800' },
    { id: 'shipping_notification', name: 'Thông báo giao hàng', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'promotion', name: 'Khuyến mãi', color: 'bg-purple-100 text-purple-800' },
    { id: 'birthday', name: 'Chúc mừng sinh nhật', color: 'bg-pink-100 text-pink-800' }
  ];

  const statusConfig = {
    sent: { color: 'text-green-600', bg: 'bg-green-100', icon: IoCheckmarkCircle, label: 'Đã gửi' },
    failed: { color: 'text-red-600', bg: 'bg-red-100', icon: IoTime, label: 'Gửi thất bại' },
    pending: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: IoTime, label: 'Chờ gửi' }
  };

  const getStatusInfo = (status) => {
    return statusConfig[status] || statusConfig.pending;
  };

  const getTemplateType = (typeId) => {
    return templateTypes.find(type => type.id === typeId) || templateTypes[0];
  };

  const handleSendEmail = (template) => {
    setSelectedTemplate(template);
    setShowSendModal(true);
  };

  const handlePreviewTemplate = (template) => {
    setSelectedTemplate(template);
    setShowTemplateModal(true);
  };

  const handleCreateTemplate = () => {
    setShowCreateTemplateModal(true);
  };

  const handleSaveTemplate = () => {
    setShowCreateTemplateModal(false);
    setNewTemplate({
      name: '',
      subject: '',
      type: 'general',
      content: '',
      variables: []
    });
  };

  const handleViewEmailDetail = (email) => {
    setSelectedEmail(email);
    setShowEmailDetailModal(true);
  };

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setShowCreateTemplateModal(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Gửi email cảm ơn</h1>
          <p className="text-gray-600">Quản lý và gửi email tự động cho khách hàng</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <IoMail className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng email gửi</p>
                <p className="text-2xl font-bold text-gray-900">105</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <IoCheckmarkCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Gửi thành công</p>
                <p className="text-2xl font-bold text-gray-900">98</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <IoTime className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Gửi thất bại</p>
                <p className="text-2xl font-bold text-gray-900">7</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <IoCreate className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Template</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
            </div>
          </div>
        </div>

        {/* Email Templates */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Mẫu email</h3>
            <button
              onClick={handleCreateTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
            >
              <IoAdd className="w-4 h-4" />
              Tạo mẫu mới
            </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {emailTemplates.map((template) => {
                const type = getTemplateType(template.type);
                return (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${type.color}`}>
                        {type.name}
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handlePreviewTemplate(template)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <IoEye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditTemplate(template)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <IoCreate className="w-4 h-4" />
                        </button>
                        <button className="text-red-400 hover:text-red-600">
                          <IoTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">{template.name}</h4>
                    <p className="text-sm text-gray-600 mb-3">{template.subject}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Sử dụng: {template.usageCount} lần</span>
                      <span>Bởi: {template.createdBy}</span>
                    </div>
                    <div className="mt-3 flex items-center space-x-2">
                      <button
                        onClick={() => handleSendEmail(template)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm"
                      >
                        <IoSend className="w-4 h-4" />
                        Gửi email
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Email History */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Lịch sử gửi email</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Template
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người nhận
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tiêu đề
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Gửi bởi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {emailHistory.map((email) => {
                  const statusInfo = getStatusInfo(email.status);
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr key={email.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{email.templateName}</div>
                        <div className="text-sm text-gray-500">#{email.orderId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {email.recipient}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {email.subject}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {email.sentBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {email.sentAt}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewEmailDetail(email)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <IoEye className="w-4 h-4" />
                          </button>
                          {email.status === 'failed' && (
                            <button className="text-green-600 hover:text-green-800">
                              <IoRefresh className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Template Preview Modal */}
        {showTemplateModal && selectedTemplate && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Xem trước mẫu email
                  </h3>
                  <button
                    onClick={() => setShowTemplateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <IoRefresh className="w-6 h-6" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tên mẫu
                    </label>
                    <input
                      type="text"
                      value={selectedTemplate.name}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tiêu đề
                    </label>
                    <input
                      type="text"
                      value={selectedTemplate.subject}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      readOnly
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nội dung
                    </label>
                    <div
                      className="w-full p-4 border border-gray-300 rounded-lg bg-gray-50"
                      dangerouslySetInnerHTML={{ __html: selectedTemplate.content }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Template Modal */}
        {showCreateTemplateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Tạo mẫu email mới
                  </h3>
                  <button
                    onClick={() => setShowCreateTemplateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <IoRefresh className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); handleSaveTemplate(); }}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên mẫu</label>
                        <input
                          type="text"
                          value={newTemplate.name}
                          onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Nhập tên mẫu email"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Loại mẫu</label>
                        <select
                          value={newTemplate.type}
                          onChange={(e) => setNewTemplate({ ...newTemplate, type: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        >
                          <option value="general">Chung</option>
                          <option value="purchase_thank_you">Cảm ơn mua hàng</option>
                          <option value="order_confirmation">Xác nhận đơn hàng</option>
                          <option value="shipping_notification">Thông báo giao hàng</option>
                          <option value="promotion">Khuyến mãi</option>
                          <option value="birthday">Chúc mừng sinh nhật</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề email</label>
                      <input
                        type="text"
                        value={newTemplate.subject}
                        onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Nhập tiêu đề email"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nội dung email</label>
                      <textarea
                        value={newTemplate.content}
                        onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        rows="12"
                        placeholder="Nhập nội dung email (HTML được hỗ trợ)..."
                        required
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Sử dụng các biến: {'{{customer_name}}'}, {'{{order_id}}'}, {'{{total_amount}}'}, {'{{order_date}}'}
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Biến động (Variables)</label>
                      <input
                        type="text"
                        value={newTemplate.variables.join(', ')}
                        onChange={(e) => setNewTemplate({ ...newTemplate, variables: e.target.value.split(',').map(variable => variable.trim()).filter(variable => variable) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Nhập các biến cách nhau bởi dấu phẩy"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowCreateTemplateModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                    >
                      Tạo mẫu
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Email Detail Modal */}
        {showEmailDetailModal && selectedEmail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Chi tiết email đã gửi
                  </h3>
                  <button
                    onClick={() => setShowEmailDetailModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <IoRefresh className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Email Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Thông tin email</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Template:</span>
                          <span className="text-sm font-medium">{selectedEmail.templateName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Người nhận:</span>
                          <span className="text-sm font-medium">{selectedEmail.recipient}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Tiêu đề:</span>
                          <span className="text-sm font-medium">{selectedEmail.subject}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Trạng thái:</span>
                          <span className={`text-sm font-medium ${getStatusInfo(selectedEmail.status).color}`}>
                            {getStatusInfo(selectedEmail.status).label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Thông tin gửi</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Gửi bởi:</span>
                          <span className="text-sm font-medium">{selectedEmail.sentBy}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Thời gian:</span>
                          <span className="text-sm font-medium">{selectedEmail.sentAt}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Mã đơn hàng:</span>
                          <span className="text-sm font-medium">#{selectedEmail.orderId}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Email Content Preview */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Nội dung email</h4>
                    <div className="bg-gray-50 rounded-lg p-4 border">
                      <div className="space-y-2 mb-4">
                        <div><strong>Tiêu đề:</strong> {selectedEmail.subject}</div>
                        <div><strong>Người nhận:</strong> {selectedEmail.recipient}</div>
                      </div>
                      <div className="bg-white rounded border p-4">
                        <div className="text-sm text-gray-600">
                          Đây là nội dung email đã được gửi. Nội dung thực tế sẽ được hiển thị dựa trên template được sử dụng.
                        </div>
                        <div className="mt-4 p-4 bg-blue-50 rounded">
                          <div className="text-sm">
                            <strong>Nội dung mẫu:</strong>
                            <div className="mt-2 text-gray-700">
                              Xin chào khách hàng,<br />
                              Cảm ơn bạn đã mua hàng tại FurniShop...<br />
                              <br />
                              Trân trọng,<br />
                              Đội ngũ FurniShop
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => setShowEmailDetailModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Đóng
                    </button>
                    {selectedEmail.status === 'failed' && (
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        Gửi lại
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailNotifications;



