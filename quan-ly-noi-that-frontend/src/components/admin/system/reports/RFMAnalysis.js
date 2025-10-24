import React from 'react';

const RFMAnalysis = ({ data, dateRange }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Phân Tích RFM</h3>
        <p className="text-gray-500">Không có dữ liệu</p>
      </div>
    );
  }

  // Group by segment
  const segments = {};
  data.forEach(item => {
    if (!segments[item.segment]) {
      segments[item.segment] = {
        count: 0,
        totalRevenue: 0,
        avgRecency: 0,
        avgFrequency: 0,
        avgMonetary: 0
      };
    }
    segments[item.segment].count += item.customer_count || 1;
    segments[item.segment].totalRevenue += item.total_revenue || 0;
    segments[item.segment].avgRecency += item.avg_recency || 0;
    segments[item.segment].avgFrequency += item.avg_frequency || 0;
    segments[item.segment].avgMonetary += item.avg_monetary || 0;
  });

  // Calculate averages
  Object.keys(segments).forEach(key => {
    const count = segments[key].count;
    segments[key].avgRecency /= count;
    segments[key].avgFrequency /= count;
    segments[key].avgMonetary /= count;
  });

  const segmentColors = {
    'Champions': 'bg-green-100 text-green-800',
    'Loyal': 'bg-blue-100 text-blue-800',
    'New': 'bg-purple-100 text-purple-800',
    'At Risk': 'bg-orange-100 text-orange-800',
    'Lost': 'bg-red-100 text-red-800'
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('vi-VN').format(Math.round(num));
  };

  const formatCurrency = (num) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">
        Phân Tích RFM - Phân Khúc Khách Hàng
      </h3>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {Object.entries(segments).map(([segment, stats]) => (
          <div key={segment} className={`p-4 rounded-lg ${segmentColors[segment] || 'bg-gray-100'}`}>
            <div className="text-sm font-medium mb-1">{segment}</div>
            <div className="text-2xl font-bold">{formatNumber(stats.count)}</div>
            <div className="text-xs mt-1">Khách hàng</div>
          </div>
        ))}
      </div>

      {/* Details Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phân khúc</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Số KH</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Recency (ngày)</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Frequency (đơn)</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monetary (TB)</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tổng doanh thu</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {Object.entries(segments).map(([segment, stats]) => (
              <tr key={segment} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-sm font-medium ${segmentColors[segment]}`}>
                    {segment}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">{formatNumber(stats.count)}</td>
                <td className="px-4 py-3 text-right">{stats.avgRecency.toFixed(1)}</td>
                <td className="px-4 py-3 text-right">{stats.avgFrequency.toFixed(1)}</td>
                <td className="px-4 py-3 text-right">{formatCurrency(stats.avgMonetary)}</td>
                <td className="px-4 py-3 text-right font-semibold">{formatCurrency(stats.totalRevenue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Explanation */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm">
        <p className="font-medium mb-2">Giải thích phân khúc RFM:</p>
        <ul className="space-y-1 text-gray-700">
          <li><span className="font-semibold text-green-700">Champions:</span> Khách hàng tốt nhất - Mua gần đây, mua thường xuyên, chi tiêu cao</li>
          <li><span className="font-semibold text-blue-700">Loyal:</span> Khách hàng trung thành - Mua thường xuyên</li>
          <li><span className="font-semibold text-purple-700">New:</span> Khách hàng mới - Mua gần đây lần đầu</li>
          <li><span className="font-semibold text-orange-700">At Risk:</span> Có nguy cơ rời bỏ - Đã lâu không mua</li>
          <li><span className="font-semibold text-red-700">Lost:</span> Đã mất - Rất lâu không mua lại</li>
        </ul>
      </div>
    </div>
  );
};

export default RFMAnalysis;
