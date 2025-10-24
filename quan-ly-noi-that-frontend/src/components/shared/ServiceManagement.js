import React, { useState, useEffect } from 'react';
import { IoAdd, IoSearch, IoCreate, IoTrash, IoSave, IoClose, IoBuild, IoHome, IoCar, IoTime, IoPricetag } from 'react-icons/io5';
import { FaTruck, FaTools, FaShieldAlt, FaClock } from 'react-icons/fa';
import Modal from './Modal';
import ConfirmDialog from './ConfirmDialog';
import Toast from './Toast';
import api from '../api';

const ServiceManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Map service data from API
  const mapServiceFromApi = (service) => ({
    maDichVu: service.maDichVu || service.id,
    tenDichVu: service.tenDichVu || service.name,
    moTa: service.moTa || service.description || '',
    chiPhi: service.chiPhi || service.price || 0,
    thoiGianThucHien: service.thoiGianThucHien || service.duration || '',
    icon: service.icon || service.icon || 'tools',
    trangThai: service.trangThai || service.active || true,
    danhMuc: service.danhMuc || service.category || '',
    yeuCau: service.yeuCau || service.requirements || [],
    baoHanh: service.baoHanh || service.warranty || 0
  });

  const mapServiceToApi = (service) => ({
    tenDichVu: service.tenDichVu,
    moTa: service.moTa,
    chiPhi: service.chiPhi,
    thoiGianThucHien: service.thoiGianThucHien,
    icon: service.icon,
    trangThai: service.trangThai,
    danhMuc: service.danhMuc,
    yeuCau: service.yeuCau,
    baoHanh: service.baoHanh
  });

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      setIsLoading(true);
      try {
        const data = await api.get('/api/v1/dich-vu');
        if (Array.isArray(data)) {
          setServices(data.map(mapServiceFromApi));
        }
      } catch (err) {
        console.error('Fetch services error', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchServices();
  }, []);

  const [services, setServices] = useState([
    {
      maDichVu: 1,
      tenDichVu: 'Lắp đặt tại nhà',
      moTa: 'Dịch vụ lắp đặt nội thất tại nhà khách hàng bởi đội ngũ thợ có kinh nghiệm',
      chiPhi: 500000,
      thoiGianThucHien: '2-4 giờ',
      icon: 'tools',
      status: 'active'
    },
    {
      maDichVu: 2,
      tenDichVu: 'Giao hàng nhanh',
      moTa: 'Dịch vụ giao hàng trong ngày tại nội thành và 1-2 ngày tại ngoại thành',
      chiPhi: 200000,
      thoiGianThucHien: '1-2 ngày',
      icon: 'delivery',
      status: 'active'
    },
    {
      maDichVu: 3,
      tenDichVu: 'Bảo hành mở rộng',
      moTa: 'Gia hạn bảo hành sản phẩm thêm 12 tháng ngoài thời gian bảo hành chuẩn',
      chiPhi: 300000,
      thoiGianThucHien: '12 tháng',
      icon: 'warranty',
      status: 'active'
    },
    {
      maDichVu: 4,
      tenDichVu: 'Hẹn giờ giao hàng',
      moTa: 'Dịch vụ giao hàng theo khung giờ yêu cầu của khách hàng (7h-22h)',
      chiPhi: 100000,
      thoiGianThucHien: 'Theo yêu cầu',
      icon: 'time',
      status: 'active'
    }
  ]);

  const [showModal, setShowModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  const [formData, setFormData] = useState({
    tenDichVu: '',
    moTa: '',
    chiPhi: '',
    thoiGianThucHien: '',
    icon: 'tools',
    status: 'active'
  });

  const iconOptions = [
    { value: 'tools', label: 'Công cụ', component: FaTools },
    { value: 'delivery', label: 'Giao hàng', component: FaTruck },
    { value: 'warranty', label: 'Bảo hành', component: FaShieldAlt },
    { value: 'time', label: 'Thời gian', component: FaClock },
    { value: 'home', label: 'Nhà', component: IoHome },
    { value: 'car', label: 'Xe', component: IoCar },
    { value: 'build', label: 'Xây dựng', component: IoBuild }
  ];

  // Filter services
  const filteredServices = services.filter(service => {
    const matchesSearch = service.tenDichVu.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.moTa.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === '' || service.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.tenDichVu.trim() || !formData.chiPhi) {
      showToast('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
      return;
    }

    // Check if service name already exists
    const exists = services.some(service => 
      service.tenDichVu.toLowerCase() === formData.tenDichVu.toLowerCase() &&
      service.maDichVu !== editingService?.maDichVu
    );

    if (exists) {
      showToast('Tên dịch vụ đã tồn tại', 'error');
      return;
    }

    if (editingService) {
      // Update existing service
      setServices(services.map(service =>
        service.maDichVu === editingService.maDichVu
          ? { 
              ...service, 
              tenDichVu: formData.tenDichVu,
              moTa: formData.moTa,
              chiPhi: parseFloat(formData.chiPhi),
              thoiGianThucHien: formData.thoiGianThucHien,
              icon: formData.icon,
              status: formData.status
            }
          : service
      ));
      showToast('Cập nhật dịch vụ thành công');
    } else {
      // Add new service
      const newService = {
        maDichVu: Math.max(...services.map(s => s.maDichVu), 0) + 1,
        tenDichVu: formData.tenDichVu,
        moTa: formData.moTa,
        chiPhi: parseFloat(formData.chiPhi),
        thoiGianThucHien: formData.thoiGianThucHien,
        icon: formData.icon,
        status: formData.status
      };
      setServices([...services, newService]);
      showToast('Thêm dịch vụ thành công');
    }

    closeModal();
  };

  const openModal = (service = null) => {
    setEditingService(service);
    setFormData({
      tenDichVu: service ? service.tenDichVu : '',
      moTa: service ? service.moTa : '',
      chiPhi: service ? service.chiPhi.toString() : '',
      thoiGianThucHien: service ? service.thoiGianThucHien : '',
      icon: service ? service.icon : 'tools',
      status: service ? service.status : 'active'
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingService(null);
    setFormData({
      tenDichVu: '',
      moTa: '',
      chiPhi: '',
      thoiGianThucHien: '',
      icon: 'tools',
      status: 'active'
    });
  };

  const handleDelete = (id) => {
    setDeleteId(id);
    setShowConfirmDialog(true);
  };

  const confirmDelete = () => {
    setServices(services.filter(service => service.maDichVu !== deleteId));
    setShowConfirmDialog(false);
    setDeleteId(null);
    showToast('Xóa dịch vụ thành công');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const getServiceIcon = (iconName, className = "text-2xl") => {
    const icon = iconOptions.find(opt => opt.value === iconName);
    if (!icon) return <FaTools className={className} />;
    const IconComponent = icon.component;
    return <IconComponent className={className} />;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">Hoạt động</span>;
      case 'inactive':
        return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">Tạm dừng</span>;
      default:
        return <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">Không rõ</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý Dịch vụ</h1>
              <p className="text-gray-600 mt-1">Quản lý các dịch vụ đi kèm như lắp đặt, giao hàng, bảo hành</p>
            </div>
            
            <button
              onClick={() => openModal()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <IoAdd className="text-lg" />
              Thêm dịch vụ
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm dịch vụ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Tạm dừng</option>
            </select>
          </div>
        </div>

        {/* Services Grid */}
        {filteredServices.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <IoSearch className="text-4xl text-gray-400 mb-4 mx-auto" />
            <p className="text-gray-500">Không tìm thấy dịch vụ nào</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <div key={service.maDichVu} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                {/* Service Header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getServiceIcon(service.icon)}
                      <div>
                        <h3 className="font-semibold text-lg">{service.tenDichVu}</h3>
                        <p className="text-blue-100 text-sm">#{service.maDichVu}</p>
                      </div>
                    </div>
                    {getStatusBadge(service.status)}
                  </div>
                </div>

                {/* Service Content */}
                <div className="p-6">
                  <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                    {service.moTa || 'Chưa có mô tả'}
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 flex items-center gap-2">
                        <IoPricetag className="text-xs" />
                        Chi phí:
                      </span>
                      <span className="font-semibold text-green-600">
                        {formatPrice(service.chiPhi)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 flex items-center gap-2">
                        <IoTime className="text-xs" />
                        Thời gian:
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        {service.thoiGianThucHien}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => openModal(service)}
                      className="flex-1 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <IoCreate className="text-sm" />
                      Chỉnh sửa
                    </button>
                    <button
                      onClick={() => handleDelete(service.maDichVu)}
                      className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg transition-colors flex items-center justify-center"
                    >
                      <IoTrash className="text-sm" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary Stats */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê dịch vụ</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{services.length}</div>
              <div className="text-sm text-blue-600">Tổng dịch vụ</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {services.filter(s => s.status === 'active').length}
              </div>
              <div className="text-sm text-green-600">Đang hoạt động</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {services.filter(s => s.status === 'inactive').length}
              </div>
              <div className="text-sm text-yellow-600">Tạm dừng</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatPrice(services.reduce((avg, service) => avg + service.chiPhi, 0) / services.length || 0)}
              </div>
              <div className="text-sm text-purple-600">Giá trung bình</div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showModal} onClose={closeModal} title={editingService ? 'Chỉnh sửa dịch vụ' : 'Thêm dịch vụ mới'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="tenDichVu" className="block text-sm font-medium text-gray-700 mb-1">
              Tên dịch vụ *
            </label>
            <input
              type="text"
              id="tenDichVu"
              value={formData.tenDichVu}
              onChange={(e) => setFormData({ ...formData, tenDichVu: e.target.value })}
              placeholder="Ví dụ: Lắp đặt tại nhà, Giao hàng nhanh..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="moTa" className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              id="moTa"
              value={formData.moTa}
              onChange={(e) => setFormData({ ...formData, moTa: e.target.value })}
              placeholder="Mô tả chi tiết về dịch vụ..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="chiPhi" className="block text-sm font-medium text-gray-700 mb-1">
                Chi phí (VND) *
              </label>
              <input
                type="number"
                id="chiPhi"
                value={formData.chiPhi}
                onChange={(e) => setFormData({ ...formData, chiPhi: e.target.value })}
                placeholder="500000"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="thoiGianThucHien" className="block text-sm font-medium text-gray-700 mb-1">
                Thời gian thực hiện
              </label>
              <input
                type="text"
                id="thoiGianThucHien"
                value={formData.thoiGianThucHien}
                onChange={(e) => setFormData({ ...formData, thoiGianThucHien: e.target.value })}
                placeholder="2-4 giờ"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Biểu tượng
            </label>
            <div className="grid grid-cols-4 gap-2">
              {iconOptions.map((option) => {
                const IconComponent = option.component;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: option.value })}
                    className={`p-2 rounded-lg border-2 transition-colors flex flex-col items-center gap-1 ${
                      formData.icon === option.value
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    <IconComponent className="text-lg" />
                    <span className="text-xs">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Trạng thái
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="active">Hoạt động</option>
              <option value="inactive">Tạm dừng</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
            >
              <IoClose />
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <IoSave />
              {editingService ? 'Cập nhật' : 'Thêm mới'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmDelete}
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa dịch vụ này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
      />

      {/* Toast */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ show: false, message: '', type: '' })}
        />
      )}
    </div>
  );
};

export default ServiceManagement;


