import React from 'react';

const PurchaseFrequency = ({ data, dateRange }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Phân Phối Tần Suất Mua Hàng</h3>
        <p className="text-gray-500">Không có dữ liệu</p>
      </div>
    );
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(Math.round(num));
  };

  const totalCustomers = data.reduce((sum, item) => sum + (item.customer_count || 0), 0);
  const maxCount = Math.max(...data.map(item => item.customer_count || 0));

  // Sort data by order range
  const sortedData = [...data].sort((a, b) => {
    const getMinOrder = (range) => {
      if (range === '1') return 1;
      if (range === '2') return 2;
      if (range.startsWith('3-')) return 3;
      if (range.startsWith('6-')) return 6;
      if (range.includes('+')) return 11;
      return 0;
    };
    return getMinOrder(a.order_range) - getMinOrder(b.order_range);
  });

  // Chart dimensions
  const chartHeight = 300;
  const chartWidth = 600;
  const padding = { top: 20, right: 30, bottom: 60, left: 60 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const barWidth = innerWidth / sortedData.length - 10;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">
        Phân Phối Tần Suất Mua Hàng
      </h3>

      <div className="mb-6">
        <svg width={chartWidth} height={chartHeight} className="mx-auto">
          {/* Y-axis */}
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={chartHeight - padding.bottom}
            stroke="#9ca3af"
            strokeWidth="2"
          />
          {/* X-axis */}
          <line
            x1={padding.left}
            y1={chartHeight - padding.bottom}
            x2={chartWidth - padding.right}
            y2={chartHeight - padding.bottom}
            stroke="#9ca3af"
            strokeWidth="2"
          />

          {/* Y-axis labels and grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
            const y = chartHeight - padding.bottom - (tick * innerHeight);
            const value = Math.round(tick * maxCount);
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  strokeDasharray="4"
                />
                <text
                  x={padding.left - 10}
                  y={y}
                  textAnchor="end"
                  alignmentBaseline="middle"
                  className="text-xs fill-gray-600"
                >
                  {value}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {sortedData.map((item, index) => {
            const count = item.customer_count || 0;
            const percentage = totalCustomers > 0 ? (count / totalCustomers * 100) : 0;
            const barHeight = (count / maxCount) * innerHeight;
            const x = padding.left + (index * (innerWidth / sortedData.length)) + (innerWidth / sortedData.length - barWidth) / 2;
            const y = chartHeight - padding.bottom - barHeight;

            return (
              <g key={index}>
                {/* Bar */}
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  fill="#3b82f6"
                  className="hover:fill-blue-600 cursor-pointer"
                  opacity="0.8"
                />
                {/* Value label */}
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  className="text-xs font-semibold fill-gray-700"
                >
                  {formatNumber(count)}
                </text>
                {/* Percentage label */}
                <text
                  x={x + barWidth / 2}
                  y={y - 18}
                  textAnchor="middle"
                  className="text-xs fill-gray-500"
                >
                  ({percentage.toFixed(1)}%)
                </text>
                {/* X-axis label */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - padding.bottom + 20}
                  textAnchor="middle"
                  className="text-sm fill-gray-700"
                >
                  {item.order_range}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - padding.bottom + 35}
                  textAnchor="middle"
                  className="text-xs fill-gray-500"
                >
                  đơn
                </text>
              </g>
            );
          })}

          {/* Axis labels */}
          <text
            x={padding.left - 45}
            y={chartHeight / 2}
            textAnchor="middle"
            className="text-sm font-medium fill-gray-700"
            transform={`rotate(-90, ${padding.left - 45}, ${chartHeight / 2})`}
          >
            Số lượng khách hàng
          </text>
          <text
            x={chartWidth / 2}
            y={chartHeight - 5}
            textAnchor="middle"
            className="text-sm font-medium fill-gray-700"
          >
            Số đơn hàng
          </text>
        </svg>
      </div>

      {/* Stats Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Tần suất (số đơn)</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">Số khách hàng</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">Tỷ lệ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sortedData.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3">{item.order_range} đơn</td>
                <td className="px-4 py-3 text-right font-semibold">{formatNumber(item.customer_count)}</td>
                <td className="px-4 py-3 text-right">
                  {((item.customer_count / totalCustomers) * 100).toFixed(1)}%
                </td>
              </tr>
            ))}
            <tr className="font-bold bg-gray-50">
              <td className="px-4 py-3">Tổng</td>
              <td className="px-4 py-3 text-right">{formatNumber(totalCustomers)}</td>
              <td className="px-4 py-3 text-right">100%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Insights */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm">
        <p className="font-medium mb-2">Phân tích:</p>
        <ul className="space-y-1 text-gray-700">
          <li>
            <strong>Khách hàng mua 1 lần:</strong> {' '}
            {sortedData[0] ? `${formatNumber(sortedData[0].customer_count)} người (${((sortedData[0].customer_count / totalCustomers) * 100).toFixed(1)}%)` : 'N/A'}
          </li>
          <li>
            <strong>Khách hàng trung thành (≥6 đơn):</strong> {' '}
            {(() => {
              const loyalCustomers = sortedData
                .filter(item => item.order_range.startsWith('6-') || item.order_range.includes('+'))
                .reduce((sum, item) => sum + item.customer_count, 0);
              return `${formatNumber(loyalCustomers)} người (${((loyalCustomers / totalCustomers) * 100).toFixed(1)}%)`;
            })()}
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PurchaseFrequency;
