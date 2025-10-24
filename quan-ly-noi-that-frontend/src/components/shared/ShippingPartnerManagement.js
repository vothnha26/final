import React, { useState, useEffect } from 'react';
import { IoCar, IoAdd, IoCreate, IoTrash, IoEye, IoTime, IoCheckmarkCircle, IoRefresh, IoLocation, IoCall } from 'react-icons/io5';
import api from '../api';

const ShippingPartnerManagement = () => {
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [showPartnerModal, setShowPartnerModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Map shipping partner from API
  const mapPartnerFromApi = (partner) => ({
    id: partner.maDoiTac || partner.id,
    name: partner.tenDoiTac || partner.name,
    contactPerson: partner.nguoiLienHe || partner.contactPerson,
    phone: partner.soDienThoai || partner.phone,
    email: partner.email || partner.email,
    address: partner.diaChi || partner.address,
    serviceAreas: partner.khuVucPhucVu || partner.serviceAreas || [],
    deliveryTypes: partner.loaiVanChuyen || partner.deliveryTypes || [],
    priceList: partner.bangGia || partner.priceList || [],
    status: partner.trangThai || partner.active || true,
    rating: partner.danhGia || partner.rating || 0,
    completedOrders: partner.soDonHoanThanh || partner.completedOrders || 0,
    avgDeliveryTime: partner.thoiGianGiaoTrungBinh || partner.avgDeliveryTime || 0
  });

  const mapPartnerToApi = (partner) => ({
    tenDoiTac: partner.name,
    nguoiLienHe: partner.contactPerson,
    soDienThoai: partner.phone,
    email: partner.email,
    diaChi: partner.address,
    khuVucPhucVu: partner.serviceAreas,
    loaiVanChuyen: partner.deliveryTypes,
    bangGia: partner.priceList,
    trangThai: partner.status
  });

  // Fetch shipping partners
  useEffect(() => {
    const fetchShippingPartners = async () => {
      setIsLoading(true);
      try {
        const data = await api.get('/api/v1/doi-tac-van-chuyen');
        if (Array.isArray(data)) {
          setShippingPartners(data.map(mapPartnerFromApi));
        }
      } catch (err) {
        console.error('Fetch shipping partners error', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchShippingPartners();
  }, []);

  const [shippingPartners, setShippingPartners] = useState([
    {
      id: 'SP001',
      name: 'Viettel Post',
      contactPerson: 'Nguyễn Văn A',
      phone: '19008080',
      email: 'contact@viettelpost.vn',
      address: '123 Đường ABC, Quận 1, TP.HCM',
      status: 'active',
      rating: 4.5,
      totalDeliveries: 150,
      successRate: 98.5,
      averageDeliveryTime: '2.5 ngày',
      coverage: 'Toàn quốc',
      serviceTypes: ['Giao hàng nhanh', 'Giao hàng tiết kiệm', 'Giao hàng COD'],
      pricing: {
        standard: 25000,
        express: 45000,
        cod: 30000
      },
      createdBy: 'Lộc',
      createdAt: '2024-01-01'
    },
    {
      id: 'SP002',
      name: 'Giao Hàng Nhanh',
      contactPerson: 'Trần Thị B',
      phone: '19001234',
      email: 'info@ghn.vn',
      address: '456 Đường XYZ, Quận 2, TP.HCM',
      status: 'active',
      rating: 4.3,
      totalDeliveries: 200,
      successRate: 97.2,
      averageDeliveryTime: '1.8 ngày',
      coverage: 'Miền Nam',
      serviceTypes: ['Giao hàng nhanh', 'Giao hàng siêu tốc'],
      pricing: {
        standard: 20000,
        express: 35000,
        cod: 25000
      },
      createdBy: 'Lộc',
      createdAt: '2024-01-05'
    },
    {
      id: 'SP003',
      name: 'J&T Express',
      contactPerson: 'Lê Văn C',
      phone: '19001235',
      email: 'support@jtexpress.vn',
      address: '789 Đường DEF, Quận 3, TP.HCM',
      status: 'inactive',
      rating: 4.1,
      totalDeliveries: 80,
      successRate: 95.8,
      averageDeliveryTime: '3.2 ngày',
      coverage: 'Toàn quốc',
      serviceTypes: ['Giao hàng tiết kiệm', 'Giao hàng COD'],
      pricing: {
        standard: 18000,
        express: 30000,
        cod: 22000
      },
      createdBy: 'Lộc',
      createdAt: '2024-01-10'
    }
  ]);

  const [deliveryStats] = useState([
    {
      partner: 'Viettel Post',
      today: 15,
      thisWeek: 95,
      thisMonth: 380,
      successRate: 98.5
    },
    {
      partner: 'Giao Hàng Nhanh',
      today: 22,
      thisWeek: 140,
      thisMonth: 520,
      successRate: 97.2
    },
    {
      partner: 'J&T Express',
      today: 8,
      thisWeek: 45,
      thisMonth: 180,
      successRate: 95.8
    }
  ]);

  const statusConfig = {
    active: { color: 'text-green-600', bg: 'bg-green-100', icon: IoCheckmarkCircle, label: 'Hoạt động' },
    inactive: { color: 'text-red-600', bg: 'bg-red-100', icon: IoTime, label: 'Ngừng hoạt động' },
    pending: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: IoTime, label: 'Chờ duyệt' }
  };

  const getStatusInfo = (status) => {
    return statusConfig[status] || statusConfig.pending;
  };

  const handleViewPartner = (partner) => {
    setSelectedPartner(partner);
    setShowPartnerModal(true);
  };

  const handleAddPartner = () => {
    setShowAddModal(true);
  };

  const handleEditPartner = (partner) => {
    setSelectedPartner(partner);
    setShowPartnerModal(true);
  };

  const handleDeletePartner = (partner) => {
    if (window.confirm(`Bạn có chắc muốn xóa đối tác ${partner.name}?`)) {
      console.log('Deleting partner:', partner.id);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý đối tác vận chuyển</h1>
          <p className="text-gray-600">Quản lý thông tin đối tác vận chuyển và theo dõi hiệu suất</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <IoCar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng đối tác</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <IoCheckmarkCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Đang hoạt động</p>
                <p className="text-2xl font-bold text-gray-900">2</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <IoCar className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng giao hàng</p>
                <p className="text-2xl font-bold text-gray-900">430</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <IoTime className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tỷ lệ thành công</p>
                <p className="text-2xl font-bold text-gray-900">97.2%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Partners List */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Danh sách đối tác vận chuyển</h3>
            <div className="flex items-center space-x-2">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <IoRefresh className="w-4 h-4" />
                Làm mới
              </button>
              <button 
                onClick={handleAddPartner}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                <IoAdd className="w-4 h-4" />
                Thêm đối tác
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đối tác
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Liên hệ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đánh giá
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Giao hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {shippingPartners.map((partner) => {
                  const statusInfo = getStatusInfo(partner.status);
                  
                  return (
                    <tr key={partner.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{partner.name}</div>
                        <div className="text-sm text-gray-500">{partner.id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{partner.contactPerson}</div>
                        <div className="text-sm text-gray-500">{partner.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">{partner.rating}</span>
                          <span className="text-sm text-gray-500 ml-1">/5</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{partner.totalDeliveries} giao</div>
                        <div className="text-sm text-gray-500">{partner.successRate}% thành công</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewPartner(partner)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <IoEye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleEditPartner(partner)}
                            className="text-green-600 hover:text-green-800"
                          >
                            <IoCreate className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDeletePartner(partner)}
                            className="text-red-600 hover:text-red-800"
                          >
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

        {/* Partner Detail Modal */}
        {showPartnerModal && selectedPartner && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Chi tiết đối tác vận chuyển
                  </h3>
                  <button
                    onClick={() => setShowPartnerModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <IoRefresh className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Partner Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Thông tin cơ bản</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Tên đối tác:</span>
                          <span className="text-sm font-medium">{selectedPartner.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Mã đối tác:</span>
                          <span className="text-sm font-medium">{selectedPartner.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Người liên hệ:</span>
                          <span className="text-sm font-medium">{selectedPartner.contactPerson}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Điện thoại:</span>
                          <span className="text-sm font-medium">{selectedPartner.phone}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Email:</span>
                          <span className="text-sm font-medium">{selectedPartner.email}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Thông tin hiệu suất</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Đánh giá:</span>
                          <span className="text-sm font-medium">{selectedPartner.rating}/5</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Tổng giao hàng:</span>
                          <span className="text-sm font-medium">{selectedPartner.totalDeliveries}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Tỷ lệ thành công:</span>
                          <span className="text-sm font-medium">{selectedPartner.successRate}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Thời gian TB:</span>
                          <span className="text-sm font-medium">{selectedPartner.averageDeliveryTime}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Trạng thái:</span>
                          <span className={`text-sm font-medium ${getStatusInfo(selectedPartner.status).color}`}>
                            {getStatusInfo(selectedPartner.status).label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Address and Coverage */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Địa chỉ</h4>
                      <div className="flex items-start gap-2">
                        <IoLocation className="w-4 h-4 text-gray-500 mt-1" />
                        <span className="text-sm text-gray-900">{selectedPartner.address}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Phạm vi hoạt động</h4>
                      <div className="text-sm text-gray-900">{selectedPartner.coverage}</div>
                    </div>
                  </div>

                  {/* Service Types */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Loại dịch vụ</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedPartner.serviceTypes.map((service, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Pricing */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Bảng giá</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600">Giao hàng tiêu chuẩn</div>
                        <div className="text-lg font-medium text-gray-900">{formatCurrency(selectedPartner.pricing.standard)}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600">Giao hàng nhanh</div>
                        <div className="text-lg font-medium text-gray-900">{formatCurrency(selectedPartner.pricing.express)}</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="text-sm text-gray-600">Giao hàng COD</div>
                        <div className="text-lg font-medium text-gray-900">{formatCurrency(selectedPartner.pricing.cod)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => setShowPartnerModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Đóng
                    </button>
                    <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                      Chỉnh sửa
                    </button>
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

export default ShippingPartnerManagement;



