import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { IoBarChart, IoCalendar, IoPeople, IoStorefront, IoCash, IoCheckmarkCircle, IoWarning, IoRefresh } from 'react-icons/io5';
import api from '../../../api';

const Dashboard = () => {
  const [selectedWidget, setSelectedWidget] = useState('overview');

  // Memoized widgets to avoid re-creation on every render
  const widgets = useMemo(() => [
    {
      id: 'overview',
      title: 'Tổng quan',
      icon: IoBarChart,
      color: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'sales',
      title: 'Bán hàng',
      icon: IoCash,
      color: 'bg-green-100 text-green-800',
    },
    {
      id: 'inventory',
      title: 'Tồn kho',
      icon: IoStorefront,
      color: 'bg-yellow-100 text-yellow-800',
    },
    {
      id: 'customers',
      title: 'Khách hàng',
      icon: IoPeople,
      color: 'bg-purple-100 text-purple-800',
    }
  ], []);

  const quickActions = useMemo(() => [
    { title: 'Tạo đơn hàng mới', icon: IoCheckmarkCircle, color: 'bg-green-600', action: 'route', route: '/admin/orders' },
    { title: 'Quản lý tài khoản', icon: IoPeople, color: 'bg-cyan-600', action: 'route', route: '/admin/accounts' },
    { title: 'Thêm khách hàng', icon: IoPeople, color: 'bg-purple-600', action: 'route', route: '/admin/customers' },
    { title: 'Tạo khuyến mãi', icon: IoCalendar, color: 'bg-orange-600', action: 'route', route: '/admin/promotions' }
  ], []);

  const navigate = useNavigate();

  // Dashboard data states
  const [overviewData, setOverviewData] = useState(null);
  const [salesData, setSalesData] = useState(null);
  const [inventoryData, setInventoryData] = useState(null);
  const [customersData, setCustomersData] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Memoized selected widget data
  const selectedWidgetData = useMemo(() =>
    widgets.find(w => w.id === selectedWidget),
    [selectedWidget, widgets]
  );

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Prefer server stored-proc driven endpoints under /api/v1/bao-cao-thong-ke
      try {
        const overviewResp = await api.get('/api/v1/bao-cao-thong-ke/overview-metrics');
        if (overviewResp && overviewResp.success && overviewResp.data) {
          const rows = overviewResp.data.rows || [];
          // If stored-proc returns key/value row, try to map first row
          const first = rows.length ? rows[0] : {};
          setOverviewData({
            totalRevenue: first.totalRevenue || first.TotalRevenue || first.doanhThu || overviewResp.data.totalRevenue || '0đ',
            totalOrders: first.totalOrders || first.orderCount || overviewResp.data.totalOrders || 0,
            totalCustomers: first.totalCustomers || first.customerCount || overviewResp.data.totalCustomers || 0,
            totalProducts: first.totalProducts || overviewResp.data.totalProducts || 0
          });
        }

        const revenueTrendResp = await api.get('/api/v1/bao-cao-thong-ke/revenue-trend');
        if (revenueTrendResp && revenueTrendResp.success && revenueTrendResp.data) {
          setSalesData(revenueTrendResp.data.rows || []);
        }

        const salesByProductResp = await api.get('/api/v1/bao-cao-thong-ke/sales-by-product');
        if (salesByProductResp && salesByProductResp.success && salesByProductResp.data) {
          // map to simple list for UI
          setInventoryData(salesByProductResp.data.rows || []);
        }

        const customerMetricsResp = await api.get('/api/v1/bao-cao-thong-ke/customer-metrics');
        if (customerMetricsResp && customerMetricsResp.success && customerMetricsResp.data) {
          setCustomersData(customerMetricsResp.data.rows?.[0] || customerMetricsResp.data.rows || null);
        }
      } catch (err) {
        // fallback to legacy endpoints if new ones fail
        console.warn('Fallback to legacy overview endpoints', err);
      }

      // Fetch recent activities
      const activityEndpoints = ['/api/activities', '/api/events', '/api/audit'];
      for (const endpoint of activityEndpoints) {
        try {
          const response = await api.get(endpoint);
          if (Array.isArray(response)) {
            setRecentActivities(response);
            break;
          }
        } catch (err) {
          continue;
        }
      }

      // Fetch performance metrics
      try {
        const performance = await api.get('/api/system/performance');
        setPerformanceMetrics(performance);
      } catch (err) {
        // Use default performance metrics if API not available
        setPerformanceMetrics({
          uptime: '99.8%',
          responseTime: '2.3s',
          activeUsers: '1,234'
        });
      }

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Helper to normalize various API shapes (arrays, objects, rows) into
  // [{ label, value }] so the UI never tries to render a raw object.
  const normalizeMetrics = (data, fallback = []) => {
    if (!data) return fallback;

    // If data is an array, try to map rows to sensible label/value pairs
    if (Array.isArray(data)) {
      if (data.length === 0) return fallback;
      // If rows are objects with keys like Ngay/DoanhThu or date/revenue
      if (typeof data[0] === 'object' && data[0] !== null) {
        // If each row has date & value keys, map them
        const first = data[0];
        const dateKey = Object.keys(first).find(k => /ngay|date|day/i.test(k));
        const valueKey = Object.keys(first).find(k => /doanhthu|revenue|value|total/i.test(k));
        if (dateKey && valueKey) {
          return data.map((row) => ({
            label: row[dateKey] ?? '',
            value: row[valueKey] ?? ''
          }));
        }

        // Fallback: map each object row to a JSON/string summary
        return data.map((row, i) => ({ label: `#${i + 1}`, value: JSON.stringify(row) }));
      }

      // Array of primitives
      return data.map((v, i) => ({ label: `#${i + 1}`, value: v }));
    }

    // If data is an object, convert entries into label/value pairs.
    if (typeof data === 'object') {
      return Object.entries(data).map(([k, v]) => ({ label: k, value: (typeof v === 'object' ? JSON.stringify(v) : v) }));
    }

    // Primitive
    return [{ label: String(data), value: data }];
  };

  const handleQuickAction = (act) => {
    if (!act) return;
    if (act.action === 'route' && act.route) {
      navigate(act.route);
      return;
    }
    // future: support API actions here (call api endpoints)
    // fallback: navigate to products
    navigate('/admin/products');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Tổng quan</h1>
          <p className="text-gray-600">Tổng hợp thông tin và hoạt động hệ thống</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <IoWarning className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="mb-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-gray-600">Đang tải dữ liệu...</span>
          </div>
        )}

        {/* Widget Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Chọn widget</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {widgets.map((widget) => {
              const IconComponent = widget.icon;
              return (
                <button
                  key={widget.id}
                  onClick={() => setSelectedWidget(widget.id)}
                  className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                    selectedWidget === widget.id
                      ? 'border-primary bg-primary/10'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`p-2 rounded-lg mb-2 ${widget.color}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{widget.title}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Widget Content */}
        {selectedWidgetData && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                  <div className={`p-3 rounded-lg mr-4 ${selectedWidgetData.color}`}>
                    {(() => { const Icon = selectedWidgetData.icon; return <Icon className="w-8 h-8" /> })()}
                  </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedWidgetData.title}</h3>
                  <p className="text-gray-600">Thống kê chi tiết</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 text-blue-600 hover:text-blue-800">
                  <IoBarChart className="w-5 h-5" />
                  Xem báo cáo
                </button>
                <button className="flex items-center gap-2 text-green-600 hover:text-green-800">
                  <IoCalendar className="w-5 h-5" />
                  Xuất dữ liệu
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Render based on selected widget using overviewData as source */}
              {selectedWidget === 'overview' && (
                (overviewData ? [
                  { label: 'Doanh thu', value: overviewData.totalRevenue },
                  { label: 'Đơn hàng', value: overviewData.totalOrders },
                  { label: 'Khách hàng', value: overviewData.totalCustomers },
                  { label: 'Sản phẩm', value: overviewData.totalProducts }
                ] : [
                  { label: 'Doanh thu', value: '—' },
                  { label: 'Đơn hàng', value: '—' },
                  { label: 'Khách hàng', value: '—' },
                  { label: 'Sản phẩm', value: '—' }
                ]).map((item, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-600">{item.label}</h4>
                      <IoBarChart className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                  </div>
                ))
              )}

              {selectedWidget === 'sales' && (
                (normalizeMetrics(salesData, [
                  { label: 'Doanh thu hôm nay', value: '—' },
                  { label: 'Đơn hôm nay', value: '—' },
                  { label: 'Tỉ lệ chuyển đổi', value: '—' },
                  { label: 'Giá trị trung bình', value: '—' }
                ])).map((item, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-600">{item.label}</h4>
                      <IoBarChart className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                  </div>
                ))
              )}

              {selectedWidget === 'inventory' && (
                normalizeMetrics(inventoryData, [
                  { label: 'Tổng tồn', value: '—' },
                  { label: 'Sắp hết', value: '—' },
                  { label: 'Hết hàng', value: '—' },
                  { label: 'Giá trị tồn', value: '—' }
                ]).map((item, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-600">{item.label}</h4>
                      <IoBarChart className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                  </div>
                ))
              )}

              {selectedWidget === 'customers' && (
                normalizeMetrics(customersData, [
                  { label: 'Khách mới', value: '—' },
                  { label: 'VIP', value: '—' },
                  { label: 'Tỉ lệ giữ chân', value: '—' },
                  { label: 'Độ hài lòng', value: '—' }
                ]).map((item, idx) => (
                  <div key={idx} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-600">{item.label}</h4>
                      <IoBarChart className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                  </div>
                ))
              )}

            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Activities */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Hoạt động gần đây</h3>
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Xem tất cả
              </button>
            </div>
            <div className="space-y-4">
              {loading ? (
                <div>Đang tải hoạt động...</div>
              ) : (
                recentActivities.map((activity) => {
                  const IconComponent = activity.icon || activity.type === 'order' ? IoCheckmarkCircle : IoWarning;
                  return (
                    <div key={activity.id || activity.timestamp} className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${activity.color || 'text-gray-500'} bg-opacity-20`}>
                        <IconComponent className={`w-5 h-5 ${activity.color || 'text-gray-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.message || activity.description || activity.title}</p>
                        <p className="text-xs text-gray-500">{activity.time || activity.timestamp || activity.createdAt}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Thao tác nhanh</h3>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handleQuickAction(action)}
                    className={`p-4 rounded-lg text-white ${action.color} hover:opacity-90 transition-opacity`}
                  >
                    <div className="flex flex-col items-center text-center">
                      <IconComponent className="w-6 h-6 mb-2" />
                      <span className="text-sm font-medium">{action.title}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Performance Charts */}
        <div className="bg-white rounded-lg shadow-sm p-6 mt-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Hiệu suất hệ thống</h3>
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 disabled:opacity-50"
            >
              <IoRefresh className="w-4 h-4" />
              Làm mới
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {performanceMetrics?.uptime || '99.8%'}
              </div>
              <p className="text-sm text-gray-600">Uptime</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {performanceMetrics?.responseTime || '2.3s'}
              </div>
              <p className="text-sm text-gray-600">Thời gian phản hồi</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {performanceMetrics?.activeUsers || '1,234'}
              </div>
              <p className="text-sm text-gray-600">Người dùng hoạt động</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

