import React, { useState, useEffect } from 'react';
import { IoAdd, IoTrashOutline, IoPencilOutline, IoSearch, IoFilterOutline, IoCheckmarkCircle, IoCartOutline, IoCubeOutline, IoPricetagOutline } from 'react-icons/io5';
import Modal from '../../shared/Modal';
import ConfirmDialog from '../../shared/ConfirmDialog';
import Toast from '../../shared/Toast';
import api from '../../../api';

const OrderDetailManagement = () => {
  const [orderDetails, setOrderDetails] = useState([]);
  const [filteredDetails, setFilteredDetails] = useState([]);
  const [orders, setOrders] = useState([]);
  const [productVariants, setProductVariants] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [editingDetail, setEditingDetail] = useState(null);
  const [deletingDetail, setDeletingDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Note: mapping helpers removed as not used in this component

  // Shared fetch function to reload lists
  const fetchAll = async () => {
    try {
      const [ordersData, variantsData, detailsData] = await Promise.all([
        api.get('/api/banhang/donhang').catch(() => []),
        api.get('/api/products/variants').catch(() => []),
        api.get('/api/banhang/chitietdonhang').catch(() => [])
      ]);

      if (Array.isArray(ordersData)) {
        setOrders(ordersData.map(order => ({
          id: order.id || order.maDonHang,
          maDonHang: order.maDonHang || order.soDonHang || order.id,
          maKhachHang: order.khachHang?.maKhachHang || order.customerId || order.maKhachHang || null,
          tenKhachHang: order.khachHang?.hoTen || order.customerName || '',
          ngayDat: order.ngayTao || order.createdAt || '',
          tongTien: order.tongTien || order.total || 0
        })));
      }

      if (Array.isArray(variantsData)) {
        setProductVariants(variantsData.map(variant => ({
          id: variant.maBienThe || variant.id,
          maBienThe: variant.maBienThe || variant.variantCode,
          tenSanPham: variant.sanPham?.tenSanPham || variant.productName || '',
          thuocTinh: variant.thuocTinh || variant.attributes || '',
          gia: variant.gia || variant.price || 0
        })));
      }

      if (Array.isArray(detailsData)) {
        const mapped = detailsData.map(detail => ({
          id: detail.maChiTiet || detail.id,
          maDonHang: detail.donHang?.maDonHang || detail.orderId,
          maBienThe: detail.bienThe?.maBienThe || detail.variantId,
          soLuong: detail.soLuong || detail.quantity || 0,
          donGiaGoc: detail.donGiaGoc || detail.originalPrice || 0,
          donGiaThucTe: detail.donGia || detail.actualPrice || 0,
          donHang: detail.donHang || null,
          bienThe: detail.bienThe || null
        }));
        setOrderDetails(mapped);
        setFilteredDetails(mapped);
      }
    } catch (err) {
      
    }
  };
  const [formData, setFormData] = useState({
    maDonHang: '',
    maBienThe: '',
    soLuong: 1,
    donGiaGoc: '',
    donGiaThucTe: ''
  });
  const [filters, setFilters] = useState({
    searchTerm: '',
    orderCode: '',
    priceRange: 'all',
    quantityRange: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });
  const [selectedOrder, setSelectedOrder] = useState('');

  // Fetch data from APIs
  useEffect(() => {
    setIsLoading(true);
    fetchAll().finally(() => setIsLoading(false));
  }, []);

  // Filter and search functionality
  useEffect(() => {
    let filtered = orderDetails;

    if (selectedOrder) {
      filtered = filtered.filter(detail => detail.maDonHang.toString() === selectedOrder);
    }

    if (filters.searchTerm) {
      filtered = filtered.filter(detail => {
        const productName = detail.bienThe?.tenSanPham || '';
        const variantCode = detail.bienThe?.maBienThe || '';
        const orderCode = detail.donHang?.maDonHang || '';
        return (
          productName.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          variantCode.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
          orderCode.toString().toLowerCase().includes(filters.searchTerm.toLowerCase())
        );
      });
    }

    if (filters.orderCode) {
      filtered = filtered.filter(detail => {
        const orderCode = detail.donHang?.maDonHang || '';
        return orderCode.toString().toLowerCase().includes(filters.orderCode.toLowerCase());
      });
    }

    if (filters.priceRange !== 'all') {
      switch (filters.priceRange) {
        case 'under5m':
          filtered = filtered.filter(detail => detail.donGiaThucTe < 5000000);
          break;
        case '5m-10m':
          filtered = filtered.filter(detail => detail.donGiaThucTe >= 5000000 && detail.donGiaThucTe <= 10000000);
          break;
        case 'over10m':
          filtered = filtered.filter(detail => detail.donGiaThucTe > 10000000);
          break;
        default:
          break;
      }
    }

    if (filters.quantityRange !== 'all') {
      switch (filters.quantityRange) {
        case '1':
          filtered = filtered.filter(detail => detail.soLuong === 1);
          break;
        case '2-5':
          filtered = filtered.filter(detail => detail.soLuong >= 2 && detail.soLuong <= 5);
          break;
        case 'over5':
          filtered = filtered.filter(detail => detail.soLuong > 5);
          break;
        default:
          break;
      }
    }

    setFilteredDetails(filtered);
  }, [orderDetails, filters, selectedOrder]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
  };

  const resetForm = () => {
    setFormData({
      maDonHang: '',
      maBienThe: '',
      soLuong: 1,
      donGiaGoc: '',
      donGiaThucTe: ''
    });
    setEditingDetail(null);
  };

  const handleAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (detail) => {
    setFormData({
      maDonHang: detail.maDonHang.toString(),
      maBienThe: detail.maBienThe.toString(),
      soLuong: detail.soLuong,
      donGiaGoc: detail.donGiaGoc.toString(),
      donGiaThucTe: detail.donGiaThucTe.toString()
    });
    setEditingDetail(detail);
    setShowModal(true);
  };

  const handleDelete = (detail) => {
    setDeletingDetail(detail);
    setShowConfirmDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation
    if (!formData.maDonHang || !formData.maBienThe || !formData.soLuong || !formData.donGiaGoc || !formData.donGiaThucTe) {
      showToast('Vui lòng điền đầy đủ thông tin', 'error');
      return;
    }

    if (formData.soLuong <= 0) {
      showToast('Số lượng phải lớn hơn 0', 'error');
      return;
    }

    if (parseFloat(formData.donGiaGoc) <= 0 || parseFloat(formData.donGiaThucTe) <= 0) {
      showToast('Đơn giá phải lớn hơn 0', 'error');
      return;
    }

    // Check for duplicate (order + variant combination)
    const isDuplicate = orderDetails.some(detail => 
      detail.maDonHang.toString() === formData.maDonHang && 
      detail.maBienThe.toString() === formData.maBienThe &&
      (!editingDetail || detail.id !== editingDetail.id)
    );

    if (isDuplicate) {
      showToast('Sản phẩm này đã có trong đơn hàng', 'error');
      return;
    }

    const selectedOrderData = orders.find(o => o.id.toString() === formData.maDonHang);
    const selectedVariant = productVariants.find(v => v.id.toString() === formData.maBienThe);

    const detailData = {
      id: editingDetail ? editingDetail.id : Date.now(),
      maDonHang: parseInt(formData.maDonHang),
      maBienThe: parseInt(formData.maBienThe),
      soLuong: parseInt(formData.soLuong),
      donGiaGoc: parseFloat(formData.donGiaGoc),
      donGiaThucTe: parseFloat(formData.donGiaThucTe),
      donHang: selectedOrderData,
      bienThe: selectedVariant
    };

    if (editingDetail) {
      setOrderDetails(orderDetails.map(detail => 
        detail.id === editingDetail.id ? detailData : detail
      ));
      showToast('Cập nhật chi tiết đơn hàng thành công');
    } else {
      setOrderDetails([...orderDetails, detailData]);
      showToast('Thêm chi tiết đơn hàng thành công');
    }

    setShowModal(false);
    resetForm();
  };

  const confirmDelete = () => {
    setOrderDetails(orderDetails.filter(detail => detail.id !== deletingDetail.id));
    setShowConfirmDialog(false);
    setDeletingDetail(null);
    showToast('Xóa chi tiết đơn hàng thành công');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const calculateDiscount = (original, actual) => {
    const discount = ((original - actual) / original) * 100;
    return discount > 0 ? discount.toFixed(1) : 0;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Chi tiết Đơn hàng</h1>
        <p className="text-gray-600">Quản lý các sản phẩm trong từng đơn hàng</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100">Tổng chi tiết</p>
              <p className="text-3xl font-bold">{orderDetails.length}</p>
            </div>
            <IoCartOutline className="text-4xl text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100">Tổng số lượng</p>
              <p className="text-3xl font-bold">
                {orderDetails.reduce((total, detail) => total + detail.soLuong, 0)}
              </p>
            </div>
            <IoCubeOutline className="text-4xl text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100">Tổng giá trị</p>
              <p className="text-xl font-bold">
                {formatCurrency(orderDetails.reduce((total, detail) => 
                  total + (detail.donGiaThucTe * detail.soLuong), 0
                ))}
              </p>
            </div>
            <IoPricetagOutline className="text-4xl text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100">Đơn hàng có sản phẩm</p>
              <p className="text-3xl font-bold">
                {new Set(orderDetails.map(detail => detail.maDonHang)).size}
              </p>
            </div>
            <IoCheckmarkCircle className="text-4xl text-orange-200" />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Order Selection */}
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Đơn hàng:</label>
            <select
              value={selectedOrder}
              onChange={(e) => setSelectedOrder(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Tất cả đơn hàng</option>
              {orders.map(order => (
                <option key={order.id} value={order.maDonHang}>
                  {order.maDonHang} - {order.tenKhachHang}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm, mã biến thể..."
                value={filters.searchTerm}
                onChange={(e) => setFilters({...filters, searchTerm: e.target.value})}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              <IoFilterOutline />
              Bộ lọc
            </button>

            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <IoAdd />
              Thêm chi tiết
            </button>

            <button
              disabled={!selectedOrder || completing}
              onClick={async () => {
                if (!selectedOrder) return;
                const order = orders.find(o => (o.maDonHang?.toString() || '') === selectedOrder);
                if (!order) {
                  showToast('Không tìm thấy đơn hàng đã chọn', 'error');
                  return;
                }
                const customerId = order.maKhachHang || order.customerId || order.khachHang?.maKhachHang ||
                  orderDetails.find(d => d.maDonHang?.toString() === selectedOrder)?.donHang?.khachHang?.maKhachHang;
                if (!customerId) {
                  showToast('Đơn hàng không có khách hàng. Không thể hoàn thành.', 'error');
                  return;
                }
                try {
                  setCompleting(true);
                  await api.post(`/api/v1/khach-hang/${customerId}/don-hang/${order.maDonHang}/xac-nhan-nhan-hang`);
                  showToast('Đã hoàn thành đơn hàng và cập nhật khách hàng');
                  await fetchAll();
                } catch (e) {
                  showToast('Hoàn thành đơn thất bại', 'error');
                } finally {
                  setCompleting(false);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${(!selectedOrder || completing) ? 'bg-gray-300 text-gray-600 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
            >
              <IoCheckmarkCircle />
              {completing ? 'Đang hoàn thành...' : 'Hoàn thành đơn'}
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mã đơn hàng</label>
                <input
                  type="text"
                  placeholder="Nhập mã đơn hàng"
                  value={filters.orderCode}
                  onChange={(e) => setFilters({...filters, orderCode: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Khoảng giá</label>
                <select
                  value={filters.priceRange}
                  onChange={(e) => setFilters({...filters, priceRange: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả</option>
                  <option value="under5m">Dưới 5 triệu</option>
                  <option value="5m-10m">5 - 10 triệu</option>
                  <option value="over10m">Trên 10 triệu</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng</label>
                <select
                  value={filters.quantityRange}
                  onChange={(e) => setFilters({...filters, quantityRange: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Tất cả</option>
                  <option value="1">1 sản phẩm</option>
                  <option value="2-5">2-5 sản phẩm</option>
                  <option value="over5">Trên 5 sản phẩm</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Details Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đơn hàng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sản phẩm
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Biến thể
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Số lượng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đơn giá gốc
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Đơn giá thực tế
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thành tiền
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDetails.map((detail) => {
                const discount = calculateDiscount(detail.donGiaGoc, detail.donGiaThucTe);
                const totalAmount = detail.donGiaThucTe * detail.soLuong;

                return (
                  <tr key={detail.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {detail.donHang?.maDonHang || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {detail.donHang?.tenKhachHang || 'Khách lẻ'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {detail.bienThe?.tenSanPham || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {detail.bienThe?.maBienThe || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {detail.bienThe?.thuocTinh || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">
                          {detail.soLuong}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(detail.donGiaGoc)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(detail.donGiaThucTe)}
                      </div>
                      {discount > 0 && (
                        <div className="text-xs text-red-500">
                          Giảm {discount}%
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-blue-600">
                        {formatCurrency(totalAmount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(detail)}
                          className="text-blue-600 hover:text-blue-900 p-1 rounded"
                          title="Chỉnh sửa"
                        >
                          <IoPencilOutline className="text-lg" />
                        </button>
                        <button
                          onClick={() => handleDelete(detail)}
                          className="text-red-600 hover:text-red-900 p-1 rounded"
                          title="Xóa"
                        >
                          <IoTrashOutline className="text-lg" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredDetails.length === 0 && (
          <div className="text-center py-12">
            <IoCartOutline className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có chi tiết đơn hàng</h3>
            <p className="text-gray-500">
              {selectedOrder ? 'Đơn hàng này chưa có sản phẩm nào' : 'Chưa có chi tiết đơn hàng nào được tạo'}
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingDetail ? 'Chỉnh sửa chi tiết đơn hàng' : 'Thêm chi tiết đơn hàng'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đơn hàng <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.maDonHang}
                onChange={(e) => setFormData({...formData, maDonHang: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Chọn đơn hàng</option>
                {orders.map(order => (
                  <option key={order.id} value={order.id}>
                    {order.maDonHang} - {order.tenKhachHang}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Biến thể sản phẩm <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.maBienThe}
                onChange={(e) => {
                  const selectedVariant = productVariants.find(v => v.id.toString() === e.target.value);
                  setFormData({
                    ...formData, 
                    maBienThe: e.target.value,
                    donGiaGoc: selectedVariant ? selectedVariant.gia.toString() : '',
                    donGiaThucTe: selectedVariant ? selectedVariant.gia.toString() : ''
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Chọn biến thể</option>
                {productVariants.map(variant => (
                  <option key={variant.id} value={variant.id}>
                    {variant.tenSanPham} - {variant.thuocTinh}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số lượng <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={formData.soLuong}
              onChange={(e) => setFormData({...formData, soLuong: parseInt(e.target.value) || 1})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đơn giá gốc <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.donGiaGoc}
                onChange={(e) => setFormData({...formData, donGiaGoc: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập đơn giá gốc"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Đơn giá thực tế <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.donGiaThucTe}
                onChange={(e) => setFormData({...formData, donGiaThucTe: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nhập đơn giá thực tế"
                required
              />
            </div>
          </div>

          {formData.donGiaGoc && formData.donGiaThucTe && parseFloat(formData.donGiaGoc) > parseFloat(formData.donGiaThucTe) && (
            <div className="p-3 bg-green-50 rounded-md">
              <div className="text-sm text-green-800">
                <strong>Giảm giá:</strong> {calculateDiscount(parseFloat(formData.donGiaGoc), parseFloat(formData.donGiaThucTe))}%
              </div>
              <div className="text-sm text-green-600">
                Tiết kiệm: {formatCurrency(parseFloat(formData.donGiaGoc) - parseFloat(formData.donGiaThucTe))}
              </div>
            </div>
          )}

          {formData.donGiaThucTe && formData.soLuong && (
            <div className="p-3 bg-blue-50 rounded-md">
              <div className="text-sm text-blue-800">
                <strong>Thành tiền:</strong> {formatCurrency(parseFloat(formData.donGiaThucTe) * formData.soLuong)}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {editingDetail ? 'Cập nhật' : 'Thêm'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmDelete}
        title="Xóa chi tiết đơn hàng"
        message={deletingDetail ? `Bạn có chắc chắn muốn xóa sản phẩm "${deletingDetail.bienThe?.tenSanPham || 'N/A'}" khỏi đơn hàng "${deletingDetail.donHang?.maDonHang || 'N/A'}"?` : 'Bạn có chắc chắn muốn xóa?'}
      />

      {/* Toast */}
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ show: false, message: '', type: '' })}
      />
    </div>
  );
};

export default OrderDetailManagement;

