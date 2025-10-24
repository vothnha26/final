import React, { useState, useEffect } from 'react';
import { IoBarChart, IoDownload, IoRefresh, IoWarning } from 'react-icons/io5';
import api from '../../../api';
import OverviewReport from './reports/OverviewReport';
import SalesReport from './reports/SalesReport';
import CustomersReport from './reports/CustomersReport';
import InventoryReport from './reports/InventoryReport';
import ProductsReport from './reports/ProductsReport';
import FinancialReport from './reports/FinancialReport';
import MarketingReport from './reports/MarketingReport';
import PerformanceReport from './reports/PerformanceReport';
import RFMAnalysis from './reports/RFMAnalysis';
import CohortRetention from './reports/CohortRetention';
import VoucherUsageChart from './reports/VoucherUsageChart';
import PurchaseFrequency from './reports/PurchaseFrequency';

const ReportsAnalytics = () => {
  // Calculate default date range (last 30 days)
  const getDefaultDateRange = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0]
    };
  };

  const defaultDates = getDefaultDateRange();
  
  const [selectedPeriod, setSelectedPeriod] = useState('30days');
  const [selectedReportType, setSelectedReportType] = useState('overview');

  // Chart view states
  const [revenueChartType, setRevenueChartType] = useState('bar');
  const [ordersChartType, setOrdersChartType] = useState('bar');

  // API data states
  const [salesData, setSalesData] = useState([]);
  const [productSales, setProductSales] = useState([]);
  const [customerStats, setCustomerStats] = useState([]);
  const [inventoryAlerts, setInventoryAlerts] = useState([]);
  const [customerSegmentation, setCustomerSegmentation] = useState([]);
  const [customerGrowth, setCustomerGrowth] = useState([]);
  const [topSpenders, setTopSpenders] = useState([]);
  const [procTotals, setProcTotals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Advanced analytics states
  const [rfmData, setRfmData] = useState([]);
  const [cohortData, setCohortData] = useState([]);
  const [voucherData, setVoucherData] = useState([]);
  const [frequencyData, setFrequencyData] = useState([]);
  
  // Date range states - default to last 30 days
  const [customStartDate, setCustomStartDate] = useState(defaultDates.start);
  const [customEndDate, setCustomEndDate] = useState(defaultDates.end);

  // Fetch general reports
  useEffect(() => {
    const fetchReportsData = async () => {
      // Skip if dates are not set yet
      if (!customStartDate || !customEndDate) return;
      
      setLoading(true);
      setError(null);
      try {
        const periodToDays = (p) => {
          switch (p) {
            case 'today': return 1;
            case '7days': return 7;
            case '30days': return 30;
            case '90days': return 90;
            case '1year': return 365;
            default: return 30;
          }
        };
        const days = periodToDays(selectedPeriod);

        const tryEndpoints = async (newPath, oldPath, optsNew = {}, optsOld = {}) => {
          try {
            const resp = await api.get(newPath, optsNew);
            return resp;
          } catch (e) {
            try {
              const resp2 = await api.get(oldPath, optsOld);
              return resp2;
            } catch (e2) {
              return [];
            }
          }
        };

        const [salesRes, productsRes, customersRes, inventoryRes] = await Promise.all([
          tryEndpoints('/api/v1/bao-cao-thong-ke/revenue-summary', '/api/reports/sales', { query: { days } }),
          tryEndpoints('/api/v1/bao-cao-thong-ke/sales-by-product', '/api/reports/products'),
          tryEndpoints('/api/v1/bao-cao-thong-ke/vip-customer-analysis', '/api/reports/customers'),
          tryEndpoints('/api/v1/bao-cao-thong-ke/inventory-metrics', '/api/reports/inventory')
        ]);

        const normalize = (resp) => {
          if (!resp) return [];
          if (resp.success && resp.data) return Array.isArray(resp.data.rows) ? resp.data.rows : [];
          if (Array.isArray(resp)) return resp;
          if (resp.rows && Array.isArray(resp.rows)) return resp.rows;
          return [];
        };

        const origNormalizedSales = normalize(salesRes);
        let normalizedSales = origNormalizedSales;
        const normalizedProducts = normalize(productsRes);
        const normalizedCustomers = normalize(customersRes);
        const normalizedInventory = normalize(inventoryRes);

        const isAggregatedRow = (row) => {
          if (!row || typeof row !== 'object') return false;
          const keys = Object.keys(row).map(k => k.toLowerCase());
          return keys.includes('doanhthucaonhat') || keys.includes('doanhthuthapnhat') || keys.includes('maxrevenue') || keys.includes('minrevenue');
        };

        if (Array.isArray(origNormalizedSales) && origNormalizedSales.length === 1) {
          const ro = origNormalizedSales[0];
          const totalRevFromProc = Number(ro.tong_ch_tieu ?? ro.TongChiTieu ?? ro.Tong_Chi_Tieu ?? ro.TongDoanhThu ?? ro.tongDoanhThu ?? ro.TotalRevenue ?? ro.total ?? ro.DoanhThu ?? ro.doanhThu) || null;
          const totalOrdersFromProc = Number(ro.tong_don_hang ?? ro.TongDonHang ?? ro.Tong_SoDonHang ?? ro.TotalOrders ?? ro.totalOrders ?? ro.orders ?? ro.SoDonHang ?? ro.soDonHang) || null;
          if (totalRevFromProc || totalOrdersFromProc) {
            setProcTotals({ totalRevenue: totalRevFromProc || undefined, totalOrders: totalOrdersFromProc || undefined });
          }
        }

        if (Array.isArray(normalizedSales) && normalizedSales.length === 1 && isAggregatedRow(normalizedSales[0])) {
          const r = normalizedSales[0];
          const cao = r.DoanhThuCaoNhat ?? r.doanhThuCaoNhat ?? r.maxRevenue ?? r.MaxRevenue ?? 0;
          const thap = r.DoanhThuThapNhat ?? r.doanhThuThapNhat ?? r.minRevenue ?? r.MinRevenue ?? 0;
          normalizedSales = [
            { date: 'Cao', revenue: Number(cao) || 0 },
            { date: 'Thap', revenue: Number(thap) || 0 }
          ];
        }

        let finalProducts = normalizedProducts;
        const isProductAggregated = (row) => {
          if (!row || typeof row !== 'object') return false;
          const keys = Object.keys(row).map(k => k.toLowerCase());
          return keys.includes('ten_san_pham') || keys.includes('sku') || keys.includes('tensanpham') || keys.includes('tensp') || keys.includes('masp');
        };

        if (Array.isArray(normalizedProducts) && normalizedProducts.length > 0 && isProductAggregated(normalizedProducts[0])) {
          finalProducts = normalizedProducts.map(p => {
            const name = p.ten_san_pham ?? p.TenSanPham ?? p.tenSanPham ?? p.tensp ?? p.ProductName ?? p.productName ?? p.name ?? p.Ten ?? 'N/A';
            const sku = p.sku ?? p.MSP ?? p.masp ?? p.MaSP ?? null;
            const sales = Number(p.TongSoLuongBan ?? p.SoLuongBan ?? p.soLuongBan ?? p.soLuong ?? p.Sales ?? p.sales ?? p.quantity ?? p.qty) || 0;
            const revenue = Number(p.TongDoanhThu ?? p.DoanhThu ?? p.doanhThu ?? p.Revenue ?? p.revenue ?? p.Total ?? p.tongTien) || 0;
            return { name, sku, sales, revenue, ...p };
          });
        }

        const mapSalesRow = (r) => {
          if (!r || typeof r !== 'object') return { date: '', revenue: 0, orders: 0 };
          const date = r.date ?? r.Ngay ?? r.ngay ?? r.ngayStr ?? r.dateStr ?? r.Date ?? r.createdAt ?? r.thoiGianTao ?? '';
          const revenue = Number(r.revenue ?? r.doanhThu ?? r.DoanhThu ?? r.TongDoanhThu ?? r.TotalRevenue ?? r.total ?? r.Total ?? r.value ?? 0) || 0;
          const orders = Number(r.orders ?? r.soDonHang ?? r.SoDonHang ?? r.TongSoDonHang ?? r.TongDonHang ?? r.totalOrders ?? r.ordersCount ?? 0) || 0;
          return { ...r, date, revenue, orders };
        };

        const mappedSales = Array.isArray(normalizedSales) ? normalizedSales.map(mapSalesRow) : [];

        const mappedCustomers = Array.isArray(normalizedCustomers) ? normalizedCustomers.map(stat => {
          const mapped = {
            level: stat.level ?? stat.TenHangThanhVien ?? stat.tenHangThanhVien ?? stat.capBac ?? stat.name ?? 'N/A',
            count: Number(stat.count ?? stat.SoLuongKhachHang ?? stat.soLuongKhachHang ?? stat.soLuong ?? stat.total ?? 0) || 0,
            revenue: Number(stat.revenue ?? stat.TongChiTieu ?? stat.tongChiTieu ?? stat.doanhThu ?? stat.DoanhThu ?? 0) || 0,
            ...stat
          };
          return mapped;
        }) : [];

        const mappedInventory = Array.isArray(normalizedInventory) ? normalizedInventory.map(alert => {
          const mapped = {
            product: alert.product ?? alert.ten_san_pham ?? alert.TenSanPham ?? alert.tenSanPham ?? alert.name ?? 'N/A',
            sku: alert.sku ?? alert.SKU ?? '',
            currentStock: Number(alert.currentStock ?? alert.so_Luong_Ton ?? alert.soLuongTon ?? alert.tonKho ?? alert.stock ?? 0) || 0,
            minStock: Number(alert.minStock ?? alert.muc_Ton_Toi_thieu ?? alert.mucTonToiThieu ?? alert.minStock ?? 0) || 0,
            status: alert.status ?? alert.trangThai ?? 'normal',
            ...alert
          };
          return mapped;
        }) : [];

        setSalesData(mappedSales);
        setProductSales(finalProducts);
        setCustomerStats(mappedCustomers);
        setInventoryAlerts(mappedInventory);
      } catch (err) {
        setError('Không thể tải dữ liệu báo cáo');
      } finally {
        setLoading(false);
      }
    };

    fetchReportsData();
  }, [selectedPeriod, customStartDate, customEndDate]);

  // Fetch Customer reports (with date range support)
  useEffect(() => {
    if (selectedReportType !== 'customers') return;
    if (!customStartDate || !customEndDate) return;
    
    let cancelled = false;

    const normalizeRows = (resp) => {
      if (!resp) return [];
      if (resp.success && resp.data && Array.isArray(resp.data.rows)) return resp.data.rows;
      if (resp.rows && Array.isArray(resp.rows)) return resp.rows;
      if (Array.isArray(resp)) return resp;
      return [];
    };

    const load = async () => {
      try {
        // Always use date range
        const segQuery = { action: 'segmentation', startDate: customStartDate, endDate: customEndDate };
        const growthQuery = { action: 'growth', startDate: customStartDate, endDate: customEndDate };
        const topQuery = { action: 'top_spenders', startDate: customStartDate, endDate: customEndDate, topN: 10 };
        
        // Advanced analytics queries
        const rfmQuery = { action: 'rfm', startDate: customStartDate, endDate: customEndDate };
        const cohortQuery = { action: 'retention_cohort', startDate: customStartDate, endDate: customEndDate };
        const voucherQuery = { action: 'voucher_usage', startDate: customStartDate, endDate: customEndDate };
        const frequencyQuery = { action: 'purchase_frequency', startDate: customStartDate, endDate: customEndDate };
        
        const [seg, growth, topn, rfm, cohort, voucher, frequency] = await Promise.all([
          api.get('/api/v1/bao-cao-thong-ke/customers/report', { query: segQuery }),
          api.get('/api/v1/bao-cao-thong-ke/customers/report', { query: growthQuery }),
          api.get('/api/v1/bao-cao-thong-ke/customers/report', { query: topQuery }),
          api.get('/api/v1/bao-cao-thong-ke/customers/analytics', { query: rfmQuery }),
          api.get('/api/v1/bao-cao-thong-ke/customers/analytics', { query: cohortQuery }),
          api.get('/api/v1/bao-cao-thong-ke/customers/analytics', { query: voucherQuery }),
          api.get('/api/v1/bao-cao-thong-ke/customers/analytics', { query: frequencyQuery })
        ]);
        if (cancelled) return;
        setCustomerSegmentation(normalizeRows(seg));
        setCustomerGrowth(normalizeRows(growth));
        setTopSpenders(normalizeRows(topn));
        setRfmData(normalizeRows(rfm));
        setCohortData(normalizeRows(cohort));
        setVoucherData(normalizeRows(voucher));
        setFrequencyData(normalizeRows(frequency));
      } catch (e) {
        if (!cancelled) {
          setCustomerSegmentation([]);
          setCustomerGrowth([]);
          setTopSpenders([]);
          setRfmData([]);
          setCohortData([]);
          setVoucherData([]);
          setFrequencyData([]);
        }
      }
    };
    load();
    return () => { cancelled = true; };
  }, [selectedReportType, customStartDate, customEndDate]);

  const reportTypes = [
    { id: 'overview', name: 'Tổng quan', icon: IoBarChart, color: 'bg-blue-100 text-blue-800' },
    { id: 'sales', name: 'Báo cáo bán hàng', icon: IoBarChart, color: 'bg-green-100 text-green-800' },
    { id: 'inventory', name: 'Báo cáo tồn kho', icon: IoBarChart, color: 'bg-yellow-100 text-yellow-800' },
    { id: 'customers', name: 'Báo cáo khách hàng', icon: IoBarChart, color: 'bg-purple-100 text-purple-800' },
    { id: 'products', name: 'Báo cáo sản phẩm', icon: IoBarChart, color: 'bg-red-100 text-red-800' },
    { id: 'financial', name: 'Báo cáo tài chính', icon: IoBarChart, color: 'bg-indigo-100 text-indigo-800' },
    { id: 'marketing', name: 'Báo cáo marketing', icon: IoBarChart, color: 'bg-pink-100 text-pink-800' },
    { id: 'performance', name: 'Báo cáo hiệu suất', icon: IoBarChart, color: 'bg-gray-100 text-gray-800' }
  ];

  const computedTotalRevenue = salesData.reduce((sum, day) => sum + (Number(day.doanhThu ?? day.revenue) || 0), 0);
  const totalOrdersFromSeries = salesData.reduce((sum, day) => sum + (Number(day.soDonHang ?? day.orders ?? day.TongSoDonHang ?? day.TongDonHang) || 0), 0);
  const totalUnitsSold = productSales.reduce((sum, p) => sum + (Number(p.sales ?? p.SoLuongBan ?? p.TongSoLuongBan ?? 0) || 0), 0);
  const computedTotalOrders = totalOrdersFromSeries || totalUnitsSold || 0;

  const totalRevenue = procTotals?.totalRevenue ?? computedTotalRevenue;
  const totalOrders = procTotals?.totalOrders ?? computedTotalOrders;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : null;
  const totalCustomers = customerStats.reduce((sum, stat) => sum + (Number(stat.soLuong ?? stat.count ?? stat.total ?? stat.tong ?? 0) || 0), 0) || null;

  const formatNumber = (n) => {
    const v = Number(n);
    if (!isFinite(v) || isNaN(v)) return '0';
    return v.toLocaleString('vi-VN');
  };

  const formatCurrency = (n) => `${formatNumber(n)}đ`;

  const safeMax = (arr, accessor = (x) => x) => {
    if (!Array.isArray(arr) || arr.length === 0) return 0;
    return Math.max(...arr.map(accessor).map(v => Number(v) || 0));
  };

  const safeMin = (arr, accessor = (x) => x) => {
    if (!Array.isArray(arr) || arr.length === 0) return 0;
    return Math.min(...arr.map(accessor).map(v => Number(v) || 0));
  };

  const renderDayLabel = (day) => {
    if (!day || !day.date) return '–';
    const d = new Date(day.date);
    if (Number.isNaN(d.getTime())) return '–';
    return `${d.getDate()}/${d.getMonth() + 1}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'low': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-orange-100 text-orange-800';
      case 'out': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'low': return 'Sắp hết';
      case 'critical': return 'Nguy hiểm';
      case 'out': return 'Hết hàng';
      default: return 'Bình thường';
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Báo cáo và Thống kê</h1>
          <p className="text-gray-600">Phân tích hiệu suất kinh doanh và xu hướng</p>
        </div>

        {/* Loading and Error States */}
        {loading && (
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Đang tải dữ liệu báo cáo...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <div className="flex items-center">
              <IoWarning className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Report Type Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Chọn loại báo cáo</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {reportTypes.map((report) => {
              const IconComponent = report.icon;
              return (
                <button
                  key={report.id}
                  onClick={() => setSelectedReportType(report.id)}
                  className={`p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                    selectedReportType === report.id ? 'border-primary bg-primary/10' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`p-2 rounded-lg mb-2 ${report.color}`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{report.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Period Selection */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-gray-900">Lọc theo thời gian</h3>
            {customStartDate && customEndDate && (
              <p className="text-sm text-gray-600 mt-1">
                Đang xem dữ liệu từ <span className="font-semibold">{new Date(customStartDate).toLocaleDateString('vi-VN')}</span> đến <span className="font-semibold">{new Date(customEndDate).toLocaleDateString('vi-VN')}</span>
              </p>
            )}
          </div>
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4 items-end flex-wrap">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khoảng thời gian</label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => {
                    setSelectedPeriod(e.target.value);
                    // Auto-set date range when selecting preset periods
                    if (e.target.value !== 'custom') {
                      const end = new Date();
                      const start = new Date();
                      const daysMap = {
                        '7days': 7,
                        '30days': 30,
                        '90days': 90,
                        '1year': 365
                      };
                      start.setDate(start.getDate() - (daysMap[e.target.value] || 30));
                      setCustomStartDate(start.toISOString().split('T')[0]);
                      setCustomEndDate(end.toISOString().split('T')[0]);
                    }
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="7days">7 ngày qua</option>
                  <option value="30days">30 ngày qua</option>
                  <option value="90days">90 ngày qua</option>
                  <option value="1year">1 năm qua</option>
                  <option value="custom">Tùy chọn...</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Từ ngày</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value);
                    setSelectedPeriod('custom'); // Switch to custom when manually changing date
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đến ngày</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    setSelectedPeriod('custom'); // Switch to custom when manually changing date
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  // Refresh data by reloading
                  window.location.reload();
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <IoRefresh className="w-5 h-5" />
                Làm mới
              </button>
              <button className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
                <IoDownload className="w-5 h-5" />
                Xuất báo cáo
              </button>
            </div>
          </div>
        </div>

        {/* Report Content */}
        {selectedReportType === 'overview' && (
          <OverviewReport
            salesData={salesData}
            productSales={productSales}
            customerStats={customerStats}
            inventoryAlerts={inventoryAlerts}
            totalRevenue={totalRevenue}
            totalOrders={totalOrders}
            averageOrderValue={averageOrderValue}
            totalCustomers={totalCustomers}
            formatCurrency={formatCurrency}
            formatNumber={formatNumber}
            safeMax={safeMax}
            safeMin={safeMin}
            renderDayLabel={renderDayLabel}
            getStatusColor={getStatusColor}
            getStatusText={getStatusText}
          />
        )}

        {selectedReportType === 'sales' && (
          <SalesReport
            salesData={salesData}
            totalRevenue={totalRevenue}
            totalOrders={totalOrders}
            averageOrderValue={averageOrderValue}
            revenueChartType={revenueChartType}
            setRevenueChartType={setRevenueChartType}
            ordersChartType={ordersChartType}
            setOrdersChartType={setOrdersChartType}
            formatCurrency={formatCurrency}
            safeMax={safeMax}
            safeMin={safeMin}
            renderDayLabel={renderDayLabel}
          />
        )}

        {selectedReportType === 'customers' && (
          <>
            <CustomersReport
              customerSegmentation={customerSegmentation}
              customerGrowth={customerGrowth}
              topSpenders={topSpenders}
              formatCurrency={formatCurrency}
              formatNumber={formatNumber}
              renderDayLabel={renderDayLabel}
            />
            
            {/* Advanced Analytics */}
            <div className="grid grid-cols-1 gap-6 mt-6">
              <RFMAnalysis 
                data={rfmData}
                dateRange={{ start: customStartDate, end: customEndDate }}
              />
              
              <CohortRetention 
                data={cohortData}
                dateRange={{ start: customStartDate, end: customEndDate }}
              />
              
              <VoucherUsageChart 
                data={voucherData}
                dateRange={{ start: customStartDate, end: customEndDate }}
              />
              
              <PurchaseFrequency 
                data={frequencyData}
                dateRange={{ start: customStartDate, end: customEndDate }}
              />
            </div>
          </>
        )}

        {selectedReportType === 'inventory' && <InventoryReport />}
        {selectedReportType === 'products' && <ProductsReport />}
        {selectedReportType === 'financial' && <FinancialReport />}
        {selectedReportType === 'marketing' && <MarketingReport />}
        {selectedReportType === 'performance' && <PerformanceReport />}

        {/* Export Options */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Xuất báo cáo</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center gap-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <IoDownload className="w-5 h-5 text-blue-600" />
              <span>Xuất PDF</span>
            </button>
            <button className="flex items-center justify-center gap-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <IoDownload className="w-5 h-5 text-green-600" />
              <span>Xuất Excel</span>
            </button>
            <button className="flex items-center justify-center gap-2 p-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <IoDownload className="w-5 h-5 text-purple-600" />
              <span>Xuất CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;
