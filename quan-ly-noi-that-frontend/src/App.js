import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, NavLink, useLocation } from 'react-router-dom';

// Import admin components
import AccountManagement from './components/admin/system/AccountManagement';
import AttributeManagement from './components/admin/products/AttributeManagement';
import AttributeValueManagement from './components/admin/products/AttributeValueManagement';
import CategoryManagement from './components/admin/products/CategoryManagement';
import CollectionManagement from './components/admin/products/CollectionManagement';
import CustomerManagement from './components/admin/customers/CustomerManagement';
// import Dashboard from './components/admin/system/Dashboard';
import { AdminDashboard } from './components/admin';
import DiscountManagement from './components/admin/products/DiscountManagement';
import Notifications from './components/admin/system/Notifications';
import EmailCampaign from './components/admin/system/EmailCampaign';
import ProductManagement from './components/admin/products/ProductManagement';
import ProductVariantManagement from './components/admin/products/ProductVariantManagement';
import ImageManagement from './components/admin/products/ImageManagement';
// PromotionManagement replaced by DiscountManagement (canonical UI)
import ReportsAnalytics from './components/admin/system/ReportsAnalytics';
import Settings from './components/admin/system/Settings';
import VoucherManagement from './components/admin/products/VoucherManagement';
import AdminNotificationPopup from './components/admin/system/AdminNotificationPopup';

// Import customer components (folder is `customers`)
import CustomerFavorites from './components/customers/CustomerFavorites';
import CustomerNotifications from './components/customers/CustomerNotifications';
import CustomerOrders from './components/customers/CustomerOrders';
import CustomerOrderTracking from './components/customers/CustomerOrderTracking';
import CustomerProfile from './components/customers/CustomerProfile';
import CustomerBenefits from './components/customers/CustomerBenefits';
import CustomerLayout from './components/customers/CustomerLayout';
import CustomerCart from './components/customers/CustomerCart';
import CustomerCheckout from './components/customers/CustomerCheckout';
import CustomerProductDetail from './components/customers/CustomerProductDetail';
import CustomerShop from './components/customers/CustomerShop';
import CustomerShopPage from './components/customers/CustomerShopPage';
import CustomerCollections from './components/customers/CustomerCollections';
import CustomerCollectionDetail from './components/customers/CustomerCollectionDetail';

// Import staff components
import InventoryAlerts from './components/staff/inventory/InventoryAlerts';
import InventoryManagement from './components/staff/inventory/InventoryManagement';
import OrderManagement from './components/staff/orders/OrderManagement';
import SalesManagement from './components/staff/orders/SalesManagement';
import StaffLayoutBase from './components/staff/StaffLayout';
import StaffDashboard from './components/staff/StaffDashboard';
import CustomerSupport from './components/staff/support/CustomerSupport';
import LiveChat from './components/shared/LiveChat';
import ProtectedRoute from './components/shared/ProtectedRoute';
import CustomerLookup from './components/staff/customers/CustomerLookup';
import InvoiceManagement from './components/staff/orders/InvoiceManagement';
import OrderDetailManagement from './components/staff/orders/OrderDetailManagement';
import OrderDetail from './components/staff/orders/OrderDetail';
import PaymentTransactionManagement from './components/staff/orders/PaymentTransactionManagement';
import StaffNotifications from './components/staff/notifications/StaffNotifications';

// Import shared components
import Login from './components/shared/Login';
import Register from './components/shared/Register';
import OtpVerification from './components/shared/OtpVerification';
import ForgotPassword from './components/shared/ForgotPassword';
import PendingTasks from './components/shared/PendingTasks';
import Header from './components/shared/Header';
import Hero from './components/shared/Hero';
import Stats from './components/shared/Stats';
import Features from './components/shared/Features';
import FeaturesSecond from './components/shared/FeaturesSecond';
import NewItemsSlider from './components/shared/NewItemsSlider';
import ProductSlider from './components/shared/ProductSlider';
import TestimonialSlider from './components/shared/TestimonialSlider';
import Newsletter from './components/shared/Newsletter';
import Footer from './components/shared/Footer';

import MembershipTierManagement from './components/admin/products/MembershipTierManagement';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Toast, { ToastContainer } from './components/shared/Toast';

// Import styles
import './slider.css';
import './animations.css';

