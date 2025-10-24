import React from 'react';

const VoucherUsageChart = ({ data, dateRange }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Tỷ Lệ Sử Dụng Voucher Theo Hạng</h3>
        <p className="text-gray-500">Không có dữ liệu</p>
      </div>
    );
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(Math.round(num));
  };

  // Calculate total for percentage
  const totalCustomers = data.reduce((sum, item) => sum + (item.total_customers || 0), 0);
  const totalVoucherUsers = data.reduce((sum, item) => sum + (item.voucher_users || 0), 0);
  const overallRate = totalCustomers > 0 ? (totalVoucherUsers / totalCustomers * 100) : 0;

  // Colors for each tier
  const tierColors = [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
  ];

  // SVG Donut Chart
  const size = 300;
  const strokeWidth = 60;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;

  let currentAngle = -90; // Start from top
  const segments = data.map((item, index) => {
    const percentage = item.voucher_usage_rate || 0;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;

    // Calculate arc path
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (currentAngle * Math.PI) / 180;
    
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;

    return {
      ...item,
      color: tierColors[index % tierColors.length],
      path: `M ${center},${center} L ${x1},${y1} A ${radius},${radius} 0 ${largeArc},1 ${x2},${y2} Z`,
      percentage
    };
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">
        Tỷ Lệ Sử Dụng Voucher Theo Hạng Thành Viên
      </h3>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div className="flex flex-col items-center">
          <div className="relative">
            <svg width={size} height={size} className="transform -rotate-90">
              {segments.map((seg, idx) => (
                <path
                  key={idx}
                  d={seg.path}
                  fill={seg.color}
                  className="hover:opacity-80 cursor-pointer transition-opacity"
                  title={`${seg.tier_name}: ${seg.percentage.toFixed(1)}%`}
                />
              ))}
              {/* Center circle for donut hole */}
              <circle
                cx={center}
                cy={center}
                r={radius - strokeWidth / 2}
                fill="white"
              />
            </svg>
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-gray-900">{overallRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-500">Tỷ lệ TB</div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 space-y-2 w-full">
            {segments.map((seg, idx) => (
              <div key={idx} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded" 
                    style={{ backgroundColor: seg.color }}
                  ></div>
                  <span className="text-sm">{seg.tier_name}</span>
                </div>
                <span className="text-sm font-semibold">{seg.percentage.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Table */}
        <div>
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Hạng</th>
                <th className="text-right py-2">Tổng KH</th>
                <th className="text-right py-2">KH dùng voucher</th>
                <th className="text-right py-2">Tỷ lệ</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded" 
                        style={{ backgroundColor: tierColors[idx % tierColors.length] }}
                      ></div>
                      <span className="font-medium">{item.tier_name}</span>
                    </div>
                  </td>
                  <td className="text-right py-3">{formatNumber(item.total_customers)}</td>
                  <td className="text-right py-3">{formatNumber(item.voucher_users)}</td>
                  <td className="text-right py-3 font-semibold">
                    {(item.voucher_usage_rate || 0).toFixed(1)}%
                  </td>
                </tr>
              ))}
              <tr className="font-bold bg-gray-50">
                <td className="py-3">Tổng</td>
                <td className="text-right py-3">{formatNumber(totalCustomers)}</td>
                <td className="text-right py-3">{formatNumber(totalVoucherUsers)}</td>
                <td className="text-right py-3">{overallRate.toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
            <p className="font-medium mb-1">Nhận xét:</p>
            <p className="text-gray-700">
              {overallRate >= 50 
                ? "Tỷ lệ sử dụng voucher cao, chương trình khuyến mãi hiệu quả."
                : "Cần cải thiện chương trình voucher để tăng tỷ lệ sử dụng."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoucherUsageChart;
