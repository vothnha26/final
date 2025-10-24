import React, { useState, useEffect } from 'react';
import {
  IoCash,
  IoTrendingUp,
  IoCart,
  IoPieChart,
  IoCalendar,
  IoRefresh,
  IoDownload,
  IoStatsChart
} from 'react-icons/io5';
import {
  Line,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';
import api from '../../../../api';

const FinancialReport = ({ startDate: propStartDate, endDate: propEndDate }) => {
  const [loading, setLoading] = useState(false);
  
  // Use props if provided, otherwise use default dates
  const [startDate, setStartDate] = useState(() => {
    if (propStartDate) return propStartDate;
    const date = new Date();
    date.setDate(date.getDate() - 30); // 30 ngày trước
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    if (propEndDate) return propEndDate;
    return new Date().toISOString().split('T')[0];
  });
  
  // Update local state when props change
  useEffect(() => {
    if (propStartDate) setStartDate(propStartDate);
    if (propEndDate) setEndDate(propEndDate);
  }, [propStartDate, propEndDate]);

  // Data states
  const [summary, setSummary] = useState(null);
  const [trendData, setTrendData] = useState([]);
  const [costStructure, setCostStructure] = useState([]);
  const [orderDistribution, setOrderDistribution] = useState([]);
  const [waterfallData, setWaterfallData] = useState([]);

  useEffect(() => {
    fetchReportData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Fetch all report data in parallel
      const [summaryRes, trendRes, costRes, distributionRes, waterfallRes] = await Promise.all([
        api.post('/api/v1/reports/financial', {
          action: 'Financial_Summary',
          startDate,
          endDate
        }),
        api.post('/api/v1/reports/financial', {
          action: 'Financial_Trend',
          startDate,
          endDate
        }),
        api.post('/api/v1/reports/financial', {
          action: 'Financial_CostStructure',
          startDate,
          endDate
        }),
        api.post('/api/v1/reports/financial', {
          action: 'Financial_OrderDistribution',
          startDate,
          endDate
        }),
        api.post('/api/v1/reports/financial', {
          action: 'Financial_Waterfall',
          startDate,
          endDate
        })
      ]);

      // Process summary data
      const summaryData = summaryRes?.data?.[0] || summaryRes?.[0] || {};
      setSummary(summaryData);

      // Helpers to read keys with different casings/aliases returned by SQL
      const pick = (obj, keys, fallback = undefined) => {
        for (const k of keys) {
          if (obj && Object.prototype.hasOwnProperty.call(obj, k) && obj[k] != null) return obj[k];
        }
        return fallback;
      };

      // Process trend data
      const trends = trendRes?.data || trendRes || [];
      setTrendData(trends.map(item => {
        const rawDate = pick(item, ['ngay', 'Ngay', 'NGAY', 'date', 'Date']);
        const ds = rawDate ? new Date(rawDate) : null;
        return ({
          ngay: ds ? ds.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' }) : '',
          doanhThu: Number(pick(item, ['doanhThuThuan', 'DoanhThuThuan', 'DOANH_THU_THUAN', 'doanh_thu_thuan'], 0)) || 0,
          donHang: Number(pick(item, ['soDonHang', 'SoDonHang', 'SO_DON_HANG', 'so_don_hang'], 0)) || 0,
          aov: Number(pick(item, ['aov', 'AOV'], 0)) || 0
        });
      }));

      // Process cost structure
      const costs = costRes?.data || costRes || [];
      setCostStructure(costs.map(item => {
        const loai = pick(item, ['loaiChiPhi', 'LoaiChiPhi', 'LOAI_CHI_PHI', 'loai_chi_phi'], 'KhuyenMai');
        const name = loai === 'PhiVanChuyen' ? 'Phí vận chuyển' : 'Khuyến mãi';
        const value = Number(pick(item, ['soTien', 'SoTien', 'SO_TIEN', 'so_tien'], 0)) || 0;
        return { name, value };
      }));

      // Process order distribution (histogram)
      const distribution = distributionRes?.data || distributionRes || [];
      const normalizedDist = distribution.map(item => ({
        giaTriDonHang: Number(pick(item, ['giaTriDonHang', 'GiaTriDonHang', 'GIA_TRI_DON_HANG', 'gia_tri_don_hang', 'tongTien', 'TongTien'], 0)) || 0
      }));
      const histogram = createHistogram(normalizedDist);
      setOrderDistribution(histogram);

      // Process waterfall
      const waterfall = waterfallRes?.data || waterfallRes || [];
      const normalizedWaterfall = waterfall.map(item => ({
        thanhPhan: pick(item, ['thanhPhan', 'ThanhPhan', 'THANH_PHAN', 'thanh_phan']),
        giaTri: Number(pick(item, ['giaTri', 'GiaTri', 'GIA_TRI', 'gia_tri'], 0)) || 0
      }));
      setWaterfallData(processWaterfallData(normalizedWaterfall));

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createHistogram = (data) => {
    const ranges = [
      { label: '0-1tr', min: 0, max: 1000000 },
      { label: '1-3tr', min: 1000000, max: 3000000 },
      { label: '3-5tr', min: 3000000, max: 5000000 },
      { label: '5-10tr', min: 5000000, max: 10000000 },
      { label: '>10tr', min: 10000000, max: Infinity }
    ];

    return ranges.map(range => ({
      range: range.label,
      count: data.filter(item => 
        item.giaTriDonHang >= range.min && item.giaTriDonHang < range.max
      ).length
    }));
  };

  const processWaterfallData = (data) => {
    // Transform waterfall data for stacked bar chart
    const order = ['DoanhThuTong', 'TongGiamGia', 'DoanhThuThuan'];
    const sorted = order.map(key => data.find(d => d.thanhPhan === key)).filter(Boolean);
    
    return sorted.map((item) => ({
      name: item.thanhPhan === 'DoanhThuTong' ? 'Doanh thu gốc' :
            item.thanhPhan === 'TongGiamGia' ? 'Giảm giá' : 'Doanh thu thuần',
      value: Math.abs(item.giaTri || 0),
      fill: item.thanhPhan === 'DoanhThuTong' ? '#3b82f6' :
            item.thanhPhan === 'TongGiamGia' ? '#ef4444' : '#10b981'
    }));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('vi-VN').format(value || 0);
  };

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'];

  const handleExport = () => {
    // TODO: Implement export to Excel
    alert('Tính năng xuất Excel đang được phát triển');
  };

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải báo cáo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <IoStatsChart className="w-8 h-8" />
              Báo cáo Tài chính
            </h1>
            <p className="mt-2 text-indigo-100">
              Phân tích doanh thu và hiệu suất kinh doanh
            </p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            <IoDownload />
            Xuất Excel
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <IoCalendar className="inline mr-1" />
              Từ ngày
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <IoCalendar className="inline mr-1" />
              Đến ngày
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <button
            onClick={fetchReportData}
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <IoRefresh className={loading ? 'animate-spin' : ''} />
            Cập nhật
          </button>
        </div>
      </div>

      {/* KPI Cards - Financial_Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Doanh thu thuần</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary?.doanhThuThuan || 0)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <IoCash className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Lợi nhuận gộp</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary?.bienLoiNhuanGop || 0)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <IoTrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Số đơn hàng</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(summary?.soDonHang || 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <IoCart className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">AOV (Giá trị TB)</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary?.aov || 0)}
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <IoPieChart className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Trend Chart - Financial_Trend */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <IoTrendingUp className="text-indigo-600" />
          Xu hướng doanh thu theo ngày
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="ngay" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              formatter={(value, name) => {
                if (name === 'Doanh thu thuần' || name === 'AOV') {
                  return formatCurrency(value);
                }
                return formatNumber(value);
              }}
            />
            <Legend />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="doanhThu"
              fill="#8b5cf6"
              stroke="#7c3aed"
              fillOpacity={0.3}
              name="Doanh thu thuần"
            />
            <Bar yAxisId="right" dataKey="donHang" fill="#3b82f6" name="Số đơn hàng" />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="aov"
              stroke="#10b981"
              strokeWidth={2}
              name="AOV"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Two columns layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cost Structure - Financial_CostStructure */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <IoPieChart className="text-indigo-600" />
            Cơ cấu chi phí
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={costStructure}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {costStructure.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {costStructure.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm text-gray-700">{item.name}</span>
                </div>
                <span className="text-sm font-semibold">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Waterfall Chart - Financial_Waterfall */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <IoStatsChart className="text-indigo-600" />
            Cấu phần doanh thu
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={waterfallData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {waterfallData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {waterfallData.map((item, index) => (
              <div key={index} className="text-center p-3 rounded-lg" style={{ backgroundColor: `${item.fill}15` }}>
                <p className="text-xs text-gray-600 mb-1">{item.name}</p>
                <p className="text-sm font-bold" style={{ color: item.fill }}>
                  {formatCurrency(item.value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Order Distribution - Financial_OrderDistribution */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <IoCart className="text-indigo-600" />
          Phân phối giá trị đơn hàng
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={orderDistribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#6366f1" radius={[8, 8, 0, 0]} name="Số đơn hàng" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FinancialReport;
