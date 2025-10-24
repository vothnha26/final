import React, { useState, useEffect } from 'react';
import { IoAdd, IoSearch, IoCreate, IoTrash, IoEye, IoEyeOff, IoPerson, IoMail, IoCall, IoShield } from 'react-icons/io5';
import api from '../../../api';

const AccountManagement = () => {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch accounts on component mount
  useEffect(() => {
    const fetchAccounts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get('/api/accounts');
        if (Array.isArray(response)) {
          // Filter to only show STAFF, MANAGER, and ADMIN accounts (exclude CUSTOMER)
          const staffAccounts = response.filter(account => {
            const role = normalizeRole(account.vaiTro || account.role);
            return role === 'STAFF' || role === 'MANAGER' || role === 'ADMIN';
          });
          
          setAccounts(staffAccounts.map(account => ({
            id: account.maTaiKhoan || account.id,
            username: account.tenDangNhap || account.username,
            fullName: account.hoTen || account.fullName,
            email: account.email || account.email,
            phone: account.soDienThoai || account.phone,
              role: normalizeRole(account.vaiTro || account.role),
            status: account.trangThai !== false ? 'active' : 'inactive',
            lastLogin: account.lanDangNhapCuoi || account.lastLogin || 'Chưa đăng nhập'
          })));
        }
      } catch (err) {
        console.error('Fetch accounts error', err);
        setError('Không thể tải danh sách tài khoản');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAccounts();
  }, []);
    const normalizeRole = (r) => String(r || '').toUpperCase().replace(/^ROLE_/, '').trim();

  // API Functions
  const createAccount = async (accountData) => {
    const response = await api.post('/api/accounts', accountData);
    return response;
  };

  const updateAccount = async (id, accountData) => {
    const response = await api.put(`/api/accounts/${id}`, accountData);
    return response;
  };

  const deleteAccount = async (id) => {
    const response = await api.delete(`/api/accounts/${id}`);
    return response;
  };

  const changePassword = async (id, newPassword) => {
    const response = await api.put(`/api/accounts/${id}/password`, { matKhau: newPassword });
    return response;
  };

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [editingAccount, setEditingAccount] = useState(null);
  const [newAccount, setNewAccount] = useState({
    username: '',
    fullName: '',
    email: '',
    phone: '',
    role: 'STAFF',
    password: ''
  });

  const handleAddAccount = async () => {
    try {
      const accountData = {
        tenDangNhap: newAccount.username,
        hoTen: newAccount.fullName,
        email: newAccount.email,
        soDienThoai: newAccount.phone,
          vaiTro: normalizeRole(newAccount.role || 'STAFF'),
        matKhau: newAccount.password,
        trangThai: true
      };

      await createAccount(accountData);

      // Refresh data
      const response = await api.get('/api/accounts');
      if (Array.isArray(response)) {
        // Filter to only show STAFF, MANAGER, and ADMIN accounts
        const staffAccounts = response.filter(account => {
          const role = normalizeRole(account.vaiTro || account.role);
          return role === 'STAFF' || role === 'MANAGER' || role === 'ADMIN';
        });
        
        setAccounts(staffAccounts.map(account => ({
          id: account.maTaiKhoan || account.id,
          username: account.tenDangNhap || account.username,
          fullName: account.hoTen || account.fullName,
          email: account.email || account.email,
          phone: account.soDienThoai || account.phone,
          role: account.vaiTro || account.role,
          status: account.trangThai !== false ? 'active' : 'inactive',
          lastLogin: account.lanDangNhapCuoi || account.lastLogin || 'Chưa đăng nhập'
        })));
      }

      setNewAccount({
        username: '',
        fullName: '',
        email: '',
        phone: '',
        role: 'STAFF',
        password: ''
      });
      setShowAddModal(false);
    } catch (err) {
      console.error('Add account error', err);
      setError('Có lỗi xảy ra khi thêm tài khoản');
    }
  };

  const handleDeleteAccount = async (id) => {
    try {
      await deleteAccount(id);

      // Refresh data
      const response = await api.get('/api/accounts');
      if (Array.isArray(response)) {
        // Filter to only show STAFF, MANAGER, and ADMIN accounts
        const staffAccounts = response.filter(account => {
          const role = normalizeRole(account.vaiTro || account.role);
          return role === 'STAFF' || role === 'MANAGER' || role === 'ADMIN';
        });
        
          setAccounts(staffAccounts.map(account => ({
          id: account.maTaiKhoan || account.id,
          username: account.tenDangNhap || account.username,
          fullName: account.hoTen || account.fullName,
          email: account.email || account.email,
          phone: account.soDienThoai || account.phone,
          role: String(account.vaiTro || account.role || '').toUpperCase(),
          status: account.trangThai !== false ? 'active' : 'inactive',
          lastLogin: account.lanDangNhapCuoi || account.lastLogin || 'Chưa đăng nhập'
        })));
      }
    } catch (err) {
      console.error('Delete account error', err);
      setError('Có lỗi xảy ra khi xóa tài khoản');
    }
  };

  const handleChangePassword = (account) => {
    setSelectedAccount(account);
    setShowPasswordModal(true);
  };

  const handleEditAccount = (account) => {
    setEditingAccount(account);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      const accountData = {
        tenDangNhap: editingAccount.username,
        hoTen: editingAccount.fullName,
        email: editingAccount.email,
        soDienThoai: editingAccount.phone,
          vaiTro: normalizeRole(editingAccount.role),
        trangThai: editingAccount.status === 'active'
      };

      await updateAccount(editingAccount.id, accountData);

      // Refresh data
      const response = await api.get('/api/accounts');
      if (Array.isArray(response)) {
        // Filter to only show STAFF, MANAGER, and ADMIN accounts
        const staffAccounts = response.filter(account => {
          const role = normalizeRole(account.vaiTro || account.role);
          return role === 'STAFF' || role === 'MANAGER' || role === 'ADMIN';
        });
        
        setAccounts(staffAccounts.map(account => ({
          id: account.maTaiKhoan || account.id,
          username: account.tenDangNhap || account.username,
          fullName: account.hoTen || account.fullName,
          email: account.email || account.email,
          phone: account.soDienThoai || account.phone,
          role: account.vaiTro || account.role,
          status: account.trangThai !== false ? 'active' : 'inactive',
          lastLogin: account.lanDangNhapCuoi || account.lastLogin || 'Chưa đăng nhập'
        })));
      }

      setShowEditModal(false);
      setEditingAccount(null);
    } catch (err) {
      console.error('Update account error', err);
      setError('Có lỗi xảy ra khi cập nhật tài khoản');
    }
  };

  const filteredAccounts = accounts.filter(account => {
    const searchLower = searchTerm.toLowerCase();
    const username = (account.username || '').toLowerCase();
    const fullName = (account.fullName || '').toLowerCase();
    const email = (account.email || '').toLowerCase();
    
    return username.includes(searchLower) || 
           fullName.includes(searchLower) || 
           email.includes(searchLower);
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Tài khoản Nhân viên</h1>
          <p className="text-gray-600">Quản lý tài khoản nhân viên và quản trị viên trong hệ thống</p>
        </div>

        {/* Action Bar */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm tài khoản..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
            >
              <IoAdd className="w-5 h-5" />
              Thêm tài khoản
            </button>
          </div>
        </div>

        {/* Accounts Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tài khoản
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thông tin liên hệ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vai trò
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Đăng nhập cuối
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAccounts.map((account) => (
                  <tr key={account.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <IoPerson className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {account.username}
                          </div>
                          <div className="text-sm text-gray-500">
                            {account.fullName}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{account.email}</div>
                      <div className="text-sm text-gray-500">{account.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${account.role === 'Admin' ? 'bg-red-100 text-red-800' :
                        account.role === 'Manager' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                        {account.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${account.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {account.status === 'active' ? 'Hoạt động' : 'Không hoạt động'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {account.lastLogin}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleChangePassword(account)}
                          className="text-primary hover:text-primary/80"
                          title="Đổi mật khẩu"
                        >
                          <IoShield className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEditAccount(account)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Chỉnh sửa"
                        >
                          <IoCreate className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteAccount(account.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Xóa"
                        >
                          <IoTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Account Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Thêm tài khoản mới</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên đăng nhập
                  </label>
                  <input
                    type="text"
                    value={newAccount.username}
                    onChange={(e) => setNewAccount({ ...newAccount, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nhập tên đăng nhập"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={newAccount.fullName}
                    onChange={(e) => setNewAccount({ ...newAccount, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nhập họ và tên"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newAccount.email}
                    onChange={(e) => setNewAccount({ ...newAccount, email: e.target.value })}
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
                    value={newAccount.phone}
                    onChange={(e) => setNewAccount({ ...newAccount, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vai trò
                  </label>
                  <select
                    value={newAccount.role}
                    onChange={(e) => setNewAccount({ ...newAccount, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="STAFF">Nhân viên</option>
                    <option value="MANAGER">Quản lý</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    value={newAccount.password}
                    onChange={(e) => setNewAccount({ ...newAccount, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nhập mật khẩu"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAddAccount}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Thêm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Account Modal */}
        {showEditModal && editingAccount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Chỉnh sửa tài khoản</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tên đăng nhập
                  </label>
                  <input
                    type="text"
                    value={editingAccount.username}
                    onChange={(e) => setEditingAccount({ ...editingAccount, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nhập tên đăng nhập"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={editingAccount.fullName}
                    onChange={(e) => setEditingAccount({ ...editingAccount, fullName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nhập họ và tên"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={editingAccount.email}
                    onChange={(e) => setEditingAccount({ ...editingAccount, email: e.target.value })}
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
                    value={editingAccount.phone}
                    onChange={(e) => setEditingAccount({ ...editingAccount, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nhập số điện thoại"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vai trò
                  </label>
                  <select
                    value={editingAccount.role}
                    onChange={(e) => setEditingAccount({ ...editingAccount, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="STAFF">Nhân viên</option>
                    <option value="MANAGER">Quản lý</option>
                    <option value="ADMIN">Quản trị viên</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={editingAccount.status}
                    onChange={(e) => setEditingAccount({ ...editingAccount, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="inactive">Không hoạt động</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Lưu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">
                Đổi mật khẩu cho {selectedAccount?.username}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mật khẩu mới
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nhập mật khẩu mới"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Xác nhận mật khẩu
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Nhập lại mật khẩu mới"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Đổi mật khẩu
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountManagement;
