import React, { useState, useEffect } from 'react';
import { useOutlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { IoCart, IoPerson, IoSearch, IoHeart, IoNotifications, IoStorefront, IoReceipt } from 'react-icons/io5';
import Header from '../shared/Header';
import CustomerShop from './CustomerShop';
import CustomerCart from './CustomerCart';
import CustomerOrders from './CustomerOrders';
import CustomerOrderTracking from './CustomerOrderTracking';
import CustomerProfile from './CustomerProfile';
import CustomerFavorites from './CustomerFavorites';
import CustomerNotifications from './CustomerNotifications';
import CustomerChat from './CustomerChat';

const CustomerLayout = ({ children }) => {
  const [currentView, setCurrentView] = useState('shop');
  useAuth();

  const views = [
    { id: 'shop', name: 'Cửa hàng', icon: IoStorefront, component: CustomerShop },
    { id: 'cart', name: 'Giỏ hàng', icon: IoCart, component: CustomerCart },
    { id: 'orders', name: 'Đơn hàng', icon: IoReceipt, component: CustomerOrders },
    { id: 'tracking', name: 'Tra cứu đơn hàng', icon: IoSearch, component: CustomerOrderTracking },
    { id: 'favorites', name: 'Yêu thích', icon: IoHeart, component: CustomerFavorites },
    { id: 'notifications', name: 'Thông báo', icon: IoNotifications, component: CustomerNotifications },
    { id: 'profile', name: 'Tài khoản', icon: IoPerson, component: CustomerProfile }
  ];

  // If this layout is used as a parent route, `useOutlet()` returns the nested element.
  const outlet = useOutlet();

  const location = useLocation();

  // If URL contains ?view=favorites allow external navigation to switch tabs
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search);
      const view = params.get('view');
      if (view) setCurrentView(view);
    } catch (e) { /* ignore */ }
  }, [location.search]);

  const renderCurrentView = () => {
    // If a nested route element is present, render it instead of the internal tab view
    if (outlet) return outlet;
    // If a direct child was passed (e.g. <CustomerLayout><CustomerCheckout/></CustomerLayout>), render it
    if (children) return children;
    const view = views.find(v => v.id === currentView);
    if (view) {
      const Component = view.component;
      return <Component />;
    }
    return <CustomerShop />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Shared Header for shop pages */}
      <Header />

      {/* Main Content (add top padding to avoid being covered by fixed header height h-20) */}
      <main className="pt-20">
        {renderCurrentView()}
      </main>

      {/* Customer Chat Widget */}
      <CustomerChat />

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">FurniShop</h3>
              <p className="text-gray-400 text-sm">
                Cửa hàng nội thất cao cấp với chất lượng tốt nhất và dịch vụ tận tâm.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Sản phẩm</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Ghế</li>
                <li>Bàn</li>
                <li>Giường</li>
                <li>Tủ</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Hỗ trợ</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Liên hệ</li>
                <li>Hướng dẫn mua hàng</li>
                <li>Chính sách đổi trả</li>
                <li>Bảo hành</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Liên hệ</h4>
              <div className="space-y-2 text-sm text-gray-400">
                <p>📞 1900 1234</p>
                <p>✉️ info@furnishop.com</p>
                <p>📍 123 Đường ABC, TP.HCM</p>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 FurniShop. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CustomerLayout;

