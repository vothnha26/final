import React, { useState, useEffect } from 'react';
import { IoPerson, IoShield, IoNotifications, IoColorPalette, IoLanguage, IoTime, IoStorefront, IoCash, IoPeople, IoBarChart, IoSave, IoRefresh } from 'react-icons/io5';
import api from '../../../api';

// Mapping functions for Vietnamese API field names
const mapSettingsFromApi = (settings) => ({
  // General Settings
  companyName: settings.ten_cong_ty,
  companyAddress: settings.dia_chi_cong_ty,
  companyPhone: settings.sdt_cong_ty,
  companyEmail: settings.email_cong_ty,
  timezone: settings.mui_gio,
  language: settings.ngon_ngu,
  currency: settings.don_vi_tien_te,
  
  // Business Settings
  businessHours: settings.gio_lam_viec,
  returnPolicy: settings.chinh_sach_doi_tra,
  warrantyPeriod: settings.thoi_gian_bao_hanh,
  shippingFee: settings.phi_van_chuyen,
  freeShippingThreshold: settings.mien_phi_van_chuyen_tu,
  
  // Notification Settings
  emailNotifications: settings.thong_bao_email,
  smsNotifications: settings.thong_bao_sms,
  pushNotifications: settings.thong_bao_push,
  
  // System Settings
  backupFrequency: settings.tan_suat_sao_luu,
  dataRetention: settings.luu_tru_du_lieu,
  systemMaintenance: settings.bao_tri_he_thong,
  
  // Security Settings
  passwordPolicy: settings.chinh_sach_mat_khau,
  sessionTimeout: settings.thoi_gian_phien,
  twoFactorAuth: settings.xac_thuc_hai_yeu_to,
  
  // Display Settings
  theme: settings.giao_dien,
  pageSize: settings.kich_thuoc_trang,
  dateFormat: settings.dinh_dang_ngay,
  numberFormat: settings.dinh_dang_so
});

