import React, { useState, useEffect } from 'react';
import { IoSearch, IoEye, IoCreate, IoTrash, IoReceipt, IoTime, IoCheckmark, IoClose, IoPrint, IoDownload } from 'react-icons/io5';
import api from '../../../api';

// We'll fetch real product variants from the backend when needed

// Move mapping functions outside component to avoid re-creation
const mapOrderStatus = (status) => {
    if (!status) return 'pending';
    const s = status.toUpperCase();
    // Map backend status codes to frontend display codes
    if (s === 'CHO_XU_LY' || s === 'CHO_XAC_NHAN' || s === 'PENDING') return 'pending';
    if (s === 'XAC_NHAN' || s === 'CONFIRMED') return 'confirmed';
    if (s === 'DANG_CHUAN_BI' || s === 'PROCESSING') return 'processing';
    if (s === 'DANG_GIAO_HANG' || s === 'DANG_GIAO' || s === 'SHIPPING' || s === 'SHIPPED') return 'shipping';
    if (s === 'HOAN_THANH' || s === 'COMPLETED') return 'completed';
    if (s === 'DA_HUY' || s === 'HUY_BO' || s === 'CANCELLED') return 'cancelled';
    return 'pending';
};

const mapOrderFromApi = (order) => ({
    id: order.maDonHang || order.id,
    orderNumber: `ORD-${order.maDonHang || Date.now()}`,
    customerName: order.tenKhachHang || 'N/A',
    customerPhone: order.soDienThoaiKhachHang || order.soDienThoai || 'N/A',
    customerEmail: order.emailKhachHang || order.email || 'N/A',
    items: order.chiTietDonHangList?.map(item => ({
        id: item.maChiTiet || item.id,
        name: item.tenSanPham || 'Sản phẩm',
        quantity: item.soLuong || 0,
        price: item.donGia || 0
    })) || [],
    subtotal: order.tongTienGoc || 0,
    discount: (order.giamGiaVoucher || 0) + (order.giamGiaDiemThuong || 0) + (order.giamGiaVip || 0),
    total: order.thanhTien || 0,
    status: mapOrderStatus(order.trangThai || 'pending'),
    paymentMethod: order.phuongThucThanhToan || 'cash',
    paymentStatus: order.trangThaiThanhToan || 'unpaid',
    shippingAddress: order.diaChiGiaoHang || 'N/A',
    createdAt: order.ngayDatHang ? new Date(order.ngayDatHang).toLocaleString('vi-VN') : 'N/A',
    updatedAt: order.ngayCapNhat ? new Date(order.ngayCapNhat).toLocaleString('vi-VN') : 'N/A',
    notes: order.ghiChu || '',
    // Loyalty points
    loyaltyPointsUsed: order.diemThuongSuDung || 0,
    loyaltyPointsEarned: order.diemThuongNhanDuoc || 0
});

