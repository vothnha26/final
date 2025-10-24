import React, { useState, useEffect } from 'react';
import { IoEye } from 'react-icons/io5';
import Modal from '../../shared/Modal';
import api from '../../../api';

const EmailCampaign = () => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipients, setRecipients] = useState('all'); // all | customers | vip | manual
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  // Danh sách khách hàng cho chế độ thủ công
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [selectedEmails, setSelectedEmails] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  // Lọc theo hạng thành viên
  const [tiers, setTiers] = useState([]); // [{maHangThanhVien, tenHang, mauSac, ...}]
  const [selectedTierId, setSelectedTierId] = useState('all'); // 'all' | <id>
  const [loading, setLoading] = useState(false);

  // Modal xem chi tiết khách hàng
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState(null);

  // Fetch danh sách khách hàng khi chọn "Danh sách thủ công"
  useEffect(() => {
    if (recipients === 'manual') {
      fetchCustomers();
      // Chỉ fetch tiers nếu chưa có
      if (!tiers || tiers.length === 0) fetchTiers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipients]);

  // Filter khách hàng theo search và filter type
  useEffect(() => {
    let filtered = customers;

    // Filter theo hạng thành viên
    if (selectedTierId !== 'all') {
      filtered = filtered.filter(c => {
        const tierId = c?.hangThanhVien?.maHangThanhVien;
        // selectedTierId là string khi select, convert về number để so sánh an toàn
        return String(tierId) === String(selectedTierId);
      });
    }

    // Search theo tên, email, sdt
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.hoTen?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.soDienThoai?.includes(term)
      );
    }

    // Sắp xếp theo thứ tự hạng thành viên (tiers đã được sort theo diemToiThieu)
    if (tiers && tiers.length > 0) {
      const tierOrder = new Map(tiers.map((t, idx) => [String(t.maHangThanhVien), idx]));
      filtered = [...filtered].sort((a, b) => {
        const aId = String(a?.hangThanhVien?.maHangThanhVien ?? '');
        const bId = String(b?.hangThanhVien?.maHangThanhVien ?? '');
        const aOrder = tierOrder.has(aId) ? tierOrder.get(aId) : Number.MAX_SAFE_INTEGER;
        const bOrder = tierOrder.has(bId) ? tierOrder.get(bId) : Number.MAX_SAFE_INTEGER;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return (a?.hoTen || '').localeCompare(b?.hoTen || '');
      });
    }

    setFilteredCustomers(filtered);
  }, [customers, selectedTierId, searchTerm, tiers]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/khach-hang');
      
        // api.js trả về data trực tiếp (không có .data wrapper)
      let data = [];
        if (Array.isArray(res)) {
          // Response chính là array
          data = res;
        } else if (res?.data && Array.isArray(res.data)) {
          // Response có property data là array
          data = res.data;
        } else {
          console.error('[EmailCampaign] Unexpected response format:', res);
      }
      
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (e) {
      console.error('[EmailCampaign] Lỗi khi tải danh sách khách hàng:', e);
        console.error('[EmailCampaign] Error data:', e.data);
        alert('Không thể tải danh sách khách hàng: ' + (e.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchTiers = async () => {
    try {
      const res = await api.get('/api/hang-thanh-vien/all');
      const list = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : []);
      // Sắp xếp theo điểm tối thiểu nếu có, fallback theo tên
      const sorted = [...list].sort((a, b) => {
        const da = a?.diemToiThieu ?? 0;
        const db = b?.diemToiThieu ?? 0;
        if (da !== db) return da - db;
        return (a?.tenHang || '').localeCompare(b?.tenHang || '');
      });
      setTiers(sorted);
    } catch (e) {
      console.error('[EmailCampaign] Lỗi khi tải hạng thành viên:', e);
    }
  };

  const toggleSelectEmail = (email) => {
    if (selectedEmails.includes(email)) {
      setSelectedEmails(selectedEmails.filter(e => e !== email));
    } else {
      setSelectedEmails([...selectedEmails, email]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedEmails.length === filteredCustomers.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(filteredCustomers.map(c => c.email));
    }
  };

  const sendNow = async () => {
    setSending(true);
    setResult(null);
    try {
      const payload = {
        subject,
        body,
        recipients,
        manualList: recipients === 'manual' ? selectedEmails : []
      };
      
      const endpoint = '/api/admin/emails/send';
      const res = await api.post(endpoint, { body: payload });
      
      setResult({ ok: true, data: res });
      
      // Reset selected emails sau khi gửi thành công
      if (recipients === 'manual') {
        setSelectedEmails([]);
      }
    } catch (e) {
      console.error('[EmailCampaign] Error sending email:', e);
      console.error('[EmailCampaign] Error data:', e?.data);
      
      const errorMessage = e?.data?.message || e?.message || 'Lỗi không xác định';
      setResult({ ok: false, error: { message: errorMessage } });
    } finally {
      setSending(false);
    }
  };

  // Helpers
  const formatCurrency = (amount) => {
    if (amount == null || isNaN(amount)) return '—';
    try {
      return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    } catch (e) {
      return String(amount);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? String(dateStr) : d.toLocaleDateString('vi-VN');
  };

  const openDetail = async (e, customer) => {
    e.stopPropagation();
    setShowDetailModal(true);
    setDetailLoading(true);
    setDetailCustomer(null);
    try {
      const res = await api.get(`/api/v1/khach-hang/${customer.maKhachHang}`);
      const data = Array.isArray(res) ? res[0] : (res?.data ?? res);
      setDetailCustomer(data || customer);
    } catch (err) {
      console.error('[EmailCampaign] Lỗi khi tải chi tiết khách hàng:', err);
      // Fallback hiển thị dữ liệu tối thiểu đã có
      setDetailCustomer(customer);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto bg-white p-6 rounded-md shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Gửi email tới khách hàng</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Tiêu đề</label>
          <input 
            value={subject} 
            onChange={(e) => setSubject(e.target.value)} 
            className="mt-1 block w-full border rounded px-3 py-2" 
            placeholder="Nhập tiêu đề email..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Nội dung</label>
          <textarea 
            value={body} 
            onChange={(e) => setBody(e.target.value)} 
            rows={6} 
            className="mt-1 block w-full border rounded px-3 py-2" 
            placeholder="Nhập nội dung email..."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Người nhận</label>
          <select 
            value={recipients} 
            onChange={(e) => setRecipients(e.target.value)} 
            className="mt-1 block w-64 border rounded px-3 py-2"
          >
            <option value="all">Tất cả khách hàng</option>
            <option value="customers">Khách hàng đã mua hàng</option>
            <option value="vip">Khách hàng VIP</option>
            <option value="manual">Chọn thủ công từ danh sách</option>
          </select>
        </div>

        {recipients === 'manual' && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Chọn khách hàng ({selectedEmails.length} đã chọn)
              </h3>
              <button
                onClick={toggleSelectAll}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                {selectedEmails.length === filteredCustomers.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              </button>
            </div>

            {/* Bộ lọc và tìm kiếm */}
            <div className="flex gap-3 mb-3">
              <input
                type="text"
                placeholder="Tìm theo tên, email, số điện thoại..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 border rounded px-3 py-2 text-sm"
              />
              {/* Bộ lọc theo hạng thành viên */}
              <select
                value={selectedTierId}
                onChange={(e) => setSelectedTierId(e.target.value)}
                className="border rounded px-3 py-2 text-sm min-w-[220px]"
                title="Lọc theo hạng thành viên"
              >
                <option value="all">Tất cả hạng thành viên</option>
                {tiers.map(t => (
                  <option key={t.maHangThanhVien} value={t.maHangThanhVien}>
                    {t.tenHang}
                  </option>
                ))}
              </select>
            </div>

            {/* Bảng danh sách khách hàng */}
            {loading ? (
              <div className="text-center py-8 text-gray-500">Đang tải...</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Không có khách hàng nào</div>
            ) : (
              <div className="max-h-96 overflow-y-auto border rounded">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">
                        <input
                          type="checkbox"
                          checked={selectedEmails.length === filteredCustomers.length && filteredCustomers.length > 0}
                          onChange={toggleSelectAll}
                          className="rounded"
                        />
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Họ tên</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Email</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">SĐT</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase">Hạng</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredCustomers.map((customer) => (
                      <tr 
                        key={customer.maKhachHang} 
                        className={`hover:bg-gray-50 cursor-pointer ${selectedEmails.includes(customer.email) ? 'bg-orange-50' : ''}`}
                        onClick={() => toggleSelectEmail(customer.email)}
                      >
                        <td className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={selectedEmails.includes(customer.email)}
                            onChange={() => toggleSelectEmail(customer.email)}
                            className="rounded"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900">{customer.hoTen}</td>
                        <td className="px-3 py-2 text-sm text-gray-600">{customer.email}</td>
                        <td className="px-3 py-2 text-sm text-gray-600">{customer.soDienThoai}</td>
                        <td className="px-3 py-2 text-sm">
                          {customer?.hangThanhVien ? (
                            <span
                              className="px-2 py-1 text-xs font-semibold rounded-full"
                              style={{
                                backgroundColor: (customer.hangThanhVien.mauSac || '#f3f4f6') + '22',
                                color: customer.hangThanhVien.mauSac || '#374151',
                                border: `1px solid ${customer.hangThanhVien.mauSac || '#e5e7eb'}`
                              }}
                            >
                              {customer.hangThanhVien.tenHang}
                            </span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-sm">
                          <div className="flex justify-end">
                            <button
                              onClick={(e) => openDetail(e, customer)}
                              className="text-blue-600 hover:text-blue-800"
                              title="Xem chi tiết"
                            >
                              <IoEye className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button 
            onClick={sendNow} 
            disabled={sending || !subject || !body || (recipients === 'manual' && selectedEmails.length === 0)} 
            className="px-4 py-2 bg-orange-600 text-white rounded disabled:opacity-60 disabled:cursor-not-allowed hover:bg-orange-700"
          >
            {sending ? 'Đang gửi...' : 'Gửi ngay'}
          </button>
          {recipients === 'manual' && selectedEmails.length > 0 && (
            <span className="text-sm text-gray-600">
              Sẽ gửi đến {selectedEmails.length} khách hàng
            </span>
          )}
        </div>

        {result && (
          <div className={`p-3 rounded ${result.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {result.ok ? (
              <div>
                <strong>✓ Gửi thành công!</strong>
                <div className="text-sm mt-1">
                  {result.data?.message || `Đã gửi ${result.data?.totalSent || 0} email`}
                </div>
              </div>
            ) : (
              <div>
                <strong>✗ Lỗi gửi:</strong>
                <div className="text-sm mt-1">{result.error?.message || JSON.stringify(result.error)}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal chi tiết khách hàng */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setDetailCustomer(null);
        }}
        title="Chi tiết khách hàng"
        size="lg"
      >
        {detailLoading ? (
          <div className="py-10 text-center text-gray-500">Đang tải chi tiết...</div>
        ) : !detailCustomer ? (
          <div className="py-6 text-center text-gray-500">Không có dữ liệu khách hàng</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-500">Mã khách hàng</div>
                <div className="font-medium text-gray-900">{detailCustomer.maKhachHang}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Ngày tham gia</div>
                <div className="text-gray-900">{formatDate(detailCustomer.ngayThamGia)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Họ tên</div>
                <div className="font-medium text-gray-900">{detailCustomer.hoTen || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Email</div>
                <div className="text-gray-900">{detailCustomer.email || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Số điện thoại</div>
                <div className="text-gray-900">{detailCustomer.soDienThoai || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Ngày sinh</div>
                <div className="text-gray-900">{formatDate(detailCustomer.ngaySinh)}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-xs text-gray-500">Địa chỉ</div>
                <div className="text-gray-900">{detailCustomer.diaChi || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Điểm thưởng</div>
                <div className="text-gray-900">{detailCustomer.diemThuong ?? '—'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Hạng thành viên</div>
                <div>
                  {detailCustomer?.hangThanhVien ? (
                    <span
                      className="px-2 py-1 text-xs font-semibold rounded-full"
                      style={{
                        backgroundColor: (detailCustomer.hangThanhVien.mauSac || '#f3f4f6') + '22',
                        color: detailCustomer.hangThanhVien.mauSac || '#374151',
                        border: `1px solid ${detailCustomer.hangThanhVien.mauSac || '#e5e7eb'}`
                      }}
                    >
                      {detailCustomer.hangThanhVien.tenHang}
                    </span>
                  ) : (
                    '—'
                  )}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Tổng đơn hàng</div>
                <div className="text-gray-900">{detailCustomer.tongDonHang ?? '—'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Tổng chi tiêu</div>
                <div className="text-gray-900">{formatCurrency(detailCustomer.tongChiTieu)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Đơn hàng cuối</div>
                <div className="text-gray-900">{detailCustomer.donHangCuoi || '—'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500">Trạng thái VIP</div>
                <div className="text-gray-900">{detailCustomer.trangThaiVip ? 'VIP' : '—'}</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EmailCampaign;
