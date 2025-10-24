import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { IoLogOut, IoMenu, IoClose } from 'react-icons/io5';
import StaffDashboard from './StaffDashboard';
import StaffNotificationPopup from './StaffNotificationPopup';
import WarehouseDashboard from '../shared/WarehouseDashboard';
import CustomerLookup from './customers/CustomerLookup';
import OrderManagement from './orders/OrderManagement';
import InventoryManagement from './inventory/InventoryManagement';
import LiveChat from '../shared/LiveChat';
// PromotionManagement replaced by DiscountManagement in menus
import InventoryAlerts from './inventory/InventoryAlerts';
import SupplierManagement from '../shared/SupplierManagement';
import ShippingTracking from './orders/ShippingTracking';

// Import home page components
import Header from '../shared/Header';
import Hero from '../shared/Hero';
import Stats from '../shared/Stats';
import Features from '../shared/Features';
import FeaturesSecond from '../shared/FeaturesSecond';
import NewItemsSlider from '../shared/NewItemsSlider';
import ProductSlider from '../shared/ProductSlider';
import TestimonialSlider from '../shared/TestimonialSlider';
import Newsletter from '../shared/Newsletter';

// Import CSS files
import '../../slider.css';
import '../../animations.css';

const StaffLayout = ({ userRole = 'staff', children }) => {
  const [currentView, setCurrentView] = useState('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // category dropdown removed — state variables not required
  // Persist which child is active and which groups are open
  const [activeItem, setActiveItem] = useState(() => {
    try {
      const v = localStorage.getItem('staff_activeItem');
      return v || 'home';
    } catch (e) {
      return 'home';
    }
  });
  const [openGroups, setOpenGroups] = useState(() => {
    try {
      const v = localStorage.getItem('staff_openGroups');
      return v ? JSON.parse(v) : {};
    } catch (e) {
      return {};
    }
  });

  // Organized by category
  const staffCategories = {
    'Khách hàng': [
      { id: 'customers', name: '🔍 Tra cứu khách hàng', component: CustomerLookup },
    ],
    'Đơn hàng': [
      { id: 'orders', name: '📋 Đơn hàng', component: OrderManagement },
    ],
    'Kho': [
      { id: 'inventory', name: '📦 Tồn kho', component: InventoryManagement },
      { id: 'alerts', name: '⚠️ Cảnh báo', component: InventoryAlerts }
    ],
    'Hỗ trợ': [
      { id: 'livechat', name: '💬 Live Chat', component: LiveChat }
    ]
  };

  const warehouseCategories = {
    'Kho hàng': [
      { id: 'inventory', name: '📊 Tồn kho', component: InventoryManagement },
      { id: 'alerts', name: '⚠️ Cảnh báo', component: InventoryAlerts },
    // products management is admin-only
    ],
    'Vận chuyển': [
      { id: 'orders', name: '📋 Đơn hàng', component: OrderManagement },
      { id: 'shipping', name: '🚚 Vận chuyển', component: ShippingTracking },
      { id: 'suppliers', name: '🏢 Nhà cung cấp', component: SupplierManagement }
    ]
  };

  const systemViews = [
    { id: 'home', name: '🏠 Trang chủ', component: null }
  ];

  const categories = userRole === 'warehouse' ? warehouseCategories : staffCategories;

  // Combine all views for mobile menu
  const allViews = [
    ...systemViews,
    ...Object.values(categories).flat()
  ];

  // (category dropdown removed)

  // Keep currentView in sync with activeItem when activeItem changes
  useEffect(() => {
    if (activeItem) setCurrentView(activeItem);
  }, [activeItem]);

  const persistOpenGroups = (next) => {
    try {
      localStorage.setItem('staff_openGroups', JSON.stringify(next));
    } catch (e) {
      // ignore
    }
  };

  const persistActiveItem = (id) => {
    try {
      localStorage.setItem('staff_activeItem', id);
    } catch (e) {
      // ignore
    }
  };

  // group toggling handled via selectView / openGroups persisted when selecting views

  const selectView = (id, category) => {
    setActiveItem(id);
    persistActiveItem(id);
    setCurrentView(id);
    // ensure parent group is open
    if (category) {
      const next = { ...openGroups, [category]: true };
      setOpenGroups(next);
      persistOpenGroups(next);
    }
    // close mobile menu if open
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  const navigate = useNavigate();

  // map known view ids to routes under /staff
  const idToRoute = (id) => {
    const map = {
      customers: '/staff/customers',
      orders: '/staff/sales',
      products: '/staff',
      vip: '/staff',
      sales: '/staff/sales',
      promotions: '/staff',
      reports: '/staff',
      support: '/staff/support',
      livechat: '/staff/livechat',
      inventory: '/staff/inventory',
      alerts: '/staff/inventory/alerts',
      shipping: '/staff/orders',
      suppliers: '/staff/suppliers'
    };
    return map[id] || '/staff';
  };

  const navTo = (id, category) => {
    const path = idToRoute(id);
    selectView(id, category);
    try { navigate(path); } catch (e) { /* ignore during SSR/test */ }
  };

  const renderCurrentView = () => {
    // If a routed child component was passed as prop (e.g. <StaffLayout><InventoryManagement/></StaffLayout>), render it.
    if (children) return children;
    // If this component is used as a parent route (nested routes) render the Outlet so nested elements display.
    // React Router will render matching child routes (e.g. /staff/dashboard) inside the Outlet.
    // We only render the Outlet when there are no explicit `children` props provided.
    if (!children) return <Outlet />;

    // Handle home page
    if (currentView === 'home') {
      return (
        <div className='max-w-[1440px] mx-auto bg-white'>
          <Header />
          <Hero />
          <Stats />
          <Features />
          <FeaturesSecond />
          <NewItemsSlider />
          <ProductSlider />
          <TestimonialSlider />
          <Newsletter />
        </div>
      );
    }

    // Check system views first
    const systemView = systemViews.find(view => view.id === currentView);
    if (systemView && systemView.component) {
      const Component = systemView.component;
      return <Component />;
    }

    // Check category views
    for (const category in categories) {
      const categoryView = categories[category].find(view => view.id === currentView);
      if (categoryView) {
        const Component = categoryView.component;
        return <Component />;
      }
    }
    
    return <StaffDashboard />;
  };

  const handleLogout = () => {
    // Simulate logout
    alert('Đăng xuất thành công!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-primary">
                  FurniShop {userRole === 'warehouse' ? 'Kho hàng' : 'Nhân viên'}
                </h1>
              </div>
            </div>

            {/* Compact title instead of system navigation */}
            <div className="flex-1 flex items-center justify-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">{(function(){
                  const sv = systemViews.find(v=>v.id===currentView);
                  if(sv) return sv.name;
                  for(const g in categories){
                    const found = categories[g].find(x=>x.id===currentView);
                    if(found) return found.name;
                  }
                  return 'Trang nhân viên';
                })()}</h2>
                <p className="text-sm text-gray-500">Quản lý nhanh các công việc nội bộ</p>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              {/* Notifications - Using StaffNotificationPopup */}
              <StaffNotificationPopup user={{ maNhanVien: 1 }} />

              {/* User Menu */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {userRole === 'warehouse' ? 'Nhân viên kho' : 'Nhân viên bán hàng'}
                  </p>
                  <p className="text-xs text-gray-500">user@furnishop.com</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Đăng xuất"
                >
                  <IoLogOut className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900"
              >
                {isMobileMenuOpen ? <IoClose className="w-6 h-6" /> : <IoMenu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-2 space-y-1">
              {allViews.map((view) => (
                <button
                  key={view.id}
                  onClick={() => selectView(view.id)}
                  className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg transition-colors ${
                    activeItem === view.id
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  {view.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          {/* Left Sidebar for desktop */}
          <aside className="hidden md:block md:col-span-1">
            <div className="sticky top-20 bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              <div className="text-sm font-semibold text-gray-700">Menu</div>
              
              {/* System Views (Home, Dashboard) */}
              <div className="space-y-1">
                {systemViews.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navTo(item.id, null)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      activeItem === item.id ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>

              {/* Category Groups */}
              {Object.keys(categories).map((group) => (
                <div key={group} className="">
                  <div className="text-xs font-medium text-gray-500 mt-2 mb-1">{group}</div>
                  <div className="space-y-1">
                    {categories[group].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => navTo(item.id, group)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          activeItem === item.id ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* Main Content */}
          <main className="md:col-span-5">
            {renderCurrentView()}
          </main>
        </div>
      </div>

      {/* Footer removed for staff interface per request */}
    </div>
  );
};

export default StaffLayout;



