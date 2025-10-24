import React from 'react';
import { IoBarChart, IoEye } from 'react-icons/io5';

const SalesReport = ({
  salesData,
  totalRevenue,
  totalOrders,
  averageOrderValue,
  revenueChartType,
  setRevenueChartType,
  ordersChartType,
  setOrdersChartType,
  formatCurrency,
  safeMax,
  safeMin,
  renderDayLabel
}) => {
  return (
    <>
      {/* Sales Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <IoBarChart className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-green-600 mt-1">+12.5%</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <IoBarChart className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tổng đơn hàng</p>
              <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
              <p className="text-xs text-green-600 mt-1">+8.2%</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <IoBarChart className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Giá trị đơn TB</p>
              <p className="text-2xl font-bold text-gray-900">{averageOrderValue ? formatCurrency(Math.round(averageOrderValue)) : '—'}</p>
              <p className="text-xs text-red-600 mt-1">-2.1%</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <IoBarChart className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Tỷ lệ chuyển đổi</p>
              <p className="text-2xl font-bold text-gray-900">3.2%</p>
              <p className="text-xs text-green-600 mt-1">+0.5%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts - Mỗi biểu đồ 1 hàng */}
      <div className="space-y-8 mb-8">
        {/* Revenue Trend */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Xu hướng doanh thu</h3>
              <p className="text-sm text-gray-500 mt-1">{revenueChartType === 'bar' ? 'Biểu đồ cột' : 'Biểu đồ đường'}</p>
            </div>
            <button
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              onClick={() => setRevenueChartType(revenueChartType === 'bar' ? 'line' : 'bar')}
              title={revenueChartType === 'bar' ? 'Xem biểu đồ đường' : 'Xem biểu đồ cột'}
            >
              <IoEye className="w-5 h-5" />
            </button>
          </div>
          <div className="h-64 relative">
            {salesData.length > 0 ? (
              revenueChartType === 'bar' ? (
                <div className="h-full flex pl-24">
                  {/* Y-axis labels */}
                  <div className="absolute left-0 top-0 bottom-0 w-20 flex flex-col justify-between pr-2">
                    {[0, 1, 2, 3, 4].map((i) => {
                      const maxRevenue = safeMax(salesData, d => d.revenue) || 1;
                      const value = (maxRevenue / 4) * (4 - i);
                      return (
                        <span key={i} className="text-xs text-gray-500 text-right">{formatCurrency(Math.round(value))}</span>
                      );
                    })}
                  </div>
                  
                  {/* Grid lines */}
                  <div className="absolute left-20 right-0 top-0 bottom-0 flex flex-col justify-between pointer-events-none">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i} className="border-t border-gray-200"></div>
                    ))}
                  </div>
                  
                  {/* Bars */}
                  <div className="h-full flex-1 flex items-end justify-between gap-1 px-2 relative z-10">
                    {salesData.map((day, index) => {
                      const maxRevenue = safeMax(salesData, d => d.revenue) || 1;
                      const heightPercent = ((Number(day.revenue) || 0) / maxRevenue) * 100;
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center group">
                          <div
                            className="bg-gradient-to-t from-blue-600 to-blue-400 rounded-t w-full mb-1 hover:from-blue-700 hover:to-blue-500 transition-all cursor-pointer relative"
                            style={{ height: `${Math.max(heightPercent, 1)}%`, minHeight: heightPercent > 0 ? '4px' : '0px' }}
                          >
                            <div className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                              {renderDayLabel(day)}<br />
                              {formatCurrency(day.revenue)}
                            </div>
                          </div>
                          {(salesData.length <= 15 || index % Math.ceil(salesData.length / 10) === 0) && (
                            <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">{renderDayLabel(day)}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-full flex pl-24">
                  {/* Y-axis labels */}
                  <div className="absolute left-0 top-0 bottom-0 w-20 flex flex-col justify-between pr-2">
                    {[0, 1, 2, 3, 4].map((i) => {
                      const maxRevenue = safeMax(salesData, d => d.revenue) || 1;
                      const value = (maxRevenue / 4) * (4 - i);
                      return (
                        <span key={i} className="text-xs text-gray-500 text-right">{formatCurrency(Math.round(value))}</span>
                      );
                    })}
                  </div>
                  
                  {/* SVG Chart */}
                  <div className="flex-1 relative">
                    <svg className="w-full h-full" viewBox="0 0 800 256" preserveAspectRatio="none">
                      {/* Grid lines */}
                      {[0, 1, 2, 3, 4].map((i) => {
                        const y = (i / 4) * 256;
                        return <line key={i} x1="0" y1={y} x2="800" y2={y} stroke="#E5E7EB" strokeWidth="1" />;
                      })}
                      
                      <defs>
                        <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {(() => {
                        const maxRevenue = safeMax(salesData, d => d.revenue) || 1;
                        const points = salesData
                          .map((day, index) => {
                            const x = (index / (salesData.length - 1)) * 800;
                            const y = 256 - ((Number(day.revenue) || 0) / maxRevenue) * 240;
                            return `${x},${y}`;
                          })
                          .join(' ');
                        const areaPoints = `0,256 ${points} 800,256`;
                        return (
                          <>
                            <polygon points={areaPoints} fill="url(#areaGradient)" />
                            <polyline points={points} fill="none" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            {salesData.map((day, index) => {
                              const x = (index / (salesData.length - 1)) * 800;
                              const y = 256 - ((Number(day.revenue) || 0) / maxRevenue) * 240;
                              return (
                                <g key={index}>
                                  <circle cx={x} cy={y} r="4" fill="#3B82F6" stroke="white" strokeWidth="2" className="hover:r-6 transition-all cursor-pointer">
                                    <title>
                                      {renderDayLabel(day)}: {formatCurrency(day.revenue)}
                                    </title>
                                  </circle>
                                </g>
                              );
                            })}
                          </>
                        );
                      })()}
                      {salesData.map((day, index) => {
                        if (salesData.length <= 15 || index % Math.ceil(salesData.length / 10) === 0) {
                          const x = (index / (salesData.length - 1)) * 800;
                          return (
                            <text key={index} x={x} y="270" textAnchor="middle" fontSize="10" fill="#6B7280">
                              {renderDayLabel(day)}
                            </text>
                          );
                        }
                        return null;
                      })}
                    </svg>
                  </div>
                </div>
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">Chưa có dữ liệu</div>
            )}
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Cao nhất</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(safeMax(salesData, d => d.revenue))}</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Trung bình</p>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(Math.round(totalRevenue / Math.max(salesData.length, 1)))}</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Thấp nhất</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(safeMin(salesData.filter(d => d.revenue > 0), d => d.revenue) || 0)}</p>
            </div>
          </div>
        </div>

        {/* Orders Trend */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Số đơn hàng theo ngày</h3>
              <p className="text-sm text-gray-500 mt-1">{ordersChartType === 'bar' ? 'Biểu đồ cột' : 'Biểu đồ đường'}</p>
            </div>
            <button
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              onClick={() => setOrdersChartType(ordersChartType === 'bar' ? 'line' : 'bar')}
              title={ordersChartType === 'bar' ? 'Xem biểu đồ đường' : 'Xem biểu đồ cột'}
            >
              <IoEye className="w-5 h-5" />
            </button>
          </div>
          <div className="h-64 relative">
            {salesData.length > 0 ? (
              ordersChartType === 'bar' ? (
                <div className="h-full flex pl-20">
                  {/* Y-axis labels and grid */}
                  <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between pr-2">
                    {[0, 1, 2, 3, 4].map((i) => {
                      const maxOrders = safeMax(salesData, d => d.orders) || 1;
                      const value = (maxOrders / 4) * (4 - i);
                      return (
                        <span key={i} className="text-xs text-gray-500 text-right">{Math.round(value)}</span>
                      );
                    })}
                  </div>
                  
                  {/* Grid lines */}
                  <div className="absolute left-16 right-0 top-0 bottom-0 flex flex-col justify-between pointer-events-none">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i} className="border-t border-gray-200"></div>
                    ))}
                  </div>
                  
                  {/* Bars */}
                  <div className="h-full flex-1 flex items-end justify-between gap-1 px-2 relative z-10">
                    {salesData.map((day, index) => {
                      const maxOrders = safeMax(salesData, d => d.orders) || 1;
                      const heightPercent = ((Number(day.orders) || 0) / maxOrders) * 100;
                      return (
                        <div key={index} className="flex-1 flex flex-col items-center group">
                          <div
                            className="bg-gradient-to-t from-green-600 to-green-400 rounded-t w-full mb-1 hover:from-green-700 hover:to-green-500 transition-all cursor-pointer relative"
                            style={{ height: `${Math.max(heightPercent, 1)}%`, minHeight: heightPercent > 0 ? '4px' : '0px' }}
                          >
                            <div className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                              {renderDayLabel(day)}<br />
                              {day.orders} đơn
                            </div>
                          </div>
                          {(salesData.length <= 15 || index % Math.ceil(salesData.length / 10) === 0) && (
                            <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-top-left whitespace-nowrap">{renderDayLabel(day)}</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-full flex pl-20">
                  {/* Y-axis labels */}
                  <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between pr-2">
                    {[0, 1, 2, 3, 4].map((i) => {
                      const maxOrders = safeMax(salesData, d => d.orders) || 1;
                      const value = (maxOrders / 4) * (4 - i);
                      return (
                        <span key={i} className="text-xs text-gray-500 text-right">{Math.round(value)}</span>
                      );
                    })}
                  </div>
                  
                  {/* SVG Chart */}
                  <div className="flex-1 relative">
                    <svg className="w-full h-full" viewBox="0 0 800 256" preserveAspectRatio="none">
                      {/* Grid lines */}
                      {[0, 1, 2, 3, 4].map((i) => {
                        const y = (i / 4) * 256;
                        return <line key={i} x1="0" y1={y} x2="800" y2={y} stroke="#E5E7EB" strokeWidth="1" />;
                      })}
                      
                      <defs>
                        <linearGradient id="ordersAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                      {(() => {
                        const maxOrders = safeMax(salesData, d => d.orders) || 1;
                        const points = salesData
                          .map((day, index) => {
                            const x = (index / (salesData.length - 1)) * 800;
                            const y = 256 - ((Number(day.orders) || 0) / maxOrders) * 240;
                            return `${x},${y}`;
                          })
                          .join(' ');
                        const areaPoints = `0,256 ${points} 800,256`;
                        return (
                          <>
                            <polygon points={areaPoints} fill="url(#ordersAreaGradient)" />
                            <polyline points={points} fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            {salesData.map((day, index) => {
                              const x = (index / (salesData.length - 1)) * 800;
                              const y = 256 - ((Number(day.orders) || 0) / maxOrders) * 240;
                              return (
                                <g key={index}>
                                  <circle cx={x} cy={y} r="4" fill="#10B981" stroke="white" strokeWidth="2" className="hover:r-6 transition-all cursor-pointer">
                                    <title>
                                      {renderDayLabel(day)}: {day.orders} đơn
                                    </title>
                                  </circle>
                                </g>
                              );
                            })}
                          </>
                        );
                      })()}
                      {salesData.map((day, index) => {
                        if (salesData.length <= 15 || index % Math.ceil(salesData.length / 10) === 0) {
                          const x = (index / (salesData.length - 1)) * 800;
                          return (
                            <text key={index} x={x} y="270" textAnchor="middle" fontSize="10" fill="#6B7280">
                              {renderDayLabel(day)}
                            </text>
                          );
                        }
                        return null;
                      })}
                    </svg>
                  </div>
                </div>
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">Chưa có dữ liệu</div>
            )}
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Ngày đông nhất</p>
              <p className="text-lg font-bold text-green-600">{safeMax(salesData, d => d.orders)} đơn</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">TB/ngày</p>
              <p className="text-lg font-bold text-blue-600">{Math.round(totalOrders / Math.max(salesData.length, 1))} đơn</p>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Ngày ít nhất</p>
              <p className="text-lg font-bold text-red-600">{safeMin(salesData.filter(d => d.orders > 0), d => d.orders) || 0} đơn</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SalesReport;
