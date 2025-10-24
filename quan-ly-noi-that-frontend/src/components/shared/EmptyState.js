import React from 'react';
import { IoAdd, IoSearch, IoRefresh, IoInformation } from 'react-icons/io5';

const EmptyState = ({
  icon: Icon = IoInformation,
  title = 'Không có dữ liệu',
  description = 'Chưa có dữ liệu nào để hiển thị',
  action,
  actionText = 'Thêm mới',
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center py-12 px-4 ${className}`}>
      <div className="text-gray-400 mb-4">
        <Icon className="w-16 h-16" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-center mb-6 max-w-md">{description}</p>
      {action && (
        <button
          onClick={action}
          className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
        >
          <IoAdd className="w-4 h-4" />
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
};

// Empty search results
export const EmptySearchResults = ({ searchTerm, onClearSearch }) => {
  return (
    <EmptyState
      icon={IoSearch}
      title="Không tìm thấy kết quả"
      description={`Không có kết quả nào cho "${searchTerm}". Thử tìm kiếm với từ khóa khác.`}
      action={onClearSearch}
      actionText="Xóa bộ lọc"
    />
  );
};

// Empty list
export const EmptyList = ({ itemName = 'mục', onAdd }) => {
  return (
    <EmptyState
      icon={IoAdd}
      title={`Chưa có ${itemName} nào`}
      description={`Bắt đầu bằng cách thêm ${itemName} đầu tiên.`}
      action={onAdd}
      actionText={`Thêm ${itemName}`}
    />
  );
};

// Loading error
export const LoadingError = ({ onRetry, error }) => {
  return (
    <EmptyState
      icon={IoRefresh}
      title="Có lỗi xảy ra"
      description={error || 'Không thể tải dữ liệu. Vui lòng thử lại.'}
      action={onRetry}
      actionText="Thử lại"
    />
  );
};

// No permissions
export const NoPermissions = () => {
  return (
    <EmptyState
      icon={IoInformation}
      title="Không có quyền truy cập"
      description="Bạn không có quyền để xem nội dung này. Vui lòng liên hệ quản trị viên."
    />
  );
};

export default EmptyState;