const OrderManagement = () => {
    // FIX 1: Thêm state orders bị thiếu
    const [orders, setOrders] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [newOrder, setNewOrder] = useState({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        // start with empty items and compute totals as items are added
        items: [],
        subtotal: 0,
        discount: 0,
        total: 0,
        status: 'pending',
        paymentMethod: 'cash',
        paymentStatus: 'unpaid',
        shippingAddress: '',
        notes: ''
    });

    // Variants for add-order UI
    const [variants, setVariants] = useState([]);
    const [selectedVariantId, setSelectedVariantId] = useState('');
    const [selectedQuantity, setSelectedQuantity] = useState(1);

    const [showOrderDetailModal, setShowOrderDetailModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedPaymentStatus, setSelectedPaymentStatus] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [newStatus, setNewStatus] = useState('');

    // --- MAPPING LOGIC (functions moved outside component to avoid re-creation) ---

    const mapOrderToApi = (order) => ({
        // Giả định bạn đã có logic lấy maKhachHang, nếu không, bạn cần thêm nó vào UI
        maKhachHang: order.customerId || undefined,
        phuongThucThanhToan: order.paymentMethod,
        trangThai: order.status,
        ghiChu: order.notes,
        diaChiGiaoHang: order.shippingAddress,
        chiTietDonHangList: order.items.map(item => ({
            // Giả định bạn đã có logic lấy maBienThe, nếu không, bạn cần thêm nó vào UI
            maBienThe: item.variantId || undefined,
            soLuong: item.quantity,
            donGia: item.price
        })),
        // Thêm các trường này nếu API backend của bạn yêu cầu trực tiếp
        tongTien: order.total,
        giamGia: order.discount,
        tongTienSauGiam: order.total
    });

    // --- SIDE EFFECTS & API CALLS ---

    // Fetch orders
    useEffect(() => {
        const fetchOrders = async () => {
            setIsLoading(true);
            try {
                // Giả định api.get('/api/banhang/donhang') trả về một object có property 'data' hoặc trực tiếp là mảng
                const response = await api.get('/api/banhang/donhang');
                const data = response.data || response;

                if (Array.isArray(data)) {
                    setOrders(data.map(mapOrderFromApi));
                } else {
                    // Xử lý trường hợp API trả về object rỗng hoặc định dạng không mong muốn
                    setOrders([]);
                }
            } catch (err) {
                alert('Không thể tải danh sách đơn hàng. Kiểm tra console để biết chi tiết.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrders();
    }, []);

    // Fetch variants when add modal opens so staff can pick real products
    useEffect(() => {
        if (!showAddModal) return;
        const fetchVariants = async () => {
            try {
                // try a sensible endpoint; adapt if your backend uses a different path
                const res = await api.get('/api/bien-the-san-pham');
                const data = res.data || res;
                if (Array.isArray(data)) setVariants(data);
                else setVariants([]);
            } catch (err) {
                setVariants([]);
            }
        };
        fetchVariants();
    }, [showAddModal]);

    // --- HANDLERS ---

    const handleAddOrder = async () => {
        if (!newOrder.customerName || !newOrder.customerPhone || newOrder.items.length === 0) {
            alert('Vui lòng nhập đầy đủ Tên, Số điện thoại và ít nhất 1 sản phẩm.');
            return;
        }

        try {
            setIsLoading(true);
            const orderData = mapOrderToApi(newOrder);
            const response = await api.post('/api/banhang/donhang', orderData);

            const savedOrder = mapOrderFromApi(response.data || response);

            setOrders([savedOrder, ...orders]);
            // Reset form
            setNewOrder({
                customerName: '',
                customerPhone: '',
                customerEmail: '',
                items: [],
                subtotal: 0,
                discount: 0,
                total: 0,
                status: 'pending',
                paymentMethod: 'cash',
                paymentStatus: 'unpaid',
                shippingAddress: '',
                notes: ''
            });
            setSelectedVariantId('');
            setSelectedQuantity(1);
            setShowAddModal(false);
        } catch (err) {
            alert('Lỗi khi tạo đơn hàng. Kiểm tra console để biết chi tiết.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteOrder = async (id) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa đơn hàng này? Thao tác này không thể hoàn tác.')) {
            try {
                // DELETE API call
                await api.delete(`/api/banhang/donhang/${id}`);
                // Optimistic UI update
                setOrders(orders.filter(order => order.id !== id));
            } catch (err) {
                alert('Lỗi khi xóa đơn hàng. Kiểm tra console để biết chi tiết.');
            }
        }
    };

    const handleUpdateStatus = async (orderId, status) => {
        if (!status) {
            alert('Vui lòng chọn trạng thái mới.');
            return;
        }
        try {
            // PUT API call
            await api.put(`/api/banhang/donhang/${orderId}/trangthai`, { trangThai: status });
            setOrders(orders.map(order =>
                order.id === orderId
                    ? { ...order, status: status, updatedAt: new Date().toLocaleString('vi-VN') }
                    : order
            ));
            setShowStatusModal(false);
            setNewStatus('');
            setSelectedOrder(null);
        } catch (err) {
            alert('Lỗi khi cập nhật trạng thái đơn hàng. Kiểm tra console để biết chi tiết.');
        }
    };

    const handleViewOrder = (order) => {
        setSelectedOrder(order);
        setShowOrderDetailModal(true);
    };

    const handlePrintOrder = (order) => {
        alert(`Chuẩn bị in đơn hàng ${order.orderNumber}`);
    };

    const handleExportOrder = (order) => {
        alert(`Đang xuất file đơn hàng ${order.orderNumber}`);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'processing': return 'bg-blue-100 text-blue-800';
            case 'shipped': return 'bg-purple-100 text-purple-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'pending': return 'Chờ xử lý';
            case 'processing': return 'Đang xử lý';
            case 'shipped': return 'Đã giao hàng';
            case 'completed': return 'Hoàn thành';
            case 'cancelled': return 'Đã hủy';
            default: return 'Không xác định';
        }
    };

    const getPaymentStatusColor = (status) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-800';
            case 'unpaid': return 'bg-red-100 text-red-800';
            case 'partial': return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPaymentStatusText = (status) => {
        switch (status) {
            case 'paid': return 'Đã thanh toán';
            case 'unpaid': return 'Chưa thanh toán';
            case 'partial': return 'Thanh toán một phần';
            default: return 'Không xác định';
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customerPhone.includes(searchTerm) ||
            order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
        const matchesPaymentStatus = selectedPaymentStatus === 'all' || order.paymentStatus === selectedPaymentStatus;
        return matchesSearch && matchesStatus && matchesPaymentStatus;
    });

    const onAddOrderSubmit = (e) => {
        e.preventDefault();
        handleAddOrder();
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý Đơn hàng</h1>
                    <p className="text-gray-600">Theo dõi và quản lý tất cả đơn hàng</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <IoReceipt className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Tổng đơn hàng</p>
                                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <IoTime className="w-6 h-6 text-yellow-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Chờ xử lý</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {orders.filter(o => o.status === 'pending').length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <IoCreate className="w-6 h-6 text-blue-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Đang xử lý</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {orders.filter(o => o.status === 'processing').length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <IoCheckmark className="w-6 h-6 text-green-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Hoàn thành</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {orders.filter(o => o.status === 'completed').length}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <IoClose className="w-6 h-6 text-red-600" />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Đã hủy</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {orders.filter(o => o.status === 'cancelled').length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Bar */}
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        {/* Search and Filter */}
                        <div className="flex flex-col sm:flex-row gap-4 flex-1">
                            <div className="relative">
                                <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm đơn hàng..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent w-full sm:w-64"
                                />
                            </div>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="all">Tất cả trạng thái</option>
                                <option value="pending">Chờ xử lý</option>
                                <option value="processing">Đang xử lý</option>
                                <option value="shipped">Đã giao hàng</option>
                                <option value="completed">Hoàn thành</option>
                                <option value="cancelled">Đã hủy</option>
                            </select>
                            <select
                                value={selectedPaymentStatus}
                                onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                <option value="all">Tất cả thanh toán</option>
                                <option value="paid">Đã thanh toán</option>
                                <option value="unpaid">Chưa thanh toán</option>
                                <option value="partial">Thanh toán một phần</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Orders Table */}
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Danh sách đơn hàng</h3>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <IoReceipt className="w-4 h-4" />
                            Thêm đơn hàng
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Đơn hàng
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Khách hàng
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Sản phẩm
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Tổng tiền
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thanh toán
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thời gian
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredOrders.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-4 text-center text-gray-500">
                                            {isLoading ? 'Đang tải...' : 'Không có đơn hàng nào khớp với tiêu chí tìm kiếm.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredOrders.map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {order.orderNumber}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {order.paymentMethod === 'cash' ? 'Tiền mặt' :
                                                        order.paymentMethod === 'card' ? 'Thẻ' : 'Chuyển khoản'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{order.customerName}</div>
                                                <div className="text-sm text-gray-500">{order.customerPhone}</div>
                                                <div className="text-sm text-gray-500">{order.customerEmail}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">
                                                    {order.items.length} sản phẩm
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {order.items.slice(0, 2).map(item => item.name).join(', ')}
                                                    {order.items.length > 2 && '...'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <div className="font-semibold text-gray-900">
                                                    {order.total.toLocaleString('vi-VN')}đ
                                                </div>
                                                {order.discount > 0 && (
                                                    <div className="text-xs text-green-600">
                                                        Giảm giá: {order.discount.toLocaleString('vi-VN')}đ
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                                                    {getStatusText(order.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(order.paymentStatus)}`}>
                                                    {getPaymentStatusText(order.paymentStatus)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div>{order.createdAt}</div>
                                                {order.updatedAt && order.updatedAt !== order.createdAt && (
                                                    <div className="text-xs text-gray-400">Cập nhật: {order.updatedAt}</div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleViewOrder(order)}
                                                        className="text-blue-600 hover:text-blue-800"
                                                        title="Xem chi tiết"
                                                    >
                                                        <IoEye className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedOrder(order);
                                                            setNewStatus(order.status); // Set current status as default
                                                            setShowStatusModal(true);
                                                        }}
                                                        className="text-green-600 hover:text-green-800"
                                                        title="Cập nhật trạng thái"
                                                    >
                                                        <IoCreate className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handlePrintOrder(order)}
                                                        className="text-purple-600 hover:text-purple-800"
                                                        title="In đơn hàng"
                                                    >
                                                        <IoPrint className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleExportOrder(order)}
                                                        className="text-gray-600 hover:text-gray-800"
                                                        title="Xuất file"
                                                    >
                                                        <IoDownload className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteOrder(order.id)}
                                                        className="text-red-600 hover:text-red-800"
                                                        title="Xóa"
                                                    >
                                                        <IoTrash className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Order Detail Modal */}
                {showOrderDetailModal && selectedOrder && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <h3 className="text-xl font-semibold mb-4 border-b pb-2">Chi tiết đơn hàng {selectedOrder.orderNumber}</h3>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">Thông tin khách hàng</h4>
                                        <div className="bg-gray-50 p-4 rounded-lg text-sm">
                                            <p className="font-medium text-gray-900">{selectedOrder.customerName}</p>
                                            <p className="text-gray-600">SĐT: {selectedOrder.customerPhone}</p>
                                            <p className="text-gray-600">Email: {selectedOrder.customerEmail}</p>
                                            <p className="text-gray-600 mt-2 font-medium">Địa chỉ: {selectedOrder.shippingAddress}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">Thông tin thanh toán & Trạng thái</h4>
                                        <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
                                            <p className="text-gray-900">
                                                **Phương thức:** {selectedOrder.paymentMethod === 'cash' ? 'Tiền mặt' :
                                                    selectedOrder.paymentMethod === 'card' ? 'Thẻ' : 'Chuyển khoản'}
                                            </p>
                                            <div className="flex justify-between items-center">
                                                <p className="text-gray-900">**Trạng thái TT:**</p>
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>
                                                    {getPaymentStatusText(selectedOrder.paymentStatus)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <p className="text-gray-900">**Trạng thái ĐH:**</p>
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                                                    {getStatusText(selectedOrder.status)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">Ghi chú</h4>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-gray-600 text-sm">{selectedOrder.notes || 'Không có ghi chú'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">Sản phẩm ({selectedOrder.items.length})</h4>
                                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                                            {selectedOrder.items.map((item, index) => (
                                                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{item.name}</p>
                                                        <p className="text-xs text-gray-500">SL: {item.quantity}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-medium text-gray-900">
                                                            {(item.price * item.quantity).toLocaleString('vi-VN')}đ
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            ({item.price.toLocaleString('vi-VN')}đ/SP)
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-2">Tổng kết</h4>
                                        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span>Tạm tính:</span>
                                                <span>{selectedOrder.subtotal.toLocaleString('vi-VN')}đ</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span>Giảm giá:</span>
                                                <span className="text-green-600">-{selectedOrder.discount.toLocaleString('vi-VN')}đ</span>
                                            </div>
                                            {selectedOrder.loyaltyPointsUsed > 0 && (
                                                <div className="flex justify-between text-sm text-orange-600">
                                                    <span>Điểm đã sử dụng:</span>
                                                    <span>-{selectedOrder.loyaltyPointsUsed} điểm</span>
                                                </div>
                                            )}
                                            {selectedOrder.loyaltyPointsEarned > 0 && (
                                                <div className="flex justify-between text-sm text-blue-600">
                                                    <span>Điểm thưởng nhận được:</span>
                                                    <span>+{selectedOrder.loyaltyPointsEarned} điểm</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
                                                <span>Tổng cộng:</span>
                                                <span className="text-blue-600">{selectedOrder.total.toLocaleString('vi-VN')}đ</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6 border-t pt-4">
                                <button
                                    onClick={() => setShowOrderDetailModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Đóng
                                </button>
                                <button
                                    onClick={() => {
                                        setShowOrderDetailModal(false);
                                        setNewStatus(selectedOrder.status);
                                        setShowStatusModal(true);
                                    }}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Cập nhật trạng thái
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Status Update Modal */}
                {showStatusModal && selectedOrder && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-md">
                            <h3 className="text-lg font-semibold mb-4">Cập nhật trạng thái đơn hàng</h3>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-gray-900">Đơn hàng: {selectedOrder.orderNumber}</h4>
                                    <p className="text-gray-600">Khách hàng: {selectedOrder.customerName}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Trạng thái hiện tại
                                    </label>
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedOrder.status)}`}>
                                        {getStatusText(selectedOrder.status)}
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Trạng thái mới
                                    </label>
                                    <select
                                        value={newStatus}
                                        onChange={(e) => setNewStatus(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Chọn trạng thái mới</option>
                                        <option value="pending">Chờ xử lý</option>
                                        <option value="processing">Đang xử lý</option>
                                        <option value="shipped">Đã giao hàng</option>
                                        <option value="completed">Hoàn thành</option>
                                        <option value="cancelled">Đã hủy</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Ghi chú cập nhật (Tùy chọn)
                                    </label>
                                    <textarea
                                        rows={3}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Nhập ghi chú cập nhật trạng thái"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => { setShowStatusModal(false); setNewStatus(''); setSelectedOrder(null); }}
                                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={() => handleUpdateStatus(selectedOrder.id, newStatus)}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    disabled={!newStatus || newStatus === selectedOrder.status}
                                >
                                    Cập nhật
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Order Modal */}
                {showAddModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6 border-b pb-2">
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        Thêm đơn hàng mới
                                    </h3>
                                    <button
                                        onClick={() => setShowAddModal(false)}
                                        className="text-gray-400 hover:text-gray-600"
                                    >
                                        <IoClose className="w-6 h-6" />
                                    </button>
                                </div>

                                <form onSubmit={onAddOrderSubmit}>
                                    <div className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Tên khách hàng</label>
                                                <input
                                                    type="text"
                                                    value={newOrder.customerName}
                                                    onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Nhập tên khách hàng"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                                                <input
                                                    type="tel"
                                                    value={newOrder.customerPhone}
                                                    onChange={(e) => setNewOrder({ ...newOrder, customerPhone: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Nhập số điện thoại"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                                <input
                                                    type="email"
                                                    value={newOrder.customerEmail}
                                                    onChange={(e) => setNewOrder({ ...newOrder, customerEmail: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Nhập email"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Phương thức thanh toán</label>
                                                <select
                                                    value={newOrder.paymentMethod}
                                                    onChange={(e) => setNewOrder({ ...newOrder, paymentMethod: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    required
                                                >
                                                    <option value="cash">Tiền mặt</option>
                                                    <option value="card">Thẻ</option>
                                                    <option value="bank">Chuyển khoản</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ giao hàng</label>
                                            <textarea
                                                value={newOrder.shippingAddress}
                                                onChange={(e) => setNewOrder({ ...newOrder, shippingAddress: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                rows="3"
                                                placeholder="Nhập địa chỉ giao hàng"
                                                required
                                            />
                                        </div>

                                        {/* Simplified Product Section for Demo */}
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-3">
                                                <select
                                                    value={selectedVariantId}
                                                    onChange={(e) => setSelectedVariantId(e.target.value)}
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="">-- Chọn sản phẩm --</option>
                                                    {variants.map(v => (
                                                        <option key={v.id || v.maBienThe} value={v.id || v.maBienThe}>
                                                            {v.tenSanPham || v.ten || v.tenBienThe || v.maBienThe}
                                                        </option>
                                                    ))}
                                                </select>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={selectedQuantity}
                                                    onChange={(e) => setSelectedQuantity(Math.max(1, Number(e.target.value) || 1))}
                                                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (!selectedVariantId) return alert('Vui lòng chọn sản phẩm.');
                                                        const variant = variants.find(v => (v.id || v.maBienThe) === selectedVariantId);
                                                        if (!variant) return alert('Sản phẩm không tồn tại.');
                                                        const price = variant.giaBan || variant.gia || variant.price || 0;
                                                        const name = variant.tenSanPham || variant.ten || variant.tenBienThe || variant.maBienThe;
                                                        const newItems = [
                                                            ...newOrder.items,
                                                            {
                                                                variantId: selectedVariantId,
                                                                name,
                                                                quantity: selectedQuantity,
                                                                price
                                                            }
                                                        ];
                                                        const subtotal = newItems.reduce((s, it) => s + (it.price || 0) * (it.quantity || 0), 0);
                                                        setNewOrder({ ...newOrder, items: newItems, subtotal, total: subtotal - (newOrder.discount || 0) });
                                                        setSelectedVariantId('');
                                                        setSelectedQuantity(1);
                                                    }}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                >
                                                    Thêm
                                                </button>
                                            </div>

                                            {/* Selected items list */}
                                            <div className="space-y-2">
                                                {newOrder.items.length === 0 ? (
                                                    <div className="text-sm text-gray-500">Chưa có sản phẩm trong đơn hàng.</div>
                                                ) : (
                                                    newOrder.items.map((it, idx) => (
                                                        <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border">
                                                            <div>
                                                                <div className="font-medium">{it.name}</div>
                                                                <div className="text-xs text-gray-500">SL: {it.quantity} × {it.price?.toLocaleString?.('vi-VN') || it.price}đ</div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="font-semibold">{((it.price || 0) * (it.quantity || 0)).toLocaleString('vi-VN')}đ</div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const remaining = newOrder.items.filter((_, i) => i !== idx);
                                                                        const subtotal = remaining.reduce((s, it) => s + (it.price || 0) * (it.quantity || 0), 0);
                                                                        setNewOrder({ ...newOrder, items: remaining, subtotal, total: subtotal - (newOrder.discount || 0) });
                                                                    }}
                                                                    className="text-red-600 hover:text-red-800"
                                                                >
                                                                    <IoTrash className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                                                <select
                                                    value={newOrder.status}
                                                    onChange={(e) => setNewOrder({ ...newOrder, status: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    required
                                                >
                                                    <option value="pending">Chờ xử lý</option>
                                                    <option value="processing">Đang xử lý</option>
                                                    <option value="shipped">Đã giao</option>
                                                    <option value="completed">Hoàn thành</option>
                                                    <option value="cancelled">Đã hủy</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái thanh toán</label>
                                                <select
                                                    value={newOrder.paymentStatus}
                                                    onChange={(e) => setNewOrder({ ...newOrder, paymentStatus: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    required
                                                >
                                                    <option value="unpaid">Chưa thanh toán</option>
                                                    <option value="paid">Đã thanh toán</option>
                                                    <option value="partial">Thanh toán một phần</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                                            <textarea
                                                value={newOrder.notes}
                                                onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                rows="3"
                                                placeholder="Nhập ghi chú bổ sung..."
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
                                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                            disabled={isLoading}
                                        >
                                            {isLoading ? 'Đang thêm...' : 'Thêm đơn hàng'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrderManagement;