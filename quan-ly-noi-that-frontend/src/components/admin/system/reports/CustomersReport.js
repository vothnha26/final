import React from 'react';

const CustomersReport = ({
  customerSegmentation,
  customerGrowth,
  topSpenders,
  formatCurrency,
  formatNumber,
  renderDayLabel
}) => {
  return (
    <>
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-600">Tổng khách hàng</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatNumber(customerSegmentation.reduce((s, r) => s + (Number(r.count ?? r.SoLuong ?? 0) || 0), 0))}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-600">Doanh thu theo phân khúc</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(customerSegmentation.reduce((s, r) => s + (Number(r.revenue ?? r.DoanhThu ?? 0) || 0), 0))}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-sm text-gray-600">Top 10 chi tiêu</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            {formatCurrency(topSpenders.reduce((s, r) => s + (Number(r.totalSpend ?? r.TongChiTieu ?? 0) || 0), 0))}
          </p>
        </div>
      </div>

      {/* Segmentation Bar Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Phân khúc theo hạng thành viên</h3>
        </div>
        <div className="h-80">
          {customerSegmentation.length > 0 ? (
            (() => {
              const maxVal = Math.max(
                ...customerSegmentation.map(r => Number(r.count ?? r.SoLuong ?? 0) || 0),
                10
              );
              const yAxisValues = [maxVal, Math.round(maxVal * 0.75), Math.round(maxVal * 0.5), Math.round(maxVal * 0.25), 0];
              const totalCustomers = customerSegmentation.reduce((s, r) => s + (Number(r.count ?? r.SoLuong ?? 0) || 0), 0);
              
              return (
                <>
                  <div className="flex h-64">
                    {/* Y-axis */}
                    <div className="flex flex-col justify-between pr-3 text-right" style={{ width: 50 }}>
                      {yAxisValues.map((val, idx) => (
                        <div key={idx} className="text-xs text-gray-600 h-5 flex items-center justify-end">
                          {formatNumber(val)}
                        </div>
                      ))}
                    </div>
                    
                    {/* Chart area */}
                    <div className="flex-1 flex flex-col">
                      {/* Grid and bars */}
                      <div className="flex-1 relative">
                        {/* Horizontal grid lines */}
                        {yAxisValues.map((_, idx) => (
                          <div 
                            key={idx}
                            className="absolute left-0 right-0 border-t border-gray-200"
                            style={{ top: `${(idx / (yAxisValues.length - 1)) * 100}%` }}
                          />
                        ))}
                        
                        {/* Bars container */}
                        <div className="absolute inset-0 flex items-end justify-around px-4">
                          {customerSegmentation.map((r, idx) => {
                            const val = Number(r.count ?? r.SoLuong ?? 0) || 0;
                            const heightPercent = maxVal > 0 ? (val / maxVal) * 100 : 0;
                            const percentage = totalCustomers > 0 ? ((val / totalCustomers) * 100).toFixed(1) : 0;
                            
                            return (
                              <div key={idx} className="flex flex-col items-center group relative" style={{ width: '18%', maxWidth: 80 }}>
                                {/* Value on top */}
                                <div className="text-sm font-bold text-gray-700 mb-1">
                                  {formatNumber(val)}
                                </div>
                                
                                {/* Bar */}
                                <div className="relative w-full">
                                  <div
                                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t hover:from-blue-700 hover:to-blue-500 transition-all cursor-pointer shadow-lg"
                                    style={{ 
                                      height: heightPercent > 0 ? `${heightPercent * 2.2}px` : '0px',
                                      minHeight: val > 0 ? '4px' : '0'
                                    }}
                                  >
                                    {/* Tooltip */}
                                    <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs rounded py-2 px-3 whitespace-nowrap shadow-xl z-50">
                                      <div className="font-semibold text-sm">{r.level ?? r.ten_hang ?? '—'}</div>
                                      <div className="mt-1">Khách hàng: <span className="font-bold text-blue-300">{formatNumber(val)}</span></div>
                                      <div>Tỷ lệ: <span className="font-bold text-green-300">{percentage}%</span></div>
                                      <div className="mt-1 pt-1 border-t border-gray-700">
                                        Doanh thu: <span className="font-bold text-yellow-300">{formatCurrency(r.revenue ?? r.DoanhThu ?? 0)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* X-axis labels */}
                      <div className="flex justify-around px-4 mt-3">
                        {customerSegmentation.map((r, idx) => (
                          <div key={idx} className="text-sm font-semibold text-gray-700 text-center" style={{ width: '18%', maxWidth: 80 }}>
                            {r.level ?? r.ten_hang ?? '—'}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* X-axis title */}
                  <div className="text-center text-xs font-medium text-gray-500 mt-2">Hạng thành viên</div>
                  
                  {/* Summary */}
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      Tổng khách hàng: <span className="font-bold text-blue-600 text-lg">{formatNumber(totalCustomers)}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Tổng doanh thu: <span className="font-bold text-green-600 text-lg">
                        {formatCurrency(customerSegmentation.reduce((s, r) => s + (Number(r.revenue ?? r.DoanhThu ?? 0) || 0), 0))}
                      </span>
                    </div>
                  </div>
                </>
              );
            })()
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">Chưa có dữ liệu</div>
          )}
        </div>
      </div>

      {/* Growth Line Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Tăng trưởng KH mới vs quay lại</h3>
          {/* Legend */}
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500"></div>
              <span className="font-medium">Khách mới</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500"></div>
              <span className="font-medium">Quay lại</span>
            </div>
          </div>
        </div>
        <div className="h-64 flex">
            {customerGrowth.length > 0 ? (
              (() => {
                // Find max value for Y-axis scaling
                const maxVal = Math.max(
                  ...customerGrowth.map(r => Math.max(
                    Number(r.KhachMoi ?? r.khachMoi ?? 0) || 0, 
                    Number(r.KhachQuayLai ?? r.khachQuayLai ?? 0) || 0
                  )),
                  10 // Minimum scale
                );
                
                // Y-axis labels (5 levels: 0%, 25%, 50%, 75%, 100%)
                const yLabels = [0, 0.25, 0.5, 0.75, 1].map(p => Math.round(maxVal * p));
                
                // Chart dimensions
                const W = 800, H = 240, PADL = 40, PADR = 20, PADT = 10, PADB = 30;
                const chartW = W - PADL - PADR;
                const chartH = H - PADT - PADB;
                
                // Position helpers
                const xPos = (i) => PADL + (customerGrowth.length <= 1 ? chartW / 2 : (i / (customerGrowth.length - 1)) * chartW);
                const yPos = (v) => PADT + chartH - (v / maxVal) * chartH;
                
                // Build polyline points
                const ptsNew = customerGrowth.map((r, i) => 
                  `${xPos(i)},${yPos(Number(r.KhachMoi ?? r.khachMoi ?? 0) || 0)}`
                ).join(' ');
                const ptsRet = customerGrowth.map((r, i) => 
                  `${xPos(i)},${yPos(Number(r.KhachQuayLai ?? r.khachQuayLai ?? 0) || 0)}`
                ).join(' ');
                
                return (
                  <>
                    {/* Y-axis container */}
                    <div className="flex flex-col w-20 pr-2">
                      {/* Y-axis labels */}
                      <div className="flex-1 flex flex-col justify-between text-right text-xs text-gray-600 py-2">
                        {[...yLabels].reverse().map((val, i) => (
                          <div key={i} className="leading-none">{formatNumber(val)}</div>
                        ))}
                      </div>
                      {/* Axis label */}
                      <div className="text-[10px] font-medium text-gray-500 text-center pb-2">Số lượng/Thời gian</div>
                    </div>
                    
                    {/* Chart SVG */}
                    <div className="flex-1 relative">
                      <svg className="w-full h-full" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
                        {/* Horizontal grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
                          const y = yPos(maxVal * p);
                          return (
                            <line key={idx} x1={PADL} x2={W - PADR} y1={y} y2={y} 
                              stroke="#E5E7EB" strokeWidth="1" strokeDasharray="3,3" />
                          );
                        })}
                        
                        {/* Area fills (optional - for better visualization) */}
                        <polygon 
                          points={`${PADL},${yPos(0)} ${ptsNew} ${xPos(customerGrowth.length - 1)},${yPos(0)}`}
                          fill="#3B82F6" fillOpacity="0.1" 
                        />
                        <polygon 
                          points={`${PADL},${yPos(0)} ${ptsRet} ${xPos(customerGrowth.length - 1)},${yPos(0)}`}
                          fill="#10B981" fillOpacity="0.1" 
                        />
                        
                        {/* Line for "Khách mới" */}
                        <polyline 
                          points={ptsNew} 
                          fill="none" 
                          stroke="#3B82F6" 
                          strokeWidth="3" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                        />
                        
                        {/* Line for "Quay lại" */}
                        <polyline 
                          points={ptsRet} 
                          fill="none" 
                          stroke="#10B981" 
                          strokeWidth="3" 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                        />
                        
                        {/* Data points with tooltips */}
                        {customerGrowth.map((r, i) => {
                          const x = xPos(i);
                          const y1 = yPos(Number(r.KhachMoi ?? r.khachMoi ?? 0) || 0);
                          const y2 = yPos(Number(r.KhachQuayLai ?? r.khachQuayLai ?? 0) || 0);
                          const valNew = Number(r.KhachMoi ?? r.khachMoi ?? 0) || 0;
                          const valRet = Number(r.KhachQuayLai ?? r.khachQuayLai ?? 0) || 0;
                          
                          return (
                            <g key={i}>
                              {/* Point for "Khách mới" */}
                              <circle cx={x} cy={y1} r="5" fill="#3B82F6" stroke="#fff" strokeWidth="2" className="hover:r-7 cursor-pointer">
                                <title>{renderDayLabel({ date: r.Ngay ?? r.ngay })}: {valNew} khách mới</title>
                              </circle>
                              
                              {/* Point for "Quay lại" */}
                              <circle cx={x} cy={y2} r="5" fill="#10B981" stroke="#fff" strokeWidth="2" className="hover:r-7 cursor-pointer">
                                <title>{renderDayLabel({ date: r.Ngay ?? r.ngay })}: {valRet} khách quay lại</title>
                              </circle>
                            </g>
                          );
                        })}
                        
                        {/* X-axis labels (show every nth label to avoid crowding) */}
                        {customerGrowth.map((r, i) => {
                          const showLabel = customerGrowth.length <= 10 
                            ? true 
                            : (i % Math.ceil(customerGrowth.length / 10) === 0 || i === customerGrowth.length - 1);
                          
                          if (!showLabel) return null;
                          
                          return (
                            <text 
                              key={`lbl-${i}`} 
                              x={xPos(i)} 
                              y={H - 8} 
                              textAnchor="middle" 
                              fontSize="10" 
                              fill="#6B7280"
                            >
                              {renderDayLabel({ date: r.Ngay ?? r.ngay })}
                            </text>
                          );
                        })}
                        
                        {/* Axis labels removed - now outside SVG */}
                      </svg>
                      
                      {/* Summary stats */}
                      <div className="absolute bottom-15 left-2 text-xs text-gray-600 bg-white/90 rounded px-2 py-1 shadow-sm">
                        <div>Tổng mới: <span className="font-semibold text-blue-600">
                          {formatNumber(customerGrowth.reduce((s, r) => s + (Number(r.KhachMoi ?? r.khachMoi ?? 0) || 0), 0))}
                        </span></div>
                        <div>Tổng quay lại: <span className="font-semibold text-green-600">
                          {formatNumber(customerGrowth.reduce((s, r) => s + (Number(r.KhachQuayLai ?? r.khachQuayLai ?? 0) || 0), 0))}
                        </span></div>
                      </div>
                    </div>
                  </>
                );
              })()
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">Chưa có dữ liệu</div>
            )}
          </div>
        </div>

      {/* Top Spenders Table */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Top khách hàng chi tiêu</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Số đơn</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng chi tiêu</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topSpenders.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-4 py-6 text-center text-gray-400">Chưa có dữ liệu</td>
                </tr>
              ) : (
                topSpenders.map((r, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900">{r.customerName ?? r.ten_khach_hang ?? `#${r.customerId ?? r.ma_khach_hang}`}</td>
                    <td className="px-4 py-2 text-sm text-right">{formatNumber(r.orders ?? r.soDon ?? 0)}</td>
                    <td className="px-4 py-2 text-sm text-right font-semibold">{formatCurrency(r.totalSpend ?? r.TongChiTieu ?? 0)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default CustomersReport;