// Admin Layout Component (base)
const AdminLayoutBase = ({ children }) => {
  const auth = useAuth();
  const user = auth?.user || {};
  const location = useLocation();

  // persistable open groups so sidebar stays in the same state
  const [openGroups, setOpenGroups] = React.useState(() => {
    try {
      const raw = localStorage.getItem('admin_openGroups');
      return raw ? JSON.parse(raw) : { products: true, content: false, customers: false, system: false };
    } catch (e) {
      return { products: true, content: false, customers: false, system: false };
    }
  });

  const persistOpenGroups = (next) => {
    try { localStorage.setItem('admin_openGroups', JSON.stringify(next)); } catch (e) { }
  };

  const toggleGroup = (key) => {
    const next = { ...openGroups, [key]: !openGroups[key] };
    setOpenGroups(next);
    persistOpenGroups(next);
  };

  // auto-open the group containing the current route so the active link is visible
  useEffect(() => {
    const path = location.pathname || '';
    const next = { ...openGroups };
    if (path.startsWith('/admin/products')) next.products = true;
    if (path.startsWith('/admin/discounts') || path.startsWith('/admin/vouchers') || path.startsWith('/admin/promotions')) next.content = true;
    if (path.startsWith('/admin/customers')) next.customers = true;
    if (path.startsWith('/admin/notifications') || path.startsWith('/admin/accounts') || path.startsWith('/admin/settings') || path.startsWith('/admin/reports')) next.system = true;
    setOpenGroups(next);
    persistOpenGroups(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

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
                  <a href="/admin" className="text-orange-600">FurniShop Admin</a>
                </h1>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <AdminNotificationPopup user={user} />

              {/* User Menu */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">Quản trị viên</p>
                  <p className="text-xs text-gray-500">{user?.email ?? 'admin@furnishop.com'}</p>
                </div>
                <a href="/admin/accounts" className="text-sm text-orange-600 hover:text-orange-700">Tài khoản</a>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
          {/* Left Sidebar for desktop */}
          <aside className="hidden md:block md:col-span-1">
            <div className="sticky top-20 bg-white border border-gray-200 rounded-lg p-4 space-y-4">
              <div className="text-sm font-semibold text-gray-700">Menu</div>

              {/* Products group */}
              <div className="rounded-lg overflow-hidden">
                <button onClick={() => toggleGroup('products')} className={`w-full flex items-center justify-between px-2 py-2 bg-white hover:bg-gray-50 transition-colors ${openGroups.products ? 'border-l-4 border-orange-500' : ''}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-orange-50 text-orange-600 rounded flex items-center justify-center text-sm">📦</div>
                    <div className="text-sm font-medium text-gray-800">Sản phẩm</div>
                  </div>
                  <div className={`text-gray-400 transform transition-transform text-xs ${openGroups.products ? 'rotate-180' : ''}`}>▾</div>
                </button>
                <div className={`${openGroups.products ? 'block' : 'hidden'} bg-white`}>
                  <div className="pl-8 pr-2 py-1 space-y-0.5">
                    <NavLink to="/admin/products" className={({ isActive }) => `block text-xs rounded px-2 py-1.5 ${isActive ? 'text-orange-600 bg-gray-50' : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50'}`} end>Danh sách sản phẩm</NavLink>
                    <NavLink to="/admin/products/variants" className={({ isActive }) => `block text-xs rounded px-2 py-1.5 ${isActive ? 'text-orange-600 bg-gray-50' : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50'}`}>Biến thể</NavLink>
                    <NavLink to="/admin/attributes" className={({ isActive }) => `block text-xs rounded px-2 py-1.5 ${isActive ? 'text-orange-600 bg-gray-50' : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50'}`}>Thuộc tính</NavLink>
                    <NavLink to="/admin/categories" className={({ isActive }) => `block text-xs rounded px-2 py-1.5 ${isActive ? 'text-orange-600 bg-gray-50' : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50'}`}>Danh mục</NavLink>
                    <NavLink to="/admin/collections" className={({ isActive }) => `block text-xs rounded px-2 py-1.5 ${isActive ? 'text-orange-600 bg-gray-50' : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50'}`}>Collections</NavLink>
                    <NavLink to="/admin/inventory" className={({ isActive }) => `block text-xs rounded px-2 py-1.5 ${isActive ? 'text-orange-600 bg-gray-50' : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50'}`}>Kho</NavLink>
                  </div>
                </div>
              </div>

              {/* Content group */}
              <div className="rounded-lg overflow-hidden">
                <button onClick={() => toggleGroup('content')} className={`w-full flex items-center justify-between px-2 py-2 bg-white hover:bg-gray-50 transition-colors ${openGroups.content ? 'border-l-4 border-orange-500' : ''}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center text-sm">🧾</div>
                    <div className="text-sm font-medium text-gray-800">Nội dung</div>
                  </div>
                  <div className={`text-gray-400 transform transition-transform text-xs ${openGroups.content ? 'rotate-180' : ''}`}>▾</div>
                </button>
                <div className={`${openGroups.content ? 'block' : 'hidden'} bg-white`}>
                  <div className="pl-8 pr-2 py-1 space-y-0.5">
                    <NavLink to="/admin/discounts" className={({ isActive }) => `block text-xs rounded px-2 py-1.5 ${isActive ? 'text-orange-600 bg-gray-50' : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50'}`}>Khuyến mãi</NavLink>
                    <NavLink to="/admin/vouchers" className={({ isActive }) => `block text-xs rounded px-2 py-1.5 ${isActive ? 'text-orange-600 bg-gray-50' : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50'}`}>Voucher</NavLink>
                  </div>
                </div>
              </div>

              {/* Customers group */}
              <div className="rounded-lg overflow-hidden">
                <button onClick={() => toggleGroup('customers')} className={`w-full flex items-center justify-between px-2 py-2 bg-white hover:bg-gray-50 transition-colors ${openGroups.customers ? 'border-l-4 border-orange-500' : ''}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-50 text-purple-600 rounded flex items-center justify-center text-sm">👥</div>
                    <div className="text-sm font-medium text-gray-800">Khách hàng</div>
                  </div>
                  <div className={`text-gray-400 transform transition-transform text-xs ${openGroups.customers ? 'rotate-180' : ''}`}>▾</div>
                </button>
                <div className={`${openGroups.customers ? 'block' : 'hidden'} bg-white`}>
                  <div className="pl-8 pr-2 py-1 space-y-0.5">
                    <NavLink to="/admin/customers" className={({ isActive }) => `block text-xs rounded px-2 py-1.5 ${isActive ? 'text-orange-600 bg-gray-50' : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50'}`}>Danh sách khách</NavLink>
                    {/* VIP used to point to /admin/customers/vip - now route to membership tiers (membership management) */}
                    <NavLink to="/admin/membership/tiers" className={({ isActive }) => `block text-xs rounded px-2 py-1.5 ${isActive ? 'text-orange-600 bg-gray-50' : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50'}`}>VIP</NavLink>
                  </div>
                </div>
              </div>

              {/* System group */}
              <div className="rounded-lg overflow-hidden">
                <button onClick={() => toggleGroup('system')} className={`w-full flex items-center justify-between px-2 py-2 bg-white hover:bg-gray-50 transition-colors ${openGroups.system ? 'border-l-4 border-orange-500' : ''}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-50 text-gray-600 rounded flex items-center justify-center text-sm">⚙️</div>
                    <div className="text-sm font-medium text-gray-800">Hệ thống</div>
                  </div>
                  <div className={`text-gray-400 transform transition-transform text-xs ${openGroups.system ? 'rotate-180' : ''}`}>▾</div>
                </button>
                <div className={`${openGroups.system ? 'block' : 'hidden'} bg-white`}>
                  <div className="pl-8 pr-2 py-1 space-y-0.5">
                    <NavLink to="/admin/notifications" className={({ isActive }) => `block text-xs rounded px-2 py-1.5 ${isActive ? 'text-orange-600 bg-gray-50' : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50'}`}>Thông báo</NavLink>
                    <NavLink to="/admin/emails" className={({ isActive }) => `block text-xs rounded px-2 py-1.5 ${isActive ? 'text-orange-600 bg-gray-50' : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50'}`}>Gửi email</NavLink>
                    <NavLink to="/admin/accounts" className={({ isActive }) => `block text-xs rounded px-2 py-1.5 ${isActive ? 'text-orange-600 bg-gray-50' : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50'}`}>Tài khoản</NavLink>
                    <NavLink to="/admin/settings" className={({ isActive }) => `block text-xs rounded px-2 py-1.5 ${isActive ? 'text-orange-600 bg-gray-50' : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50'}`}>Cài đặt</NavLink>
                    <NavLink to="/admin/reports" className={({ isActive }) => `block text-xs rounded px-2 py-1.5 ${isActive ? 'text-orange-600 bg-gray-50' : 'text-gray-600 hover:text-orange-600 hover:bg-gray-50'}`}>Báo cáo</NavLink>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="md:col-span-5">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

// Protected Admin Layout - only ADMIN and MANAGER can access admin routes
const AdminLayout = ({ children }) => {
  const auth = useAuth();
  const isAuthenticated = !!auth?.isAuthenticated;
  const rawRole = (auth?.user?.vaiTro || auth?.user?.role || auth?.user?.roleName || '') || '';
  const role = rawRole.toString().toUpperCase().replace(/^ROLE_/, '').trim();

  // Defensive redirect: if an authenticated USER (customer) tries to access admin, send to shop
  if (isAuthenticated && role === 'USER') {
    return <Navigate to="/shop" replace />;
  }

  return (
    <ProtectedRoute requiredRole={["ADMIN", "MANAGER"]}>
      {/* Render Outlet (children routes) inside AdminLayoutBase so the sidebar stays mounted */}
      <AdminLayoutBase>{children ?? <Outlet />}</AdminLayoutBase>
    </ProtectedRoute>
  );
};

// Protected Staff Layout - STAFF, MANAGER, and ADMIN can access staff routes
const StaffLayout = ({ children }) => {
  const auth = useAuth();
  const isAuthenticated = !!auth?.isAuthenticated;
  const rawRole = (auth?.user?.vaiTro || auth?.user?.role || auth?.user?.roleName || '') || '';
  const role = rawRole.toString().toUpperCase().replace(/^ROLE_/, '').trim();

  if (isAuthenticated && role === 'USER') {
    return <Navigate to="/shop" replace />;
  }

  return (
    <ProtectedRoute requiredRole={["STAFF", "MANAGER", "ADMIN"]}>
      <StaffLayoutBase>{children}</StaffLayoutBase>
    </ProtectedRoute>
  );
};

// Home Page Component
const HomePage = () => {
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
      <Footer />
    </div>
  );
};

// DashboardRouter: redirect user based on role
const DashboardRouter = () => {
  const auth = useAuth();
  const isAuthenticated = !!auth?.isAuthenticated;
  const rawRole = (auth?.user?.vaiTro || auth?.user?.role || auth?.user?.roleName || '') || '';
  const role = rawRole.toString().toUpperCase().replace(/^ROLE_/, '').trim();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (role === 'USER') return <Navigate to="/shop" replace />;
  if (role === 'STAFF') return <Navigate to="/staff/dashboard" replace />;
  if (role === 'MANAGER' || role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;

  // Fallback to home
  return <Navigate to="/" replace />;
};

const App = () => {
  const { toasts, removeToast } = Toast.useToast();
  
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <ToastContainer toasts={toasts} onRemove={removeToast} />
          <Routes>
            {/* ============================================
            PUBLIC ROUTES - Không cần đăng nhập
        ============================================ */}

            {/* Home & Landing Pages */}
            <Route path="/" element={<HomePage />} />
            <Route path="/home" element={<Navigate to="/" replace />} />

            {/* Authentication */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<OtpVerification />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Public Shop Pages (nested under CustomerLayout) */}
            <Route path="/shop" element={<CustomerLayout />}>
              <Route index element={<CustomerShop />} />
              <Route path="products" element={<CustomerShopPage />} />
              <Route path="products/:id" element={<CustomerProductDetail />} />
              <Route path="collections" element={<CustomerCollections />} />
              <Route path="collections/:id" element={<CustomerCollectionDetail />} />
            </Route>
            <Route path="/products" element={<Navigate to="/shop/products" replace />} />
            <Route path="/products/:id" element={<Navigate to="/shop/products/:id" replace />} />


            {/* ============================================
            CUSTOMER ROUTES - Yêu cầu đăng nhập
        ============================================ */}

            {/* Shopping Cart & Checkout - require authentication */}
            <Route path="/cart" element={<ProtectedRoute><CustomerLayout><CustomerCart /></CustomerLayout></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><CustomerLayout><CustomerCheckout /></CustomerLayout></ProtectedRoute>} />
            <Route path="/checkout/success" element={<ProtectedRoute><CustomerLayout><CustomerCheckout /></CustomerLayout></ProtectedRoute>} />
            <Route path="/checkout/cancel" element={<ProtectedRoute><CustomerLayout><CustomerCheckout /></CustomerLayout></ProtectedRoute>} />

            {/* Customer Profile & Account */}
            <Route path="/profile" element={<ProtectedRoute><CustomerLayout><CustomerProfile /></CustomerLayout></ProtectedRoute>} />
            <Route path="/account" element={<Navigate to="/profile" replace />} />
            <Route path="/profile/edit" element={<ProtectedRoute><CustomerLayout><CustomerProfile /></CustomerLayout></ProtectedRoute>} />
            <Route path="/profile/password" element={<ProtectedRoute><CustomerLayout><CustomerProfile /></CustomerLayout></ProtectedRoute>} />
            <Route path="/profile/addresses" element={<ProtectedRoute><CustomerLayout><CustomerProfile /></CustomerLayout></ProtectedRoute>} />
            <Route path="/profile/benefits" element={<ProtectedRoute><CustomerLayout><CustomerBenefits /></CustomerLayout></ProtectedRoute>} />

            {/* Additional customer pages */}
            <Route path="/vouchers" element={<ProtectedRoute><CustomerLayout><CustomerProfile /></CustomerLayout></ProtectedRoute>} />
            <Route path="/benefits" element={<Navigate to="/profile/benefits" replace />} />
            <Route path="/promotions" element={<Navigate to="/profile/benefits" replace />} />
            <Route path="/points" element={<Navigate to="/profile/benefits" replace />} />

            {/* Customer Orders */}
            <Route path="/orders" element={<ProtectedRoute><CustomerLayout><CustomerOrders /></CustomerLayout></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute><CustomerLayout><CustomerOrderTracking /></CustomerLayout></ProtectedRoute>} />
            <Route path="/orders/track/:id" element={<ProtectedRoute><CustomerLayout><CustomerOrderTracking /></CustomerLayout></ProtectedRoute>} />
            <Route path="/order-history" element={<Navigate to="/orders" replace />} />

            {/* Customer Favorites & Wishlist - require authentication */}
            <Route path="/favorites" element={<ProtectedRoute><CustomerLayout><CustomerFavorites /></CustomerLayout></ProtectedRoute>} />
            <Route path="/wishlist" element={<Navigate to="/favorites" replace />} />

            {/* Customer Notifications */}
            <Route path="/notifications" element={<ProtectedRoute><CustomerLayout><CustomerNotifications /></CustomerLayout></ProtectedRoute>} />


            {/* ============================================
            ADMIN ROUTES - Quản trị viên (nested so AdminLayout stays mounted)
        ============================================ */}

            <Route path="/admin/*" element={<AdminLayout />}>
              {/* default admin root -> dashboard */}
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />

              {/* Product Management */}
              <Route path="products" element={<ProductManagement />} />
              <Route path="products/add" element={<ProductManagement />} />
              <Route path="products/:id" element={<ProductManagement />} />
              <Route path="products/:id/edit" element={<ProductManagement />} />
              <Route path="products/:id/images" element={<ImageManagement />} />
              <Route path="products/:id/variants" element={<ProductVariantManagement />} />
              <Route path="products/variants" element={<ProductVariantManagement />} />
              <Route path="products/variants/add" element={<ProductVariantManagement />} />
              <Route path="products/variants/:id" element={<ProductVariantManagement />} />

              {/* Category & Collection */}
              <Route path="categories" element={<CategoryManagement />} />
              <Route path="categories/add" element={<CategoryManagement />} />
              <Route path="categories/:id" element={<CategoryManagement />} />
              <Route path="categories/:id/edit" element={<CategoryManagement />} />
              <Route path="collections" element={<CollectionManagement />} />
              <Route path="collections/add" element={<CollectionManagement />} />
              <Route path="collections/:id" element={<CollectionManagement />} />
              <Route path="collections/:id/edit" element={<CollectionManagement />} />

              {/* Attributes */}
              <Route path="attributes" element={<AttributeManagement />} />
              <Route path="attributes/add" element={<AttributeManagement />} />
              <Route path="attributes/:id" element={<AttributeManagement />} />
              <Route path="attributes/:id/edit" element={<AttributeManagement />} />
              <Route path="attribute-values" element={<AttributeValueManagement />} />
              <Route path="attribute-values/add" element={<AttributeValueManagement />} />
              <Route path="attribute-values/:id" element={<AttributeValueManagement />} />

              {/* Customers */}
              <Route path="customers" element={<CustomerManagement />} />
              <Route path="customers/add" element={<CustomerManagement />} />
              <Route path="customers/:id" element={<CustomerManagement />} />
              <Route path="customers/:id/edit" element={<CustomerManagement />} />
              <Route path="customers/:id/orders" element={<CustomerManagement />} />
              <Route path="customers/:id/points" element={<CustomerManagement />} />

              {/* VIP & Membership (membership management moved to /admin/membership/tiers) */}
              <Route path="vip" element={<Navigate to="/admin/membership/tiers" replace />} />
              <Route path="vip/levels" element={<Navigate to="/admin/membership/tiers" replace />} />
              <Route path="vip/levels/add" element={<Navigate to="/admin/membership/tiers/add" replace />} />
              <Route path="vip/levels/:id" element={<Navigate to="/admin/membership/tiers/:id" replace />} />
              <Route path="vip/customers" element={<Navigate to="/admin/membership/tiers" replace />} />
              <Route path="membership/*" element={<Navigate to="/admin/membership/tiers" replace />} />

              {/* Membership tiers management */}
              <Route path="membership/tiers" element={<MembershipTierManagement />} />
              <Route path="membership/tiers/add" element={<MembershipTierManagement />} />
              <Route path="membership/tiers/:id" element={<MembershipTierManagement />} />

              {/* Orders */}
              <Route path="orders" element={<OrderManagement />} />
              <Route path="orders/add" element={<OrderManagement />} />
              <Route path="orders/:id" element={<OrderDetailManagement />} />
              <Route path="orders/:id/edit" element={<OrderDetailManagement />} />
              <Route path="orders/:id/status" element={<OrderDetailManagement />} />
              <Route path="orders/:id/cancel" element={<OrderDetailManagement />} />

              {/* Invoices */}
              <Route path="invoices" element={<InvoiceManagement />} />
              <Route path="invoices/:id" element={<InvoiceManagement />} />
              <Route path="invoices/:id/print" element={<InvoiceManagement />} />

              {/* Payments */}
              <Route path="payments" element={<PaymentTransactionManagement />} />
              <Route path="payments/:id" element={<PaymentTransactionManagement />} />
              <Route path="payments/pending" element={<PaymentTransactionManagement />} />
              <Route path="payments/completed" element={<PaymentTransactionManagement />} />
              <Route path="transactions" element={<Navigate to="/admin/payments" replace />} />

              {/* Promotions / Discounts */}
              <Route path="promotions" element={<Navigate to="/admin/discounts" replace />} />
              <Route path="promotions/add" element={<Navigate to="/admin/discounts/add" replace />} />
              <Route path="promotions/:id" element={<Navigate to="/admin/discounts/:id" replace />} />
              <Route path="promotions/:id/edit" element={<Navigate to="/admin/discounts/:id/edit" replace />} />
              <Route path="discounts" element={<DiscountManagement />} />
              <Route path="discounts/add" element={<DiscountManagement />} />
              <Route path="discounts/:id" element={<DiscountManagement />} />
              <Route path="discounts/:id/edit" element={<DiscountManagement />} />

              {/* Vouchers */}
              <Route path="vouchers" element={<VoucherManagement />} />
              <Route path="vouchers/add" element={<VoucherManagement />} />
              <Route path="vouchers/:id" element={<VoucherManagement />} />
              <Route path="vouchers/:id/edit" element={<VoucherManagement />} />
              <Route path="vouchers/:id/assign" element={<VoucherManagement />} />

              {/* Inventory */}
              <Route path="inventory" element={<InventoryAlerts />} />
              <Route path="inventory/alerts" element={<InventoryAlerts />} />
              <Route path="inventory/stock" element={<InventoryAlerts />} />
              <Route path="inventory/import" element={<InventoryAlerts />} />
              <Route path="inventory/export" element={<InventoryAlerts />} />

              {/* Sales */}
              <Route path="sales" element={<SalesManagement />} />
              <Route path="sales/pos" element={<SalesManagement />} />
              <Route path="sales/statistics" element={<SalesManagement />} />

              {/* Reports */}
              <Route path="reports" element={<ReportsAnalytics />} />
              <Route path="reports/revenue" element={<ReportsAnalytics />} />
              <Route path="reports/products" element={<ReportsAnalytics />} />
              <Route path="reports/customers" element={<ReportsAnalytics />} />
              <Route path="reports/inventory" element={<ReportsAnalytics />} />
              <Route path="analytics" element={<Navigate to="/admin/reports" replace />} />

              {/* Accounts */}
              <Route path="accounts" element={<AccountManagement />} />
              <Route path="accounts/add" element={<AccountManagement />} />
              <Route path="accounts/:id" element={<AccountManagement />} />
              <Route path="accounts/:id/edit" element={<AccountManagement />} />
              <Route path="users" element={<Navigate to="/admin/accounts" replace />} />

              {/* Settings */}
              <Route path="settings" element={<Settings />} />
              <Route path="settings/general" element={<Settings />} />
              <Route path="settings/payment" element={<Settings />} />
              <Route path="settings/shipping" element={<Settings />} />
              <Route path="settings/email" element={<Settings />} />
              <Route path="settings/sms" element={<Settings />} />

              {/* Notifications */}
              <Route path="notifications" element={<Notifications />} />
              <Route path="emails" element={<EmailCampaign />} />
              <Route path="notifications/send" element={<Notifications />} />

            </Route>


            {/* ============================================
            STAFF ROUTES - Nhân viên (nested under /staff/*)
            These routes are wrapped by <StaffLayout /> which includes a ProtectedRoute
            so role checks are applied consistently for all nested staff pages.
        ============================================ */}

            <Route path="/staff/*" element={<StaffLayout />}>
              {/* index -> /staff or /staff/ */}
              <Route index element={<StaffDashboard />} />
              <Route path="dashboard" element={<StaffDashboard />} />

              {/* Staff Customer Lookup */}
              <Route path="customers" element={<CustomerLookup />} />

              {/* Staff Order Management - use Sales UI under /staff/sales; keep old /staff/orders routes redirecting */}
              <Route path="orders" element={<Navigate to="/staff/sales" replace />} />
              <Route path="orders/:id" element={<OrderDetail />} />
              <Route path="orders/pending" element={<Navigate to="/staff/sales" replace />} />
              <Route path="orders/processing" element={<Navigate to="/staff/sales" replace />} />
              <Route path="orders/completed" element={<Navigate to="/staff/sales" replace />} />

              {/* Staff Sales */}
              <Route path="sales" element={<SalesManagement />} />
              <Route path="sales/pos" element={<SalesManagement />} />
              <Route path="sales/statistics" element={<SalesManagement />} />

              {/* Staff Invoices */}
              <Route path="invoices" element={<InvoiceManagement />} />
              <Route path="invoices/:id" element={<InvoiceManagement />} />

              {/* Staff Payments */}
              <Route path="payments" element={<PaymentTransactionManagement />} />
              <Route path="payments/:id" element={<PaymentTransactionManagement />} />

              {/* Staff Inventory */}
              <Route path="inventory" element={<InventoryManagement />} />
              <Route path="inventory/alerts" element={<InventoryAlerts />} />
              <Route path="inventory/check" element={<InventoryManagement />} />
              
              {/* Staff Notifications */}
              <Route path="notifications" element={<StaffNotifications />} />
              
              {/* Support & Live Chat */}
              <Route path="support" element={<CustomerSupport />} />
              <Route path="livechat" element={<LiveChat />} />
            </Route>

            {/* Redirect legacy/public sales routes to /staff/sales so protection applies */}
            <Route path="/sales" element={<Navigate to="/staff/sales" replace />} />
            <Route path="/sales/pos" element={<Navigate to="/staff/sales/pos" replace />} />
            <Route path="/sales/statistics" element={<Navigate to="/staff/sales/statistics" replace />} />


            {/* ============================================
            UTILITY ROUTES
        ============================================ */}

            {/* Pending Tasks */}
            <Route path="/pending" element={<PendingTasks />} />
            <Route path="/tasks" element={<Navigate to="/pending" replace />} />

            {/* Main Dashboard (Role-based redirect) */}
            <Route path="/main-dashboard" element={<DashboardRouter />} />
            <Route path="/dashboard" element={<DashboardRouter />} />

            <Route path="/admin/membership/tiers" element={<AdminLayout><MembershipTierManagement /></AdminLayout>} />

            {/* ============================================
            ERROR & FALLBACK ROUTES
        ============================================ */}

            {/* 404 - Not Found - Redirect to home */}
            <Route path="/404" element={<Navigate to="/" replace />} />

            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;