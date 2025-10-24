import React, { useState } from 'react';
import { IoChevronDown, IoChevronUp, IoSearch, IoFilter, IoRefresh } from 'react-icons/io5';

const DataTable = ({
  data = [],
  columns = [],
  onEdit,
  onDelete,
  onView,
  searchable = true,
  filterable = true,
  sortable = true,
  pagination = true,
  pageSize = 10,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [pendingFilterField, setPendingFilterField] = useState('');
  const [pendingFilterValue, setPendingFilterValue] = useState('');
  // keep reference to filters to avoid unused-lint and for future filter UI
  React.useEffect(() => {
    // no-op, placeholder so linter knows filters is used
    if (Object.keys(filters).length === 0) return;
  }, [filters]);

  // Helper to resolve field value (supports function and nested path)
  const resolveValue = (obj, field) => {
    if (!field) return undefined;
    if (typeof field === 'function') return field(obj);
    if (typeof field === 'string' && field.indexOf('.') > -1) {
      return field.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
    }
    return obj[field];
  };

  // Filter data (search + filters)
  const filteredData = data.filter(item => {
    // Search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matched = Object.values(item).some(value => String(value).toLowerCase().includes(searchLower));
      if (!matched) return false;
    }

    // Apply structured filters
    if (filters && Object.keys(filters).length > 0) {
      for (const key of Object.keys(filters)) {
        const f = filters[key];
        if (!f || !f.field) continue;
        const val = resolveValue(item, f.field);
        if (val == null) return false;
        if (!String(val).toLowerCase().includes(String(f.value).toLowerCase())) return false;
      }
    }

    return true;
  });

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField) return 0;
    // helper to support nested fields (dot notation) and function fields
    const getValue = (obj, field) => {
      if (!field) return undefined;
      if (typeof field === 'function') return field(obj);
      if (field.indexOf('.') > -1) {
        return field.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
      }
      return obj[field];
    };

    const aValue = getValue(a, sortField);
    const bValue = getValue(b, sortField);
    
    if (sortDirection === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Paginate data
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = pagination ? sortedData.slice(startIndex, endIndex) : sortedData;
  const totalPages = Math.ceil(sortedData.length / pageSize);

  const handleSort = (field) => {
    if (!sortable) return;
    
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <IoChevronUp className="w-4 h-4" /> : 
      <IoChevronDown className="w-4 h-4" />;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            {searchable && (
              <div className="relative">
                <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
            {filterable && (
              <div className="relative">
                <button onClick={() => setShowFilterPanel(s => !s)} className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                  <IoFilter className="w-4 h-4" />
                  <span>Lọc</span>
                </button>
                {showFilterPanel && (
                  <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded shadow-lg p-3 z-10">
                    <div className="text-sm font-medium mb-2">Thêm bộ lọc</div>
                    <select className="w-full p-2 border rounded mb-2" value={pendingFilterField} onChange={e => setPendingFilterField(e.target.value)}>
                      <option value="">Chọn trường</option>
                      {columns.map((c, i) => (
                        <option key={i} value={i}>{c.header}</option>
                      ))}
                    </select>
                    <input className="w-full p-2 border rounded mb-2" placeholder="Giá trị lọc" value={pendingFilterValue} onChange={e => setPendingFilterValue(e.target.value)} />
                    <div className="flex justify-end space-x-2">
                      <button className="px-3 py-1 border rounded" onClick={() => { setShowFilterPanel(false); setPendingFilterField(''); setPendingFilterValue(''); }}>Hủy</button>
                      <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={() => {
                        if (!pendingFilterField) return;
                        const col = columns[Number(pendingFilterField)];
                        const key = `${col.header}-${pendingFilterField}`;
                        setFilters(prev => ({ ...prev, [key]: { field: col.field, value: pendingFilterValue } }));
                        setPendingFilterField(''); setPendingFilterValue(''); setShowFilterPanel(false);
                      }}>Áp dụng</button>
                    </div>
                    {Object.keys(filters).length > 0 && (
                      <div className="mt-3 text-sm">
                        <div className="font-medium mb-1">Bộ lọc hiện tại</div>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(filters).map(([k, v]) => (
                            <div key={k} className="px-2 py-1 bg-gray-100 rounded-full text-xs flex items-center space-x-2">
                              <span>{k}: {v.value}</span>
                              <button className="text-red-500" onClick={() => setFilters(prev => { const n = { ...prev }; delete n[k]; return n; })}>×</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <IoRefresh className="w-4 h-4" />
              <span>Làm mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                    sortable && column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''
                  }`}
                  onClick={() => column.sortable !== false && handleSort(column.field)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.header}</span>
                    {getSortIcon(column.field)}
                  </div>
                </th>
              ))}
              {(onEdit || onDelete || onView) && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-50">
                {columns.map((column, colIndex) => {
                  // resolve value (support function or nested path)
                  const resolveValue = (r, field) => {
                    if (!field) return undefined;
                    if (typeof field === 'function') return field(r);
                    if (typeof field === 'string' && field.indexOf('.') > -1) {
                      return field.split('.').reduce((o, k) => (o ? o[k] : undefined), r);
                    }
                    return r[field];
                  };
                  const value = resolveValue(row, column.field);
                  return (
                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {column.render ? column.render(value, row) : (value ?? '')}
                    </td>
                  );
                })}
                {(onEdit || onDelete || onView) && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {onView && (
                        <button
                          onClick={() => onView(row)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Xem
                        </button>
                      )}
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          className="text-green-600 hover:text-green-800"
                        >
                          Sửa
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row && (row.id || row.maSanPham || row.maSanPham) ? (row.id || row.maSanPham) : row)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Xóa
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Hiển thị {startIndex + 1} đến {Math.min(endIndex, sortedData.length)} trong {sortedData.length} kết quả
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Trước
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-1 border rounded-lg ${
                    currentPage === page
                      ? 'bg-primary text-white border-primary'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;



