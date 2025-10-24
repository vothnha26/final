import React, { useState, useEffect } from 'react';
import { IoSearch, IoClose, IoFilter } from 'react-icons/io5';

const Search = ({
  placeholder = 'Tìm kiếm...',
  onSearch,
  onClear,
  showFilters = false,
  filters = [],
  onFilterChange,
  className = '',
  debounceMs = 300
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearch) {
        onSearch(searchTerm, activeFilters);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, activeFilters, onSearch, debounceMs]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleClear = () => {
    setSearchTerm('');
    setActiveFilters({});
    if (onClear) onClear();
  };

  const handleFilterChange = (filterKey, value) => {
    const newFilters = { ...activeFilters, [filterKey]: value };
    setActiveFilters(newFilters);
    if (onFilterChange) onFilterChange(newFilters);
  };

  const removeFilter = (filterKey) => {
    const newFilters = { ...activeFilters };
    delete newFilters[filterKey];
    setActiveFilters(newFilters);
    if (onFilterChange) onFilterChange(newFilters);
  };

  const getActiveFilterCount = () => {
    return Object.values(activeFilters).filter(value => value !== '' && value !== null).length;
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center space-x-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={placeholder}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {searchTerm && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <IoClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Button */}
        {showFilters && filters.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className={`flex items-center space-x-2 px-3 py-2 border rounded-lg transition-colors ${
                getActiveFilterCount() > 0
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <IoFilter className="w-4 h-4" />
              <span>Lọc</span>
              {getActiveFilterCount() > 0 && (
                <span className="bg-primary text-white text-xs rounded-full px-2 py-1">
                  {getActiveFilterCount()}
                </span>
              )}
            </button>

            {/* Filter Dropdown */}
            {showFilterDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 space-y-4">
                  {filters.map((filter) => (
                    <div key={filter.key}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {filter.label}
                      </label>
                      {filter.type === 'select' ? (
                        <select
                          value={activeFilters[filter.key] || ''}
                          onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        >
                          <option value="">Tất cả</option>
                          {filter.options.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : filter.type === 'date' ? (
                        <input
                          type="date"
                          value={activeFilters[filter.key] || ''}
                          onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      ) : (
                        <input
                          type="text"
                          value={activeFilters[filter.key] || ''}
                          onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                          placeholder={filter.placeholder}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setActiveFilters({});
                      if (onFilterChange) onFilterChange({});
                    }}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Xóa tất cả
                  </button>
                  <button
                    onClick={() => setShowFilterDropdown(false)}
                    className="px-3 py-1 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm"
                  >
                    Áp dụng
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active Filters Display */}
      {getActiveFilterCount() > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(activeFilters).map(([key, value]) => {
            if (!value || value === '') return null;
            const filter = filters.find(f => f.key === key);
            const displayValue = filter?.options?.find(opt => opt.value === value)?.label || value;
            
            return (
              <span
                key={key}
                className="inline-flex items-center space-x-1 px-2 py-1 bg-primary/10 text-primary text-sm rounded-full"
              >
                <span>{filter?.label}: {displayValue}</span>
                <button
                  onClick={() => removeFilter(key)}
                  className="text-primary hover:text-primary/80"
                >
                  <IoClose className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Search;



