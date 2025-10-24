import React, { useState } from 'react';
import api from '../../../api';

const AdminCreateOrder = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState([]); // {maBienThe, sku, tenSanPham, giaBan, soLuong}
  const [creating, setCreating] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [address, setAddress] = useState('');

  const handleSearch = async () => {
    if (!query) return;
    try {
      const res = await api.get(`/api/v1/admin/san-pham/search?q=${encodeURIComponent(query)}`);
      setResults(res || []);
    } catch (err) {
      setResults([]);
    }
  };

  const addVariant = (v) => {
    setSelected(prev => [...prev, { maBienThe: v.maBienThe, sku: v.sku, tenSanPham: v.tenSanPham, giaBan: v.giaBan, soLuong: 1 }]);
  };

  const updateQty = (idx, qty) => {
    setSelected(prev => prev.map((it, i) => i === idx ? { ...it, soLuong: Number(qty) } : it));
  };

  const removeIdx = (idx) => setSelected(prev => prev.filter((_, i) => i !== idx));

  const createOrder = async () => {
    if (!selected.length) return alert('Chưa chọn sản phẩm');
    setCreating(true);
    try {
      const payload = {
  maKhachHang: customerId ? Number(customerId) : null,
        chiTietDonHangList: selected.map(s => ({ maBienThe: s.maBienThe, soLuong: s.soLuong })),
        phuongThucThanhToan: paymentMethod,
        tenNguoiNhan: 'Khách lẻ',
        soDienThoaiNhan: '0000000000',
        diaChiGiaoHang: address || 'Địa chỉ admin tạo'
      };
      const created = await api.post('/api/v1/admin/don-hang', payload);
      alert('Đã tạo đơn: ' + (created?.maDonHang || JSON.stringify(created)));
      setSelected([]);
      setResults([]);
      setQuery('');
    } catch (err) {
      alert('Tạo đơn lỗi: ' + (err?.data?.message || err.message));
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-3">Tạo đơn (Admin)</h2>
      <div className="flex gap-2 mb-3">
        <input className="border p-2 flex-1" placeholder="Tìm theo mã biến thể (sku) hoặc tên sản phẩm" value={query} onChange={e => setQuery(e.target.value)} />
        <button onClick={handleSearch} className="px-3 bg-blue-600 text-white rounded">Tìm</button>
      </div>

      <div className="mb-4">
        {results.map((r, idx) => (
          <div key={r.maBienThe} className="p-2 border-b flex justify-between items-center">
            <div>
              <div className="font-medium">{r.tenSanPham} ({r.sku})</div>
              <div className="text-sm text-gray-500">Giá: {r.giaBan} - Tồn: {r.soLuongTon}</div>
            </div>
            <button className="px-3 bg-green-600 text-white rounded" onClick={() => addVariant(r)}>Thêm</button>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <h3 className="font-medium mb-2">Sản phẩm đã chọn</h3>
        {selected.map((s, idx) => (
          <div key={s.maBienThe+"-"+idx} className="flex gap-2 items-center mb-2">
            <div className="flex-1">{s.tenSanPham} ({s.sku})</div>
            <input type="number" value={s.soLuong} min={1} onChange={e => updateQty(idx, e.target.value)} className="w-20 border p-1" />
            <button className="px-2 bg-red-500 text-white rounded" onClick={() => removeIdx(idx)}>X</button>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <label className="block mb-1">Mã khách hàng</label>
        <input value={customerId} onChange={e => setCustomerId(e.target.value)} className="border p-2 w-40" />
      </div>
      <div className="mb-4">
        <label className="block mb-1">Phương thức thanh toán</label>
        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="border p-2 w-40">
          <option value="CASH">Tiền mặt</option>
          <option value="CARD">Thẻ</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-1">Địa chỉ giao (tùy chọn)</label>
        <input value={address} onChange={e => setAddress(e.target.value)} className="border p-2 w-full" />
      </div>

      <div>
        <button onClick={createOrder} disabled={creating} className="px-4 py-2 bg-primary text-white rounded">
          {creating ? 'Đang tạo...' : 'Tạo đơn' }
        </button>
      </div>
    </div>
  );
};

export default AdminCreateOrder;
