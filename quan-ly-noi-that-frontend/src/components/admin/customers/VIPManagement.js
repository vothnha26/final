import React, { useState, useEffect, useRef } from 'react';
import { IoAdd, IoSearch, IoCreate, IoTrash, IoEye, IoStar, IoTrophy, IoDiamond, IoMedal, IoCheckmark } from 'react-icons/io5';
import api from '../../../api';

const VIPManagement = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newVipCustomer, setNewVipCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    vipLevel: 'silver',
    totalSpent: 0,
    totalOrders: 0,
    joinDate: '',
    benefits: [],
    status: 'active'
  });

  const [vipCustomers, setVipCustomers] = useState([]);

  const [vipBenefits, setVipBenefits] = useState([]);

  const [showAddBenefitModal, setShowAddBenefitModal] = useState(false);
  const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
  const [showCustomerDetailModal, setShowCustomerDetailModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [newBenefit, setNewBenefit] = useState({
    level: '',
    name: '',
    minSpent: '',
    benefits: []
  });

  // Refs for API functions
  const createVipCustomerRef = useRef(null);
  const updateVipCustomerRef = useRef(null);
  const createVipLevelRef = useRef(null);

  const getColorForLevel = (level) => {
    const levelColors = {
      'bạc': 'bg-gray-100 text-gray-800',
      'silver': 'bg-gray-100 text-gray-800',
      'vàng': 'bg-yellow-100 text-yellow-800',
      'gold': 'bg-yellow-100 text-yellow-800',
      'bạch kim': 'bg-purple-100 text-purple-800',
      'platinum': 'bg-purple-100 text-purple-800',
      'kim cương': 'bg-blue-100 text-blue-800',
      'diamond': 'bg-blue-100 text-blue-800'
    };
    return levelColors[level.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getIconForLevel = (level) => {
    const levelIcons = {
      'bạc': IoMedal, 'silver': IoMedal,
      'vàng': IoStar, 'gold': IoStar,
      'bạch kim': IoTrophy, 'platinum': IoTrophy,
      'kim cương': IoDiamond, 'diamond': IoDiamond
    };
    return levelIcons[level.toLowerCase()] || IoMedal;
  };

  // API Functions
  // These will be defined inside useEffect to access mapping functions

  // Map VIP customer from UI to API
  const mapVipCustomerToApi = (customer) => ({
    hoTen: customer.name,
    email: customer.email,
    soDienThoai: customer.phone,
    hangThanhVien: { tenHang: customer.vipLevel },
    tongChiTieu: parseFloat(customer.totalSpent),
    tongSoDonHang: parseInt(customer.totalOrders),
    ngayThamGia: customer.joinDate,
    quyenLoi: customer.benefits,
    trangThai: customer.status === 'active'
  });

  // Map VIP level from UI to API
  const mapVipLevelToApi = (level) => ({
    tenHang: level.name,
    diemToiThieu: parseInt(level.minSpent),
    // send structured vipBenefits array; each benefit is an object expected by backend
    vipBenefits: (level.benefits || []).map(b => ({
      benefitType: 'CUSTOM',
      params: {},
      description: b,
      active: true
    }))
  });

  const parseParams = (params) => {
    if (!params && params !== 0) return {};
    if (typeof params === 'object') return params;
    try { return JSON.parse(params); } catch { return {}; }
  };

  const formatBenefit = (benefit) => {
    if (!benefit) return '';
    const type = benefit.benefitType || 'CUSTOM';
    const p = parseParams(benefit.params);
    if (type === 'PERCENT_DISCOUNT') return benefit.description || `Giảm ${p.percent}%`;
    if (type === 'FREE_SHIPPING') return benefit.description || `Miễn phí ship (đơn trên ${p.minOrder || 0})`;
    if (type === 'BONUS_POINTS') return benefit.description || (p.points ? `Tặng ${p.points} điểm` : `Tặng ${p.percent || 0}% điểm`);
    return benefit.description || (typeof benefit.params === 'string' ? benefit.params : JSON.stringify(benefit.params || {}));
  };

  const getVipLevelInfo = (level) => {
    return vipBenefits.find(vip => vip.level === level) || vipBenefits[0];
  };

  // Fetch VIP data on component mount
  useEffect(() => {
    // Map functions defined inside useEffect to avoid dependency issues
    const mapVipLevelFromApi = (level) => ({
      id: level.maHangThanhVien || level.id,
      level: level.tenHang ? level.tenHang.toLowerCase().replace(' ', '') : 'silver',
      name: level.tenHang || level.name || '',
      minSpent: level.diemToiThieu || level.soTienToiThieu || 0,
      benefits: (level.vipBenefits && Array.isArray(level.vipBenefits) && level.vipBenefits.length > 0)
        ? level.vipBenefits.map(b => b.description || '')
        : (level.moTa ? [level.moTa] : []),
      color: getColorForLevel(level.tenHang || ''),
      icon: getIconForLevel(level.tenHang || '')
    });

    const mapVipCustomerFromApi = (customer) => ({
      id: customer.maKhachHang || customer.id,
      name: customer.hoTen || customer.name || '',
      email: customer.email || '',
      phone: customer.soDienThoai || customer.phone || '',
      vipLevel: customer.hangThanhVien?.tenHang?.toLowerCase() || 'silver',
      totalSpent: customer.tongChiTieu || customer.totalSpent || 0,
      totalOrders: customer.tongSoDonHang || customer.totalOrders || 0,
      joinDate: customer.ngayThamGia || customer.joinDate || '',
      lastOrder: customer.donHangCuoi || customer.lastOrder || '',
      benefits: customer.quyenLoi || customer.benefits || [],
      status: customer.trangThai !== false ? 'active' : 'inactive'
    });

    const fetchVipLevels = async () => {
      try {
        const response = await api.get('/api/vip/levels');
        if (Array.isArray(response)) {
          setVipBenefits(response.map(mapVipLevelFromApi));
        }
      } catch (err) {
        setError('Không thể tải danh sách cấp độ VIP');
      }
    };

    const fetchVipCustomers = async () => {
      try {
        const response = await api.get('/api/vip/customers');
        if (Array.isArray(response)) {
          setVipCustomers(response.map(mapVipCustomerFromApi));
        }
      } catch (err) {
        setError('Không thể tải danh sách khách hàng VIP');
      }
    };

    const createVipCustomer = async (customerData) => {
      const response = await api.post('/api/vip/customers', customerData);
      return response;
    };

    const updateVipCustomer = async (id, customerData) => {
      const response = await api.put(`/api/vip/customers/${id}`, customerData);
      return response;
    };

    const createVipLevel = async (levelData) => {
      const response = await api.post('/api/vip/levels', levelData);
      return response;
    };

    // Assign functions to refs
    createVipCustomerRef.current = createVipCustomer;
    updateVipCustomerRef.current = updateVipCustomer;
    createVipLevelRef.current = createVipLevel;

    const fetchVipData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([fetchVipLevels(), fetchVipCustomers()]);
      } catch (err) {
        
      } finally {
        setIsLoading(false);
      }
    };
    fetchVipData();
  }, []);

  // Wrapper functions to use refs
  const handleCreateVipCustomer = async (customerData) => {
    if (createVipCustomerRef.current) {
      return await createVipCustomerRef.current(customerData);
    }
    throw new Error('API function not available');
  };

  const handleUpdateVipCustomer = async (id, customerData) => {
    if (updateVipCustomerRef.current) {
      return await updateVipCustomerRef.current(id, customerData);
    }
    throw new Error('API function not available');
  };

  const handleCreateVipLevel = async (levelData) => {
    if (createVipLevelRef.current) {
      return await createVipLevelRef.current(levelData);
    }
    throw new Error('API function not available');
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setShowEditCustomerModal(true);
  };

  const handleSaveEditCustomer = async () => {
    try {
      const customerData = mapVipCustomerToApi(editingCustomer);
      await handleUpdateVipCustomer(editingCustomer.id, customerData);
      setShowEditCustomerModal(false);
      setEditingCustomer(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddVipCustomer = async (e) => {
    e.preventDefault();
    try {
      const customerData = mapVipCustomerToApi(newVipCustomer);
      await handleCreateVipCustomer(customerData);
      setNewVipCustomer({
        name: '',
        email: '',
        phone: '',
        vipLevel: 'silver',
        totalSpent: 0,
        totalOrders: 0,
        joinDate: '',
        benefits: [],
        status: 'active'
      });
      setShowAddModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setShowCustomerDetailModal(true);
  };

  const handleAddBenefit = async () => {
    try {
      const levelData = mapVipLevelToApi(newBenefit);
      await handleCreateVipLevel(levelData);
      setNewBenefit({
        level: '',
        name: '',
        minSpent: '',
        benefits: []
      });
      setShowAddBenefitModal(false);
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredCustomers = vipCustomers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || customer.vipLevel === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý VIP</h1>
          <p className="text-gray-600">Quản lý khách hàng VIP và ưu đãi độc quyền</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <IoTrash className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && (
          <div className="mb-8 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-gray-600">Đang tải...</span>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <IoStar className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng VIP</p>
                <p className="text-2xl font-bold text-gray-900">{vipCustomers.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <IoStar className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Gold+</p>
                <p className="text-2xl font-bold text-gray-900">
                  {vipCustomers.filter(c => ['gold', 'platinum', 'diamond'].includes(c.vipLevel)).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <IoTrophy className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Platinum+</p>
                <p className="text-2xl font-bold text-gray-900">
                  {vipCustomers.filter(c => ['platinum', 'diamond'].includes(c.vipLevel)).length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <IoDiamond className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Diamond</p>
                <p className="text-2xl font-bold text-gray-900">
                  {vipCustomers.filter(c => c.vipLevel === 'diamond').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* VIP Benefits Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Cấp độ VIP và ưu đãi</h2>
            <button
              onClick={() => setShowAddBenefitModal(true)}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <IoAdd className="w-5 h-5" />
              Thêm cấp độ
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {vipBenefits.map((benefit) => {
              const IconComponent = benefit.icon;
              return (
                <div key={benefit.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-gray-100 rounded-lg mr-3">
                      <IconComponent className="w-6 h-6 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{benefit.name}</h3>
                      <p className="text-sm text-gray-500">Từ {benefit.minSpent.toLocaleString('vi-VN')}đ</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {benefit.benefits.map((benefitItem, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-600">
                        <IoCheckmark className="w-4 h-4 text-green-500 mr-2" />
                        {formatBenefit(benefitItem)}
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button
                      disabled
                      className="flex-1 text-sm text-gray-400 py-1 cursor-not-allowed"
                      title="Tính năng đang phát triển"
                    >
                      Chỉnh sửa
                    </button>
                    <button className="flex-1 text-sm text-red-600 hover:text-red-800 py-1">
                      Xóa
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* VIP Customers Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Khách hàng VIP</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                <IoAdd className="w-4 h-4" />
                Thêm khách hàng VIP
              </button>
              <div className="relative">
                <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm khách hàng..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full sm:w-64"
                />
              </div>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">Tất cả cấp độ</option>
                <option value="silver">Bạc</option>
                <option value="gold">Vàng</option>
                <option value="platinum">Bạch kim</option>
                <option value="diamond">Kim cương</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cấp độ VIP
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tổng chi tiêu
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đơn hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ưu đãi
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => {
                  const vipInfo = getVipLevelInfo(customer.vipLevel);
                  const IconComponent = vipInfo.icon;
                  return (
                    <tr key={customer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <IconComponent className="h-5 w-5 text-primary" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {customer.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {customer.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${vipInfo.color}`}>
                          {vipInfo.name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.totalSpent.toLocaleString('vi-VN')}đ
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {customer.totalOrders}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {customer.benefits.length} ưu đãi
                        </div>
                        <div className="text-xs text-gray-500">
                          {customer.benefits.slice(0, 2).join(', ')}
                          {customer.benefits.length > 2 && '...'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewCustomer(customer)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Xem chi tiết"
                          >
                            <IoEye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEditCustomer(customer)}
                            className="text-green-600 hover:text-green-800"
                            title="Chỉnh sửa"
                          >
                            <IoCreate className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Benefit Modal */}
        {showAddBenefitModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Thêm cấp độ VIP</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên cấp độ
                  </label>
                  <input
                    type="text"
                    value={newBenefit.name}
                    onChange={(e) => setNewBenefit({...newBenefit, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nhập tên cấp độ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mã cấp độ
                  </label>
                  <select
                    value={newBenefit.level}
                    onChange={(e) => setNewBenefit({...newBenefit, level: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Chọn cấp độ</option>
                    <option value="silver">Bạc</option>
                    <option value="gold">Vàng</option>
                    <option value="platinum">Bạch kim</option>
                    <option value="diamond">Kim cương</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chi tiêu tối thiểu (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={newBenefit.minSpent}
                    onChange={(e) => setNewBenefit({...newBenefit, minSpent: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nhập số tiền tối thiểu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ưu đãi
                  </label>
                  <div className="space-y-2">
                    {newBenefit.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={benefit}
                          onChange={(e) => {
                            const newBenefits = [...newBenefit.benefits];
                            newBenefits[index] = e.target.value;
                            setNewBenefit({...newBenefit, benefits: newBenefits});
                          }}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Nhập ưu đãi"
                        />
                        <button
                          onClick={() => {
                            const newBenefits = newBenefit.benefits.filter((_, i) => i !== index);
                            setNewBenefit({...newBenefit, benefits: newBenefits});
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          <IoTrash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setNewBenefit({...newBenefit, benefits: [...newBenefit.benefits, '']})}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Thêm ưu đãi
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddBenefitModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddBenefit}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Thêm cấp độ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Customer Detail Modal */}
        {showCustomerDetailModal && selectedCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <h3 className="text-lg font-semibold mb-4">Chi tiết khách hàng VIP</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900">{selectedCustomer.name}</h4>
                    <p className="text-gray-600">{selectedCustomer.email}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Số điện thoại: </span>
                    <span className="text-sm font-medium">{selectedCustomer.phone}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Cấp độ VIP: </span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getVipLevelInfo(selectedCustomer.vipLevel).color}`}>
                      {getVipLevelInfo(selectedCustomer.vipLevel).name}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Tham gia: </span>
                    <span className="text-sm font-medium">{selectedCustomer.joinDate}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-gray-600">Tổng chi tiêu: </span>
                    <span className="text-sm font-medium">{selectedCustomer.totalSpent.toLocaleString('vi-VN')}đ</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Tổng đơn hàng: </span>
                    <span className="text-sm font-medium">{selectedCustomer.totalOrders}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Đơn hàng cuối: </span>
                    <span className="text-sm font-medium">{selectedCustomer.lastOrder}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Ưu đãi: </span>
                    <div className="mt-2 space-y-1">
                      {selectedCustomer.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600">
                          <IoCheckmark className="w-4 h-4 text-green-500 mr-2" />
                          {benefit}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowCustomerDetailModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Đóng
                </button>
                <button
                  onClick={() => {
                    setShowCustomerDetailModal(false);
                    handleEditCustomer(selectedCustomer);
                  }}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Chỉnh sửa
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add VIP Customer Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Thêm khách hàng VIP mới
                  </h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <IoAdd className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleAddVipCustomer}>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách hàng</label>
                        <input
                          type="text"
                          value={newVipCustomer.name}
                          onChange={(e) => setNewVipCustomer({...newVipCustomer, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Nhập tên khách hàng"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                          type="email"
                          value={newVipCustomer.email}
                          onChange={(e) => setNewVipCustomer({...newVipCustomer, email: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Nhập email"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                        <input
                          type="tel"
                          value={newVipCustomer.phone}
                          onChange={(e) => setNewVipCustomer({...newVipCustomer, phone: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          placeholder="Nhập số điện thoại"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cấp độ VIP</label>
                        <select
                          value={newVipCustomer.vipLevel}
                          onChange={(e) => setNewVipCustomer({...newVipCustomer, vipLevel: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          required
                        >
                          <option value="silver">Silver</option>
                          <option value="gold">Gold</option>
                          <option value="platinum">Platinum</option>
                          <option value="diamond">Diamond</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tổng chi tiêu (VND)</label>
                        <input
                          type="number"
                          value={newVipCustomer.totalSpent}
                          onChange={(e) => setNewVipCustomer({...newVipCustomer, totalSpent: parseFloat(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          min="0"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tổng đơn hàng</label>
                        <input
                          type="number"
                          value={newVipCustomer.totalOrders}
                          onChange={(e) => setNewVipCustomer({...newVipCustomer, totalOrders: parseInt(e.target.value)})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          min="0"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ngày tham gia</label>
                      <input
                        type="date"
                        value={newVipCustomer.joinDate}
                        onChange={(e) => setNewVipCustomer({...newVipCustomer, joinDate: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ưu đãi</label>
                      <input
                        type="text"
                        value={newVipCustomer.benefits.join(', ')}
                        onChange={(e) => setNewVipCustomer({...newVipCustomer, benefits: e.target.value.split(',').map(benefit => benefit.trim()).filter(benefit => benefit)})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="Nhập ưu đãi cách nhau bởi dấu phẩy"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                    >
                      Thêm khách hàng VIP
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Customer Modal */}
        {showEditCustomerModal && editingCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Chỉnh sửa khách hàng VIP</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên khách hàng
                  </label>
                  <input
                    type="text"
                    value={editingCustomer.name}
                    onChange={(e) => setEditingCustomer({...editingCustomer, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nhập tên khách hàng"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingCustomer.email}
                    onChange={(e) => setEditingCustomer({...editingCustomer, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nhập email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Số điện thoại
                  </label>
                  <input
                    type="tel"
                    value={editingCustomer.phone}
                    onChange={(e) => setEditingCustomer({...editingCustomer, phone: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cấp độ VIP
                  </label>
                  <select
                    value={editingCustomer.vipLevel}
                    onChange={(e) => setEditingCustomer({...editingCustomer, vipLevel: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="silver">Bạc</option>
                    <option value="gold">Vàng</option>
                    <option value="platinum">Bạch kim</option>
                    <option value="diamond">Kim cương</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tổng chi tiêu (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={editingCustomer.totalSpent}
                    onChange={(e) => setEditingCustomer({...editingCustomer, totalSpent: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nhập tổng chi tiêu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={editingCustomer.status}
                    onChange={(e) => setEditingCustomer({...editingCustomer, status: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditCustomerModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEditCustomer}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VIPManagement;

