import React, { useState } from 'react';
import { IoCube, IoAlertCircle, IoTrendingDown, IoTrendingUp, IoCheckmarkCircle, IoTime, IoStorefront, IoReceipt, IoPerson } from 'react-icons/io5';

const WarehouseDashboard = () => {
  const [timeRange, setTimeRange] = useState('today');

  // Mock data
  const stats = {
    today: {
      totalProducts: 1245,
      lowStock: 12,
      outOfStock: 3,
      incoming: 8,
      outgoing: 24,
      growth: -2.1
    },
    week: {
      totalProducts: 1245,
      lowStock: 45,
      outOfStock: 8,
      incoming: 56,
      outgoing: 156,
      growth: 5.3
    },
    month: {
      totalProducts: 1245,
      lowStock: 156,
      outOfStock: 23,
      incoming: 234,
      outgoing: 624,
      growth: 12.7
    }
  };

  const currentStats = stats[timeRange];

  const lowStockProducts = [
    {
      id: 1,
      name: 'Ghế gỗ cao cấp',
      sku: 'CHAIR001',
      currentStock: 5,
      minStock: 10,
      status: 'low'
    },
    {
      id: 2,
      name: 'Bàn ăn 6 người',
      sku: 'TABLE002',
      currentStock: 2,
      minStock: 8,
      status: 'critical'
    },
    {
      id: 3,
      name: 'Giường ngủ gỗ',
      sku: 'BED003',
      currentStock: 0,
      minStock: 5,
      status: 'out'
    }
  ];

  const recentMovements = [
    {
      id: 1,
      type: 'incoming',
      product: 'Ghế sofa 3 chỗ',
      quantity: 20,
      time: '10:30',
      status: 'completed'
    },
    {
      id: 2,
      type: 'outgoing',
      product: 'Bàn ăn 6 người',
      quantity: 5,
      time: '09:15',
      status: 'processing'
    },
    {
      id: 3,
      type: 'incoming',
      product: 'Tủ quần áo 3 cánh',
      quantity: 15,
      time: '08:45',
      status: 'completed'
    }
  ];

  const alerts = [
    {
      id: 1,
      type: 'critical',
      message: 'Sản phẩm "Giường ngủ gỗ" đã hết hàng',
      time: '5 phút trước',
      action: 'Nhập hàng ngay'
    },
    {
      id: 2,
      type: 'warning',
      message: 'Sản phẩm "Bàn ăn 6 người" sắp hết hàng',
      time: '15 phút trước',
      action: 'Kiểm tra tồn kho'
    },
    {
      id: 3,
      type: 'info',
      message: 'Đơn hàng #ORD004 cần chuẩn bị hàng',
      time: '30 phút trước',
      action: 'Xem chi tiết'
    }
  ];

  const getStatusColor = (status) => {
    const colors = {
      low: 'text-yellow-600 bg-yellow-100',
      critical: 'text-orange-600 bg-orange-100',
      out: 'text-red-600 bg-red-100',
      completed: 'text-green-600 bg-green-100',
      processing: 'text-blue-600 bg-blue-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  const getStatusLabel = (status) => {
    const labels = {
      low: 'Sắp hết',
      critical: 'Nguy hiểm',
      out: 'Hết hàng',
      completed: 'Hoàn thành',
      processing: 'Đang xử lý'
    };
    return labels[status] || status;
  };

  const getAlertColor = (type) => {
    const colors = {
      critical: 'text-red-600 bg-red-100',
      warning: 'text-yellow-600 bg-yellow-100',
      info: 'text-blue-600 bg-blue-100'
    };
    return colors[type] || 'text-gray-600 bg-gray-100';
  };

  const getAlertIcon = (type) => {
    const icons = {
      critical: IoAlertCircle,
      warning: IoTime,
      info: IoCheckmarkCircle
    };
    return icons[type] || IoAlertCircle;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Kho hàng</h1>
              <p className="text-gray-600">Quản lý tồn kho và vận chuyển</p>
            </div>
            <div className="flex items-center gap-4">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="today">Hôm nay</option>
                <option value="week">Tuần này</option>
                <option value="month">Tháng này</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <IoCube className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng sản phẩm</p>
                <p className="text-2xl font-bold text-gray-900">{currentStats.totalProducts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <IoAlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sắp hết</p>
                <p className="text-2xl font-bold text-gray-900">{currentStats.lowStock}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-red-100 rounded-lg">
                <IoAlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Hết hàng</p>
                <p className="text-2xl font-bold text-gray-900">{currentStats.outOfStock}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <IoTrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Nhập kho</p>
                <p className="text-2xl font-bold text-gray-900">{currentStats.incoming}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <IoTrendingDown className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Xuất kho</p>
                <p className="text-2xl font-bold text-gray-900">{currentStats.outgoing}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <IoTrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tăng trưởng</p>
                <p className={`text-2xl font-bold ${currentStats.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {currentStats.growth > 0 ? '+' : ''}{currentStats.growth}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Low Stock Products */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Sản phẩm sắp hết hàng</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {lowStockProducts.map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <IoCube className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {product.currentStock} / {product.minStock}
                        </p>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(product.status)}`}>
                          {getStatusLabel(product.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <button className="text-primary hover:text-primary/80 font-medium">
                    Xem tất cả sản phẩm
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Cảnh báo</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {alerts.map((alert) => {
                    const Icon = getAlertIcon(alert.type);
                    return (
                      <div key={alert.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`p-2 rounded-full ${getAlertColor(alert.type)}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{alert.message}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">{alert.time}</span>
                            <button className="text-xs text-primary hover:text-primary/80 font-medium">
                              {alert.action}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 text-center">
                  <button className="text-primary hover:text-primary/80 font-medium">
                    Xem tất cả cảnh báo
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Movements */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Hoạt động gần đây</h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentMovements.map((movement) => (
                  <div key={movement.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        movement.type === 'incoming' ? 'bg-green-100' : 'bg-orange-100'
                      }`}>
                        {movement.type === 'incoming' ? (
                          <IoTrendingUp className="w-5 h-5 text-green-600" />
                        ) : (
                          <IoTrendingDown className="w-5 h-5 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{movement.product}</p>
                        <p className="text-sm text-gray-500">
                          {movement.type === 'incoming' ? 'Nhập kho' : 'Xuất kho'}: {movement.quantity} sản phẩm
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(movement.status)}`}>
                        {getStatusLabel(movement.status)}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{movement.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Thao tác nhanh</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <IoCube className="w-8 h-8 text-primary mb-2" />
                <span className="text-sm font-medium">Quản lý tồn kho</span>
              </button>
              <button className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <IoReceipt className="w-8 h-8 text-primary mb-2" />
                <span className="text-sm font-medium">Nhập hàng</span>
              </button>
              <button className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <IoTrendingDown className="w-8 h-8 text-primary mb-2" />
                <span className="text-sm font-medium">Xuất hàng</span>
              </button>
              <button className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <IoAlertCircle className="w-8 h-8 text-primary mb-2" />
                <span className="text-sm font-medium">Cảnh báo tồn kho</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WarehouseDashboard;



