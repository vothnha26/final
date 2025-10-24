import React, { useState, useEffect } from 'react';
import { IoCheckmarkCircle, IoWarning, IoInformation, IoClose } from 'react-icons/io5';

const Toast = ({
  isVisible,
  onClose,
  type = 'success',
  title,
  message,
  duration = 5000
}) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <IoCheckmarkCircle className="w-5 h-5 text-green-600" />;
      case 'warning':
        return <IoWarning className="w-5 h-5 text-yellow-600" />;
      case 'error':
        return <IoWarning className="w-5 h-5 text-red-600" />;
      case 'info':
      default:
        return <IoInformation className="w-5 h-5 text-blue-600" />;
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'border-l-green-500';
      case 'warning':
        return 'border-l-yellow-500';
      case 'error':
        return 'border-l-red-500';
      case 'info':
      default:
        return 'border-l-blue-500';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`bg-white rounded-lg shadow-lg border-l-4 ${getBorderColor()} p-4 max-w-sm`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getIcon()}
          </div>
          <div className="ml-3 flex-1">
            {title && (
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                {title}
              </h4>
            )}
            <p className="text-sm text-gray-500">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <IoClose className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Toast Container Component
export const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          isVisible={toast.isVisible}
          onClose={() => onRemove(toast.id)}
          type={toast.type}
          title={toast.title}
          message={toast.message}
          duration={toast.duration}
        />
      ))}
    </div>
  );
};

// Hook for managing toasts
export const useToast = () => {
  // keep local hook behaviour but delegate to global API
  const [toastsState, setToastsState] = useState(ToastInternal.getToasts());

  useEffect(() => {
    const handle = () => setToastsState(ToastInternal.getToasts());
    ToastInternal.subscribe(handle);
    return () => ToastInternal.unsubscribe(handle);
  }, []);

  return {
    toasts: toastsState,
    addToast: ToastInternal.addToast,
    removeToast: ToastInternal.removeToast,
    showSuccess: (message, title = 'Thành công') => ToastInternal.show(message, 'success', title),
    showError: (message, title = 'Lỗi') => ToastInternal.show(message, 'error', title),
    showWarning: (message, title = 'Cảnh báo') => ToastInternal.show(message, 'warning', title),
    showInfo: (message, title = 'Thông tin') => ToastInternal.show(message, 'info', title)
  };
};
// Simple internal toast manager used by the ToastContainer and exported API
const ToastInternal = (function () {
  let toasts = [];
  const listeners = new Set();

  function notify() {
    listeners.forEach(fn => fn());
  }

  function getToasts() {
    return [...toasts];
  }

  function addToast(toast) {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const t = { ...toast, id, isVisible: true };
    toasts = [...toasts, t];
    notify();
    return id;
  }

  function removeToast(id) {
    toasts = toasts.filter(t => t.id !== id);
    notify();
  }

  function show(message, type = 'info', title) {
    const toast = { type, title, message, duration: 5000 };
    addToast(toast);
  }

  function subscribe(fn) { listeners.add(fn); }
  function unsubscribe(fn) { listeners.delete(fn); }

  return { getToasts, addToast, removeToast, show, subscribe, unsubscribe };
})();

// Attach API methods to the Toast component so it can be used both as a
// rendered component (<Toast ... />) and as a legacy API (Toast.show(...)).
Toast.show = ToastInternal.show;
Toast.showSuccess = (message, title = 'Thành công') => ToastInternal.show(message, 'success', title);
Toast.showError = (message, title = 'Lỗi') => ToastInternal.show(message, 'error', title);
Toast.showWarning = (message, title = 'Cảnh báo') => ToastInternal.show(message, 'warning', title);
Toast.showInfo = (message, title = 'Thông tin') => ToastInternal.show(message, 'info', title);
Toast.addToast = ToastInternal.addToast;
Toast.removeToast = ToastInternal.removeToast;
Toast.useToast = useToast;

export { ToastInternal };
export default Toast;



