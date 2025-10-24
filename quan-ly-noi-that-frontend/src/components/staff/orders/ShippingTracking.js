import React, { useState, useEffect } from 'react';
import { IoSearch, IoLocation, IoTime, IoCheckmarkCircle, IoCar, IoStorefront, IoPerson, IoCall, IoRefresh, IoClose } from 'react-icons/io5';
import api from '../../../api';

const ShippingTracking = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Map shipping data from API
  const mapShippingFromApi = (shipping) => ({
    id: shipping.maDonHang || shipping.id,
    orderNumber: shipping.soDonHang || shipping.orderNumber,
    trackingNumber: shipping.maVanDon || shipping.trackingNumber,
    status: mapShippingStatus(shipping.trangThaiVanChuyen || shipping.status),
    currentLocation: shipping.viTriHienTai || shipping.currentLocation,
    destination: shipping.diaChiGiaoHang || shipping.destination,
    estimatedDelivery: shipping.ngayGiaoDuKien || shipping.estimatedDelivery,
    carrier: shipping.donViVanChuyen || shipping.carrier,
    driverName: shipping.tenTaiXe || shipping.driverName,
    driverPhone: shipping.soDienThoaiTaiXe || shipping.driverPhone,
    trackingHistory: shipping.lichSuVanChuyen?.map(history => ({
      timestamp: history.thoiGian || history.timestamp,
      status: history.trangThai || history.status,
      location: history.viTri || history.location,
      description: history.moTa || history.description
    })) || []
  });

  const mapShippingStatus = (status) => {
    const statusMap = {
      'Chờ lấy hàng': 'pending_pickup',
      'Đang vận chuyển': 'in_transit',
      'Đang giao hàng': 'out_for_delivery',
      'Đã giao hàng': 'delivered',
      'Giao hàng thất bại': 'delivery_failed'
    };
    return statusMap[status] || status;
  };

  // Search tracking by number
  const handleTrackingSearch = async () => {
    if (!trackingNumber.trim()) return;
    
    setIsSearching(true);
    try {
      const data = await api.get(`/api/v1/van-chuyen/tracking/${trackingNumber}`);
      setSearchResult(mapShippingFromApi(data));
    } catch (err) {
      setError(err);
      setSearchResult(null);
    } finally {
      setIsSearching(false);
    }
  };

  const [orders, setOrders] = useState([]);

  // Fetch recent orders/shipments
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await api.get('/api/v1/van-chuyen/don-hang');
        if (Array.isArray(data)) {
          setOrders(data.map(order => ({
            id: order.maDonHang || order.id,
            orderNumber: order.soDonHang || order.orderNumber,
            trackingNumber: order.maVanDon || order.trackingNumber,
            customer: order.khachHang?.hoTen || order.customerName || '',
            phone: order.khachHang?.soDienThoai || order.customerPhone || '',
            address: order.diaChiGiaoHang || order.shippingAddress || '',
            status: mapShippingStatus(order.trangThaiVanChuyen || order.status),
            estimatedDelivery: order.ngayGiaoDuKien || order.estimatedDelivery,
            actualDelivery: order.ngayGiaoThucTe || order.actualDelivery,
            carrier: order.donViVanChuyen || order.carrier,
            driver: order.tenTaiXe || order.driverName,
            driverPhone: order.soDienThoaiTaiXe || order.driverPhone,
            timeline: order.lichSuVanChuyen?.map(history => ({
              status: history.trangThai || history.status,
              time: history.thoiGian || history.timestamp,
              location: history.viTri || history.location,
              description: history.moTa || history.description
            })) || []
          })));
        }
      } catch (err) {
        
      }
    };
    fetchOrders();
  }, []);

  const statusConfig = {
    pending: { color: 'text-gray-600', bg: 'bg-gray-100', icon: IoTime, label: 'Chờ xác nhận' },
    confirmed: { color: 'text-blue-600', bg: 'bg-blue-100', icon: IoCheckmarkCircle, label: 'Đã xác nhận' },
    processing: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: IoTime, label: 'Đang xử lý' },
    shipped: { color: 'text-purple-600', bg: 'bg-purple-100', icon: IoCar, label: 'Đã xuất kho' },
    in_transit: { color: 'text-orange-600', bg: 'bg-orange-100', icon: IoLocation, label: 'Đang vận chuyển' },
    delivered: { color: 'text-green-600', bg: 'bg-green-100', icon: IoCheckmarkCircle, label: 'Đã giao hàng' },
    cancelled: { color: 'text-red-600', bg: 'bg-red-100', icon: IoClose, label: 'Đã hủy' }
  };

  const handleSearch = () => {
    if (!trackingNumber.trim()) return;
    
    setIsSearching(true);
    setTimeout(() => {
      const result = orders.find(order => 
        order.trackingNumber.toLowerCase().includes(trackingNumber.toLowerCase()) ||
        order.id.toLowerCase().includes(trackingNumber.toLowerCase())
      );
      setSearchResult(result);
      setIsSearching(false);
    }, 1000);
  };

  const getStatusInfo = (status) => {
    return statusConfig[status] || statusConfig.confirmed;
  };

  const handleUpdateStatus = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setNewLocation('');
    setNewDescription('');
    setShowUpdateModal(true);
  };

  const handleSaveStatusUpdate = () => {
    if (!selectedOrder || !newStatus) return;
    
    const newTimelineEntry = {
      status: newStatus,
      time: new Date().toLocaleString('vi-VN'),
      location: newLocation || 'Hệ thống',
      description: newDescription || `Cập nhật trạng thái: ${statusConfig[newStatus]?.label}`
    };

    // Update the order status and timeline
    const updatedOrder = {
      ...selectedOrder,
      status: newStatus,
      timeline: [...selectedOrder.timeline, newTimelineEntry]
    };

    // Update the orders array (in real app, this would be an API call)    
    setShowUpdateModal(false);
    setSelectedOrder(null);
    setNewStatus('');
    setNewLocation('');
    setNewDescription('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Theo dõi giao hàng</h1>
          <p className="text-gray-600">Tra cứu trạng thái giao hàng và vận chuyển</p>
        </div>

        {/* Search Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tra cứu đơn hàng</h3>
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Nhập mã đơn hàng hoặc mã vận đơn"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching || !trackingNumber.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? (
                <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <IoSearch className="w-5 h-5" />
              )}
              {isSearching ? 'Đang tìm...' : 'Tra cứu'}
            </button>
          </div>
        </div>

        {/* Search Results */}
        {searchResult ? (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Kết quả tra cứu</h3>
                <p className="text-gray-600">Mã đơn hàng: {searchResult.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSearchResult(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <IoRefresh className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Order Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Thông tin khách hàng</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <IoPerson className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{searchResult.customer}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IoCall className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{searchResult.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IoLocation className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{searchResult.address}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Thông tin giao hàng</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <IoCar className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{searchResult.carrier}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IoPerson className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Tài xế: {searchResult.driver}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <IoCall className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{searchResult.driverPhone}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Status Timeline */}
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Lịch sử giao hàng</h4>
              <div className="space-y-4">
                {searchResult.timeline.map((step, index) => {
                  const statusInfo = getStatusInfo(step.status);
                  const IconComponent = statusInfo.icon;
                  const isLast = index === searchResult.timeline.length - 1;
                  
                  return (
                    <div key={index} className="flex items-start space-x-4">
                      <div className={`p-2 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium text-gray-900">{statusInfo.label}</h5>
                          <span className="text-sm text-gray-500">{step.time}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{step.location}</p>
                      </div>
                      {!isLast && (
                        <div className="w-px h-8 bg-gray-200 ml-6"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : searchResult === null && trackingNumber ? (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <IoSearch className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy đơn hàng</h3>
            <p className="text-gray-500">Vui lòng kiểm tra lại mã đơn hàng hoặc mã vận đơn</p>
          </div>
        ) : null}

        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Đơn hàng gần đây</h3>
          <div className="space-y-4">
            {orders.map((order) => {
              const statusInfo = getStatusInfo(order.status);
              const IconComponent = statusInfo.icon;
              
              return (
                <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{order.id}</h4>
                        <p className="text-sm text-gray-600">{order.customer}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">
                        Dự kiến: {order.estimatedDelivery}
                      </p>
                      <button
                        onClick={() => handleUpdateStatus(order)}
                        className="mt-2 px-3 py-1 bg-primary text-white text-xs rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Cập nhật trạng thái
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Update Status Modal */}
        {showUpdateModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Cập nhật trạng thái đơn hàng
                  </h3>
                  <button
                    onClick={() => setShowUpdateModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <IoClose className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Đơn hàng: {selectedOrder.id}
                    </label>
                    <p className="text-sm text-gray-600">{selectedOrder.customer}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trạng thái mới
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <option key={key} value={key}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vị trí (tùy chọn)
                    </label>
                    <input
                      type="text"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Nhập vị trí hiện tại"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Ghi chú (tùy chọn)
                    </label>
                    <textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Nhập ghi chú về trạng thái"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowUpdateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveStatusUpdate}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Cập nhật
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShippingTracking;


