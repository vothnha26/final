import React from 'react';

const CohortRetention = ({ data, dateRange }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Phân Tích Retention Cohort</h3>
        <p className="text-gray-500">Không có dữ liệu</p>
      </div>
    );
  }

  // Build cohort matrix
  const cohorts = {};
  data.forEach(row => {
    const cohortMonth = row.cohort_month;
    const monthsSince = row.months_since_first || 0;
    
    if (!cohorts[cohortMonth]) {
      cohorts[cohortMonth] = {
        cohort_size: row.cohort_size || 0,
        months: {}
      };
    }
    cohorts[cohortMonth].months[monthsSince] = {
      retained: row.customers_retained || 0,
      rate: row.retention_rate || 0
    };
  });

  const cohortMonths = Object.keys(cohorts).sort();
  const maxMonths = Math.max(...data.map(r => r.months_since_first || 0));

  // Color scale for heatmap
  const getColor = (rate) => {
    if (rate >= 80) return 'bg-green-600 text-white';
    if (rate >= 60) return 'bg-green-400 text-white';
    if (rate >= 40) return 'bg-yellow-400 text-gray-900';
    if (rate >= 20) return 'bg-orange-400 text-white';
    if (rate >= 0) return 'bg-red-400 text-white';
    return 'bg-gray-200 text-gray-500';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">
        Phân Tích Retention Cohort - Giữ Chân Khách Hàng
      </h3>
      
      <div className="mb-4 text-sm text-gray-600">
        <p>Tỷ lệ khách hàng quay lại theo tháng (%) - Xanh: Tốt, Đỏ: Cần cải thiện</p>
      </div>

      {/* Heatmap */}
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr>
              <th className="px-3 py-2 bg-gray-100 border text-left font-medium">Tháng cohort</th>
              <th className="px-3 py-2 bg-gray-100 border text-center font-medium">Số KH</th>
              {[...Array(maxMonths + 1)].map((_, i) => (
                <th key={i} className="px-3 py-2 bg-gray-100 border text-center font-medium">
                  M{i}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cohortMonths.map(cohortMonth => {
              const cohortData = cohorts[cohortMonth];
              return (
                <tr key={cohortMonth}>
                  <td className="px-3 py-2 border font-medium bg-gray-50">{cohortMonth}</td>
                  <td className="px-3 py-2 border text-center bg-gray-50">{cohortData.cohort_size}</td>
                  {[...Array(maxMonths + 1)].map((_, monthIndex) => {
                    const monthData = cohortData.months[monthIndex];
                    if (!monthData) {
                      return <td key={monthIndex} className="px-3 py-2 border bg-gray-100"></td>;
                    }
                    const rate = monthData.rate;
                    return (
                      <td 
                        key={monthIndex} 
                        className={`px-3 py-2 border text-center font-semibold ${getColor(rate)}`}
                        title={`${monthData.retained} khách hàng (${rate.toFixed(1)}%)`}
                      >
                        {rate.toFixed(0)}%
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center gap-4 text-sm">
        <span className="font-medium">Chú thích:</span>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-green-600 text-white rounded">≥80%</span>
          <span className="px-3 py-1 bg-green-400 text-white rounded">60-79%</span>
          <span className="px-3 py-1 bg-yellow-400 text-gray-900 rounded">40-59%</span>
          <span className="px-3 py-1 bg-orange-400 text-white rounded">20-39%</span>
          <span className="px-3 py-1 bg-red-400 text-white rounded">&lt;20%</span>
        </div>
      </div>

      {/* Explanation */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm">
        <p className="font-medium mb-2">Cách đọc bảng Cohort:</p>
        <ul className="space-y-1 text-gray-700">
          <li><strong>M0:</strong> Tháng khách hàng mua lần đầu (luôn 100%)</li>
          <li><strong>M1, M2, ...:</strong> Tỷ lệ khách hàng quay lại mua sau 1, 2, ... tháng</li>
          <li><strong>Màu xanh:</strong> Retention tốt, khách hàng trung thành</li>
          <li><strong>Màu đỏ:</strong> Cần cải thiện chương trình giữ chân khách hàng</li>
        </ul>
      </div>
    </div>
  );
};

export default CohortRetention;
