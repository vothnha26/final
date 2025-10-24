import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../api';
import { IoTrash } from 'react-icons/io5';

const ImageManagement = ({ productId: propProductId }) => {
  const [productId, setProductId] = useState(propProductId || null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newIsMain, setNewIsMain] = useState(false);

  useEffect(() => {
    if (propProductId) setProductId(propProductId);
  }, [propProductId]);

  const fetchImagesCb = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const data = await api.get(`/api/products/${productId}/images`);
      setImages(Array.isArray(data) ? data : []);
    } catch (e) {
      setImages([]);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchImagesCb();
  }, [fetchImagesCb]);


  const handleAdd = async () => {
    if (!productId || !newImageUrl) return alert('Cần URL và productId');
    try {
      const payload = { duongDanHinhAnh: newImageUrl, thuTu: images.length, laAnhChinh: newIsMain, moTa: '' };
      const created = await api.post(`/api/products/${productId}/images`, { body: payload });
      setImages(prev => [...prev, created]);
      setNewImageUrl('');
      setNewIsMain(false);
    } catch (err) {
      alert('Lỗi khi thêm hình ảnh: ' + (err.message || err));
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa hình ảnh?')) return;
    try {
      await api.del(`/api/images/${id}`);
      setImages(prev => prev.filter(i => i.maHinhAnh !== id));
    } catch (e) {
      alert('Lỗi khi xóa');
    }
  };

  if (!productId) return (
    <div className="p-6">
      <p>Vui lòng chọn sản phẩm để quản lý hình ảnh (productId không được cung cấp).</p>
    </div>
  );

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Quản lý hình ảnh - Sản phẩm #{productId}</h2>

      <div className="mb-4 flex gap-2">
        <input value={newImageUrl} onChange={e => setNewImageUrl(e.target.value)} placeholder="URL hình ảnh" className="flex-1 px-3 py-2 border rounded" />
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={newIsMain} onChange={e => setNewIsMain(e.target.checked)} /> Ảnh chính
        </label>
        <button onClick={handleAdd} className="px-4 py-2 bg-primary text-white rounded">Thêm</button>
      </div>

      {loading ? (
        <div>Đang tải...</div>
      ) : images.length === 0 ? (
        <div>Chưa có hình ảnh</div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {images.map(img => (
            <div key={img.maHinhAnh} className="border rounded p-2 flex flex-col">
              <img src={img.duongDanHinhAnh} alt={img.moTa || ''} className="h-40 object-cover mb-2 rounded" />
              <div className="text-sm text-gray-600 mb-2">Thứ tự: {img.thuTu}</div>
              <div className="flex items-center justify-between">
                <div className={`text-xs ${img.laAnhChinh ? 'text-green-600' : 'text-gray-600'}`}>{img.laAnhChinh ? 'Ảnh chính' : 'Ảnh phụ'}</div>
                <div className="flex gap-2">
                  <button onClick={() => handleDelete(img.maHinhAnh)} className="text-red-600"><IoTrash /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageManagement;