const mapSettingsToApi = (settings) => ({
  ten_cong_ty: settings.companyName,
  dia_chi_cong_ty: settings.companyAddress,
  sdt_cong_ty: settings.companyPhone,
  email_cong_ty: settings.companyEmail,
  mui_gio: settings.timezone,
  ngon_ngu: settings.language,
  don_vi_tien_te: settings.currency,
  gio_lam_viec: settings.businessHours,
  chinh_sach_doi_tra: settings.returnPolicy,
  thoi_gian_bao_hanh: settings.warrantyPeriod,
  phi_van_chuyen: settings.shippingFee,
  mien_phi_van_chuyen_tu: settings.freeShippingThreshold,
  thong_bao_email: settings.emailNotifications,
  thong_bao_sms: settings.smsNotifications,
  thong_bao_push: settings.pushNotifications,
  tan_suat_sao_luu: settings.backupFrequency,
  luu_tru_du_lieu: settings.dataRetention,
  bao_tri_he_thong: settings.systemMaintenance,
  chinh_sach_mat_khau: settings.passwordPolicy,
  thoi_gian_phien: settings.sessionTimeout,
  xac_thuc_hai_yeu_to: settings.twoFactorAuth,
  giao_dien: settings.theme,
  kich_thuoc_trang: settings.pageSize,
  dinh_dang_ngay: settings.dateFormat,
  dinh_dang_so: settings.numberFormat
});

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    // General Settings
    companyName: 'Furniture Store',
    companyAddress: '123 Đường ABC, Quận 1, TP.HCM',
    companyPhone: '0123456789',
    companyEmail: 'info@furniturestore.com',
    timezone: 'Asia/Ho_Chi_Minh',
    language: 'vi',
    currency: 'VND',
    
    // Business Settings
    businessType: 'retail',
    taxRate: 10,
    shippingFee: 50000,
    minOrderValue: 1000000,
    
    // Notification Settings
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    orderNotifications: true,
    inventoryNotifications: true,
    vipNotifications: true,
    
    // Display Settings
    theme: 'light',
    primaryColor: '#3B82F6',
    itemsPerPage: 20,
    autoRefresh: true,
    refreshInterval: 30
  });

  // API Functions
  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/v1/cai-dat');
      setSettings(mapSettingsFromApi(response.data));
    } catch (error) {
      setError('Không thể tải cài đặt');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const response = await api.put('/api/v1/cai-dat', mapSettingsToApi(settings));
      setSettings(mapSettingsFromApi(response.data));
      return true;
    } catch (error) {
      throw new Error('Không thể lưu cài đặt');
    } finally {
      setIsSaving(false);
    }
  };

  const resetSettings = async () => {
    try {
      const response = await api.post('/api/v1/cai-dat/dat-lai');
      setSettings(mapSettingsFromApi(response.data));
    } catch (error) {
      throw new Error('Không thể đặt lại cài đặt');
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const tabs = [
    { id: 'general', name: 'Cài đặt chung', icon: IoPerson },
    { id: 'business', name: 'Cài đặt kinh doanh', icon: IoStorefront },
    { id: 'notifications', name: 'Thông báo', icon: IoNotifications },
    { id: 'display', name: 'Giao diện', icon: IoColorPalette },
    { id: 'security', name: 'Bảo mật', icon: IoShield }
  ];

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      await saveSettings();
      window.alert('Cài đặt đã được lưu thành công!');
    } catch (error) {
      setError(error.message);
    }
  };

  const handleResetSettings = async () => {
    if (window.confirm('Bạn có chắc muốn đặt lại tất cả cài đặt về mặc định?')) {
      try {
        await resetSettings();
        window.alert('Đã đặt lại cài đặt về mặc định!');
      } catch (error) {
        setError(error.message);
      }
    }
  };

  const defaultSettings = {
    companyName: 'Furniture Store',
    companyAddress: '123 Đường ABC, Quận 1, TP.HCM',
    companyPhone: '0123456789',
    companyEmail: 'info@furniturestore.com',
    timezone: 'Asia/Ho_Chi_Minh',
    language: 'vi',
    currency: 'VND',
    businessType: 'retail',
    taxRate: 10,
    shippingFee: 50000,
    minOrderValue: 1000000,
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        orderNotifications: true,
        inventoryNotifications: true,
        vipNotifications: true,
        theme: 'light',
        primaryColor: '#3B82F6',
        itemsPerPage: 20,
        autoRefresh: true,
        refreshInterval: 30
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin công ty</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên công ty
            </label>
            <input
              type="text"
              value={settings.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số điện thoại
            </label>
            <input
              type="text"
              value={settings.companyPhone}
              onChange={(e) => handleInputChange('companyPhone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Địa chỉ
            </label>
            <textarea
              value={settings.companyAddress}
              onChange={(e) => handleInputChange('companyAddress', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={settings.companyEmail}
              onChange={(e) => handleInputChange('companyEmail', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cài đặt hệ thống</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Múi giờ
            </label>
            <select
              value={settings.timezone}
              onChange={(e) => handleInputChange('timezone', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh</option>
              <option value="Asia/Bangkok">Asia/Bangkok</option>
              <option value="Asia/Singapore">Asia/Singapore</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ngôn ngữ
            </label>
            <select
              value={settings.language}
              onChange={(e) => handleInputChange('language', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiền tệ
            </label>
            <select
              value={settings.currency}
              onChange={(e) => handleInputChange('currency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="VND">VND</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBusinessSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cài đặt kinh doanh</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loại hình kinh doanh
            </label>
            <select
              value={settings.businessType}
              onChange={(e) => handleInputChange('businessType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="retail">Bán lẻ</option>
              <option value="wholesale">Bán sỉ</option>
              <option value="both">Cả hai</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thuế suất (%)
            </label>
            <input
              type="number"
              value={settings.taxRate}
              onChange={(e) => handleInputChange('taxRate', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phí vận chuyển (VND)
            </label>
            <input
              type="number"
              value={settings.shippingFee}
              onChange={(e) => handleInputChange('shippingFee', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Giá trị đơn hàng tối thiểu (VND)
            </label>
            <input
              type="number"
              value={settings.minOrderValue}
              onChange={(e) => handleInputChange('minOrderValue', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cài đặt thông báo</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Thông báo email</h4>
              <p className="text-sm text-gray-500">Nhận thông báo qua email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Thông báo SMS</h4>
              <p className="text-sm text-gray-500">Nhận thông báo qua tin nhắn</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.smsNotifications}
                onChange={(e) => handleInputChange('smsNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Thông báo đơn hàng</h4>
              <p className="text-sm text-gray-500">Thông báo khi có đơn hàng mới</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.orderNotifications}
                onChange={(e) => handleInputChange('orderNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Cảnh báo tồn kho</h4>
              <p className="text-sm text-gray-500">Thông báo khi sản phẩm sắp hết hàng</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.inventoryNotifications}
                onChange={(e) => handleInputChange('inventoryNotifications', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDisplaySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cài đặt giao diện</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chủ đề
            </label>
            <select
              value={settings.theme}
              onChange={(e) => handleInputChange('theme', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="light">Sáng</option>
              <option value="dark">Tối</option>
              <option value="auto">Tự động</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Màu chủ đạo
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.primaryColor}
                onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
              />
              <span className="text-sm text-gray-500">{settings.primaryColor}</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số mục trên trang
            </label>
            <select
              value={settings.itemsPerPage}
              onChange={(e) => handleInputChange('itemsPerPage', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tự động làm mới (giây)
            </label>
            <input
              type="number"
              value={settings.refreshInterval}
              onChange={(e) => handleInputChange('refreshInterval', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cài đặt bảo mật</h3>
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <IoShield className="w-5 h-5 text-yellow-600 mr-2" />
              <h4 className="font-medium text-yellow-800">Cảnh báo bảo mật</h4>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Để đảm bảo an toàn, hãy thay đổi mật khẩu định kỳ và sử dụng mật khẩu mạnh.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu hiện tại
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Nhập mật khẩu hiện tại"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu mới
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Nhập mật khẩu mới"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Xác nhận mật khẩu mới
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Xác nhận mật khẩu mới"
              />
            </div>
            <div className="flex items-end">
              <button className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
                Đổi mật khẩu
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderGeneralSettings();
      case 'business':
        return renderBusinessSettings();
      case 'notifications':
        return renderNotificationSettings();
      case 'display':
        return renderDisplaySettings();
      case 'security':
        return renderSecuritySettings();
      default:
        return renderGeneralSettings();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cài đặt hệ thống</h1>
          <p className="text-gray-600">Quản lý cấu hình và tùy chỉnh hệ thống</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <IconComponent className="w-5 h-5 mr-3" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {renderTabContent()}
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
              <div className="flex items-center justify-between">
                <button
                  onClick={resetSettings}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
                >
                  <IoRefresh className="w-5 h-5" />
                  Đặt lại mặc định
                </button>
                <div className="flex gap-3">
                  <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                    Hủy
                  </button>
                  <button
                    onClick={saveSettings}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <IoSave className="w-5 h-5" />
                    Lưu cài đặt
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;

