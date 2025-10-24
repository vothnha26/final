import React, { useState, useEffect } from 'react';
import { IoBarChart, IoPricetag, IoGift, IoTrendingUp } from 'react-icons/io5';
import api from '../../../../api';

const MarketingReport = () => {
  const [promotionType, setPromotionType] = useState('voucher');
  const [loading, setLoading] = useState(false);
  
  // Summary data
  const [summaryData, setSummaryData] = useState([]);
  const [summaryTopN, setSummaryTopN] = useState(10);
  const [summaryWithProducts, setSummaryWithProducts] = useState([]);
  
  // Performance data
  const [performanceData, setPerformanceData] = useState([]);
  
  // Customer usage data (for voucher)
  const [customerUsageData, setCustomerUsageData] = useState([]);
  const [customerTopN, setCustomerTopN] = useState(5);

  // Product performance data (for discount_program)
  const [topProducts, setTopProducts] = useState([]);
  const [bottomProducts, setBottomProducts] = useState([]);
  const [productTopN, setProductTopN] = useState(5);

  // Modal for product details
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProgramProducts, setSelectedProgramProducts] = useState([]);
  const [selectedProgramName, setSelectedProgramName] = useState('');

  // Date filter
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Tier name mapping - loaded from API
  const [tierNames, setTierNames] = useState({});

  // Load tier names on mount
  useEffect(() => {
    const loadTierNames = async () => {
      try {
        const tiers = await api.get('/api/hang-thanh-vien/all');
        const tierMap = {};
        tiers.forEach(tier => {
          tierMap[tier.maHangThanhVien] = tier.tenHang;
        });
        setTierNames(tierMap);
      } catch (error) {
        // Fallback to default names
        setTierNames({
          1: 'Bạc',
          2: 'Vàng',
          3: 'Kim cương'
        });
      }
    };
    loadTierNames();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const query = {
        promotionType,
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      };

      // Fetch summary
      const summaryRes = await api.get(`/api/v1/report/promotions/summary`, { query: { ...query, topN: summaryTopN } });
      setSummaryData(summaryRes || []);

      // Fetch performance
      const perfRes = await api.get(`/api/v1/report/promotions/performance`, { query });
      setPerformanceData(perfRes || []);

      // For discount_program, fetch top selling products for each program
      if (promotionType === 'discount_program' && summaryRes && summaryRes.length > 0) {
        const summaryWithProductsData = await Promise.all(
          summaryRes.map(async (program) => {
            try {
              const programId = program.ma_chuong_trinh;
              
              if (!programId) {
                return { ...program, top_products: [] };
              }
              
              const topProducts = await api.get(`/api/v1/report/promotions/product-performance`, {
                query: {
                  promotionType: 'discount_program',
                  maChuongTrinh: programId,
                  type: 'top',
                  sortBy: 'quantity_sold',
                  topN: 10,
                  ...(startDate && { startDate }),
                  ...(endDate && { endDate })
                }
              });
              return { ...program, top_products: topProducts || [] };
            } catch (error) {
              return { ...program, top_products: [] };
            }
          })
        );
        setSummaryWithProducts(summaryWithProductsData);
      } else {
        setSummaryWithProducts([]);
      }

      // Fetch data based on promotion type
      if (promotionType === 'voucher') {
        // Fetch customer usage for vouchers
        const custRes = await api.get(`/api/v1/report/promotions/customer-usage`, { query: { ...query, topN: customerTopN } });
        setCustomerUsageData(custRes || []);
        setTopProducts([]);
        setBottomProducts([]);
      } else if (promotionType === 'discount_program') {
        // Fetch product performance for discount programs - default to discount_value
        const topProdRes = await api.get(`/api/v1/report/promotions/product-performance`, { 
          query: { ...query, topN: productTopN, type: 'top', sortBy: 'discount_value' } 
        });
        const bottomProdRes = await api.get(`/api/v1/report/promotions/product-performance`, { 
          query: { ...query, topN: productTopN, type: 'bottom', sortBy: 'discount_value' } 
        });
        setTopProducts(topProdRes || []);
        setBottomProducts(bottomProdRes || []);
        setCustomerUsageData([]);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [promotionType, summaryTopN, customerTopN, productTopN, startDate, endDate]);

  const formatCurrency = (val) => {
    if (!val) return '0₫';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const formatPercent = (val) => {
    if (!val) return '0%';
    return `${Number(val).toFixed(1)}%`;
  };

  const handleViewProductDetails = (program) => {
    setSelectedProgramName(program.ten_chuong_trinh || 'N/A');
    setSelectedProgramProducts(program.top_products || []);
    setShowProductModal(true);
  };

  // Aggregate KPIs from summary
  const totalUsage = summaryData.reduce((sum, row) => sum + (row.so_lan_su_dung || 0), 0);
  const totalValue = summaryData.reduce((sum, row) => sum + (row.tong_gia_tri_giam || 0), 0);

  // Performance chart: simple SVG line/bar
  const renderPerformanceChart = () => {
    if (!performanceData.length) return <div className="text-gray-500 text-center py-8">Không có dữ liệu</div>;

    const maxValue = Math.max(...performanceData.map(d => d.tong_gia_tri_giam || 0), 1);
    const chartHeight = 200;
    const chartWidth = 600;
    const padding = 40;

    const xStep = (chartWidth - 2 * padding) / Math.max(performanceData.length - 1, 1);
    const yScale = (chartHeight - 2 * padding) / maxValue;

    return (
      <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="mx-auto">
        {/* Grid lines */}
        <line x1={padding} y1={padding} x2={padding} y2={chartHeight - padding} stroke="#e5e7eb" strokeWidth="1" />
        <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#e5e7eb" strokeWidth="1" />
        
        {/* Line path */}
        <polyline
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          points={performanceData.map((d, i) => {
            const x = padding + i * xStep;
            const y = chartHeight - padding - (d.tong_gia_tri_giam || 0) * yScale;
            return `${x},${y}`;
          }).join(' ')}
        />
        
        {/* Points */}
        {performanceData.map((d, i) => {
          const x = padding + i * xStep;
          const y = chartHeight - padding - (d.tong_gia_tri_giam || 0) * yScale;
          return <circle key={i} cx={x} cy={y} r="4" fill="#3b82f6" />;
        })}

        {/* Labels */}
        {performanceData.map((d, i) => {
          const x = padding + i * xStep;
          return (
            <text key={i} x={x} y={chartHeight - padding + 20} fontSize="10" fill="#6b7280" textAnchor="middle">
              {d.ngay ? new Date(d.ngay).toLocaleDateString('vi-VN', { month: 'numeric', day: 'numeric' }) : ''}
            </text>
          );
        })}
      </svg>
    );
  };

  // Customer usage donut chart (simple pie)
  const renderCustomerUsageDonut = () => {
    if (!customerUsageData.length) return <div className="text-gray-500 text-center py-8">Không có dữ liệu</div>;

    const total = customerUsageData.reduce((sum, row) => sum + (row.tong_gia_tri_giam || 0), 0);
    if (total === 0) return <div className="text-gray-500 text-center py-8">Không có dữ liệu</div>;

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    let currentAngle = 0;

    const slices = customerUsageData.map((row, i) => {
      const value = row.tong_gia_tri_giam || 0;
      const percent = (value / total) * 100;
      const angle = (percent / 100) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;
      return { ...row, percent, startAngle, angle, color: colors[i % colors.length] };
    });

    const size = 200;
    const radius = 80;
    const innerRadius = 50;

    const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
      const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
      return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
      };
    };

    const describeArc = (x, y, radius, startAngle, endAngle) => {
      const start = polarToCartesian(x, y, radius, endAngle);
      const end = polarToCartesian(x, y, radius, startAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
      return [
        "M", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
      ].join(" ");
    };

    return (
      <div className="flex items-center justify-center gap-8">
        <svg width={size} height={size}>
          {slices.map((slice, i) => {
            const outerArc = describeArc(size / 2, size / 2, radius, slice.startAngle, slice.startAngle + slice.angle);
            const innerArc = describeArc(size / 2, size / 2, innerRadius, slice.startAngle + slice.angle, slice.startAngle);
            const pathData = `${outerArc} L ${polarToCartesian(size / 2, size / 2, innerRadius, slice.startAngle + slice.angle).x} ${polarToCartesian(size / 2, size / 2, innerRadius, slice.startAngle + slice.angle).y} ${innerArc} Z`;
            
            return <path key={i} d={pathData} fill={slice.color} />;
          })}
        </svg>
        
        <div className="space-y-2">
          {slices.map((slice, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.color }}></div>
              <span className="text-sm text-gray-700">
                {tierNames[slice.hang_khach_hang] || `Hạng ${slice.hang_khach_hang}`}: {formatPercent(slice.percent)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Customer usage bar chart
  const renderCustomerUsageBar = () => {
    if (!customerUsageData.length) return <div className="text-gray-500 text-center py-8">Không có dữ liệu</div>;

    const maxValue = Math.max(...customerUsageData.map(d => d.tong_gia_tri_giam || 0), 1);
    const chartHeight = 200;
    const chartWidth = 400;
    const padding = 40;
    const barWidth = (chartWidth - 2 * padding) / customerUsageData.length - 10;

    return (
      <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="mx-auto">
        {/* Grid */}
        <line x1={padding} y1={padding} x2={padding} y2={chartHeight - padding} stroke="#e5e7eb" strokeWidth="1" />
        <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="#e5e7eb" strokeWidth="1" />
        
        {/* Bars */}
        {customerUsageData.map((d, i) => {
          const value = d.tong_gia_tri_giam || 0;
          const barHeight = (value / maxValue) * (chartHeight - 2 * padding);
          const x = padding + i * (barWidth + 10) + 5;
          const y = chartHeight - padding - barHeight;
          
          return (
            <g key={i}>
              <rect x={x} y={y} width={barWidth} height={barHeight} fill="#3b82f6" rx="2" />
              <text x={x + barWidth / 2} y={chartHeight - padding + 20} fontSize="10" fill="#6b7280" textAnchor="middle">
                {tierNames[d.hang_khach_hang] || `H${d.hang_khach_hang}`}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  // Product performance list for discount programs
  const renderProductList = (data, title) => {
    if (!data || !data.length) return <div className="text-gray-500 text-center py-8">Không có dữ liệu</div>;

    return (
      <div className="space-y-3">
        {data.map((product, idx) => (
          <div key={idx} className="flex justify-between items-center pb-3 border-b border-gray-100 last:border-0">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{product.ten_san_pham || 'N/A'}</p>
              <p className="text-xs text-gray-500">SKU: {product.sku || product.ma_san_pham || ''}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-900">{formatCurrency(product.tong_gia_tri_giam)}</p>
              <p className="text-xs text-gray-500">{product.so_luong_ban || 0} sản phẩm · {product.so_don_hang_ap_dung || 0} đơn</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Product performance donut chart
  const renderProductDonut = (data, title, useQuantity = false) => {
    if (!data || !data.length) return <div className="text-gray-500 text-center py-8">Không có dữ liệu</div>;

    const total = data.reduce((sum, row) => sum + (useQuantity ? (row.so_luong_ban || 0) : (row.tong_gia_tri_giam || 0)), 0);
    if (total === 0) return <div className="text-gray-500 text-center py-8">Không có dữ liệu</div>;

    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
    let currentAngle = 0;

    const slices = data.map((row, i) => {
      const value = useQuantity ? (row.so_luong_ban || 0) : (row.tong_gia_tri_giam || 0);
      const percent = (value / total) * 100;
      const angle = (percent / 100) * 360;
      const startAngle = currentAngle;
      currentAngle += angle;
      return { ...row, percent, startAngle, angle, color: colors[i % colors.length], value };
    });

    const size = 200;
    const radius = 80;
    const innerRadius = 50;

    const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
      const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
      return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
      };
    };

    const describeArc = (x, y, radius, startAngle, endAngle) => {
      const start = polarToCartesian(x, y, radius, endAngle);
      const end = polarToCartesian(x, y, radius, startAngle);
      const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
      return [
        "M", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
      ].join(" ");
    };

    return (
      <div className="flex items-center justify-center gap-4">
        <svg width={size} height={size}>
          {slices.map((slice, i) => {
            const outerArc = describeArc(size / 2, size / 2, radius, slice.startAngle, slice.startAngle + slice.angle);
            const innerArc = describeArc(size / 2, size / 2, innerRadius, slice.startAngle + slice.angle, slice.startAngle);
            const pathData = `${outerArc} L ${polarToCartesian(size / 2, size / 2, innerRadius, slice.startAngle + slice.angle).x} ${polarToCartesian(size / 2, size / 2, innerRadius, slice.startAngle + slice.angle).y} ${innerArc} Z`;
            
            return <path key={i} d={pathData} fill={slice.color} />;
          })}
        </svg>
        
        <div className="space-y-1 max-w-xs">
          {slices.map((slice, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: slice.color }}></div>
              <span className="text-xs text-gray-700 truncate" title={slice.ten_san_pham || 'N/A'}>
                {slice.ten_san_pham || 'N/A'}: {formatPercent(slice.percent)}
                {useQuantity && <span className="text-gray-500 ml-1">({slice.value} sp)</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Báo cáo Marketing</h2>
          <p className="text-sm text-gray-500 mt-1">Phân tích hiệu quả khuyến mãi & voucher</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Date filter */}
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <span className="text-gray-500">→</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          
          {/* Toggle promotion type */}
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setPromotionType('voucher')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                promotionType === 'voucher'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <IoPricetag className="inline mr-1" />
              Voucher
            </button>
            <button
              onClick={() => setPromotionType('discount_program')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                promotionType === 'discount_program'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <IoGift className="inline mr-1" />
              Chương trình giảm giá
            </button>
          </div>
        </div>
      </div>

      {loading && <div className="text-center py-8 text-gray-500">Đang tải...</div>}

      {!loading && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <IoBarChart className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {promotionType === 'voucher' ? 'Tổng lượt sử dụng' : 'Tổng đơn áp dụng'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{totalUsage}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <IoTrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tổng giá trị giảm</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <IoPricetag className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">
                    {promotionType === 'voucher' ? 'Voucher đang chạy' : 'Chương trình đang chạy'}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">{summaryData.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Table */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {promotionType === 'voucher' ? 'Top Voucher hiệu quả' : 'Top Chương trình giảm giá'}
              </h3>
              <select
                value={summaryTopN}
                onChange={(e) => setSummaryTopN(Number(e.target.value))}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value={5}>Top 5</option>
                <option value={10}>Top 10</option>
                <option value={20}>Top 20</option>
              </select>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {promotionType === 'voucher' ? (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phát hành</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đã dùng</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá trị giảm</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hạng áp dụng</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên CT</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Đơn áp dụng</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Giá trị giảm</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SP bán chạy</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(promotionType === 'discount_program' && summaryWithProducts.length > 0 ? summaryWithProducts : summaryData).map((row, idx) => (
                    <tr key={idx}>
                      {promotionType === 'voucher' ? (
                        <>
                          <td className="px-4 py-3 text-sm text-gray-900">{row.ma_code || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{row.so_luong_phat_hanh || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{row.so_lan_su_dung || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(row.tong_gia_tri_giam)}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {row.hang_khach_hang_ap_dung ? tierNames[row.hang_khach_hang_ap_dung] || `Hạng ${row.hang_khach_hang_ap_dung}` : 'Tất cả'}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-sm text-gray-900">{row.ten_chuong_trinh || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{row.so_don_hang_ap_dung || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(row.tong_gia_tri_giam)}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {row.top_products && row.top_products.length > 0 ? (
                              <div className="space-y-2">
                                <div className="space-y-1">
                                  {row.top_products.slice(0, 3).map((product, pIdx) => (
                                    <div key={pIdx} className="flex items-center gap-1 text-xs">
                                      <span className="w-4 h-4 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full font-medium">
                                        {pIdx + 1}
                                      </span>
                                      <span className="truncate max-w-[150px]" title={product.ten_san_pham}>
                                        {product.ten_san_pham || 'N/A'}
                                      </span>
                                      <span className="text-gray-500">({product.so_luong_ban || 0})</span>
                                    </div>
                                  ))}
                                </div>
                                <button
                                  onClick={() => handleViewProductDetails(row)}
                                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline font-medium"
                                >
                                  Xem chi tiết →
                                </button>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">Chưa có dữ liệu</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              row.trang_thai === 'đang hoạt động' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {row.trang_thai || '—'}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hiệu suất theo ngày</h3>
            {renderPerformanceChart()}
          </div>

          {/* Customer Usage Charts for Voucher OR Product Performance for Discount Program */}
          {promotionType === 'voucher' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Sử dụng theo hạng KH (Tỷ trọng)</h3>
                  <select
                    value={customerTopN}
                    onChange={(e) => setCustomerTopN(Number(e.target.value))}
                    className="px-3 py-1 border border-gray-300 rounded text-sm"
                  >
                    <option value={3}>Top 3</option>
                    <option value={5}>Top 5</option>
                  </select>
                </div>
                {renderCustomerUsageDonut()}
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sử dụng theo hạng KH (So sánh)</h3>
                {renderCustomerUsageBar()}
              </div>
            </div>
          ) : (
            <>
              {/* Donut charts for top products distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Phân bổ Top {productTopN} (Giá trị giảm)
                    </h3>
                    <select
                      value={productTopN}
                      onChange={(e) => setProductTopN(Number(e.target.value))}
                      className="px-3 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value={3}>Top 3</option>
                      <option value={5}>Top 5</option>
                      <option value={10}>Top 10</option>
                    </select>
                  </div>
                  {renderProductDonut(topProducts, 'Top')}
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Phân bổ Top {productTopN} (Số lượng bán)
                    </h3>
                    <select
                      value={productTopN}
                      onChange={(e) => setProductTopN(Number(e.target.value))}
                      className="px-3 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value={3}>Top 3</option>
                      <option value={5}>Top 5</option>
                      <option value={10}>Top 10</option>
                    </select>
                  </div>
                  {renderProductDonut(topProducts, 'Top', true)}
                </div>
              </div>

              {/* Product lists */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Top sản phẩm giảm giá nhiều nhất
                  </h3>
                  {renderProductList(topProducts, 'Top')}
                </div>
                
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Sản phẩm giảm giá ít nhất
                  </h3>
                  {renderProductList(bottomProducts, 'Bottom')}
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Product Details Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                Chi tiết sản phẩm - {selectedProgramName}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              {selectedProgramProducts && selectedProgramProducts.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên sản phẩm</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã biến thể</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Số lượng bán</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Đơn áp dụng</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Giá trị giảm</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedProgramProducts.map((product, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{idx + 1}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">{product.ten_san_pham || 'N/A'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{product.sku || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{product.ma_bien_the || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">{product.so_luong_ban || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">{product.so_don_hang_ap_dung || 0}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">{formatCurrency(product.tong_gia_tri_giam)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">Không có dữ liệu</div>
              )}
            </div>
            
            <div className="p-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowProductModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingReport;
