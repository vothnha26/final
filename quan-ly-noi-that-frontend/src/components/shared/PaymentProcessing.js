import React, { useState, useEffect } from 'react';
import { IoCard, IoCash, IoCheckmarkCircle, IoTime, IoWarning, IoRefresh, IoDownload, IoPrint, IoEye } from 'react-icons/io5';
import api from '../../api';

const PaymentProcessing = () => {
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Map payment data from API
  const mapPaymentFromApi = (payment) => ({
    id: payment.maThanhToan || payment.id,
    orderId: payment.maDonHang || payment.orderId,
    customer: payment.khachHang?.hoTen || payment.customer || '',
    amount: payment.soTien || payment.amount || 0,
    method: mapPaymentMethod(payment.phuongThuc || payment.method),
    status: mapPaymentStatus(payment.trangThai || payment.status),
    transactionId: payment.maGiaoDich || payment.transactionId,
    date: payment.ngayThanhToan || payment.date,
    description: payment.moTa || payment.description || '',
    bankInfo: payment.thongTinNganHang || payment.bankInfo || ''
  });

  const mapPaymentMethod = (method) => {
    const methodMap = {
      'Tiền mặt': 'cash',
      'Thẻ tín dụng': 'credit_card', 
      'Chuyển khoản': 'bank_transfer',
      'Ví điện tử': 'e_wallet'
    };
    return methodMap[method] || method;
  };

  const mapPaymentStatus = (status) => {
    const statusMap = {
      'Hoàn thành': 'completed',
      'Đang xử lý': 'processing', 
      'Thất bại': 'failed',
      'Chờ xác nhận': 'pending'
    };
    return statusMap[status] || status;
  };

  // Fetch payments
  useEffect(() => {
    const fetchPayments = async () => {
      setIsLoading(true);
      try {
        const data = await api.get('/api/banhang/thongke'); // Fixed: aligned with backend sales statistics endpoint
        if (Array.isArray(data)) {
          setPayments(data.map(mapPaymentFromApi));
        }
      } catch (err) {
        console.error('Fetch payments error', err);
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const [payments, setPayments] = useState([
    {
      id: 'PAY001',
      orderId: 'ORD001',
      customer: 'Nguyễn Văn A',
      amount: 15000000,
      method: 'credit_card',
      status: 'completed',
      transactionId: 'TXN123456789',
      processedAt: '2024-01-15 14:30:00',
      processedBy: 'Huy',
      bank: 'Vietcombank',
      cardNumber: '**** **** **** 1234',
      fee: 150000,
      netAmount: 14850000
    },
    {
      id: 'PAY002',
      orderId: 'ORD002',
      customer: 'Trần Thị B',
      amount: 8500000,
      method: 'bank_transfer',
      status: 'pending',
      transactionId: null,
      processedAt: null,
      processedBy: null,
      bank: 'Techcombank',
      accountNumber: '1234567890',
      fee: 0,
      netAmount: 8500000
    },
    {
      id: 'PAY003',
      orderId: 'ORD003',
      customer: 'Lê Văn C',
      amount: 22000000,
      method: 'cash',
      status: 'completed',
      transactionId: 'CASH001',
      processedAt: '2024-01-16 10:15:00',
      processedBy: 'Huy',
      bank: null,
      cardNumber: null,
      fee: 0,
      netAmount: 22000000
    }
  ]);

  const paymentMethods = [
    { id: 'credit_card', name: 'Thẻ tín dụng', icon: IoCard, color: 'text-blue-600' },
    { id: 'bank_transfer', name: 'Chuyển khoản', icon: IoCard, color: 'text-green-600' },
    { id: 'cash', name: 'Tiền mặt', icon: IoCash, color: 'text-gray-600' },
    { id: 'momo', name: 'MoMo', icon: IoCard, color: 'text-pink-600' },
    { id: 'zalopay', name: 'ZaloPay', icon: IoCard, color: 'text-blue-500' }
  ];

  const statusConfig = {
    pending: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: IoTime, label: 'Chờ xử lý' },
    processing: { color: 'text-blue-600', bg: 'bg-blue-100', icon: IoRefresh, label: 'Đang xử lý' },
    completed: { color: 'text-green-600', bg: 'bg-green-100', icon: IoCheckmarkCircle, label: 'Hoàn thành' },
    failed: { color: 'text-red-600', bg: 'bg-red-100', icon: IoWarning, label: 'Thất bại' },
    refunded: { color: 'text-purple-600', bg: 'bg-purple-100', icon: IoRefresh, label: 'Đã hoàn tiền' }
  };

  const getPaymentMethod = (methodId) => {
    return paymentMethods.find(method => method.id === methodId) || paymentMethods[0];
  };

  const getStatusInfo = (status) => {
    return statusConfig[status] || statusConfig.pending;
  };

  const handleProcessPayment = (payment) => {
    setSelectedPayment(payment);
    setShowPaymentModal(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Xử lý thanh toán</h1>
          <p className="text-gray-600">Quản lý và xử lý các giao dịch thanh toán</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <IoCheckmarkCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Đã thanh toán</p>
                <p className="text-2xl font-bold text-gray-900">2</p>
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
                <p className="text-2xl font-bold text-gray-900">1</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <IoCard className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
                <p className="text-2xl font-bold text-gray-900">45.5M</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <IoCash className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Phí giao dịch</p>
                <p className="text-2xl font-bold text-gray-900">150K</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Danh sách thanh toán</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mã thanh toán
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Khách hàng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Số tiền
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phương thức
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Xử lý bởi
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => {
                  const method = getPaymentMethod(payment.method);
                  const statusInfo = getStatusInfo(payment.status);
                  const MethodIcon = method.icon;
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{payment.id}</div>
                        <div className="text-sm text-gray-500">{payment.orderId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{payment.customer}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </div>
                        {payment.fee > 0 && (
                          <div className="text-sm text-gray-500">
                            Phí: {formatCurrency(payment.fee)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MethodIcon className={`w-4 h-4 mr-2 ${method.color}`} />
                          <span className="text-sm text-gray-900">{method.name}</span>
                        </div>
                        {payment.bank && (
                          <div className="text-sm text-gray-500">{payment.bank}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.processedBy || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleProcessPayment(payment)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <IoEye className="w-4 h-4" />
                          </button>
                          {payment.status === 'completed' && (
                            <>
                              <button className="text-green-600 hover:text-green-800">
                                <IoDownload className="w-4 h-4" />
                              </button>
                              <button className="text-gray-600 hover:text-gray-800">
                                <IoPrint className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Detail Modal */}
        {showPaymentModal && selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Chi tiết thanh toán
                  </h3>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <IoRefresh className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Payment Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Thông tin giao dịch</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Mã thanh toán:</span>
                          <span className="text-sm font-medium">{selectedPayment.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Mã đơn hàng:</span>
                          <span className="text-sm font-medium">{selectedPayment.orderId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Số tiền:</span>
                          <span className="text-sm font-medium">{formatCurrency(selectedPayment.amount)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Phí giao dịch:</span>
                          <span className="text-sm font-medium">{formatCurrency(selectedPayment.fee)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Số tiền thực nhận:</span>
                          <span className="text-sm font-medium text-green-600">{formatCurrency(selectedPayment.netAmount)}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Thông tin xử lý</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Trạng thái:</span>
                          <span className={`text-sm font-medium ${getStatusInfo(selectedPayment.status).color}`}>
                            {getStatusInfo(selectedPayment.status).label}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Xử lý bởi:</span>
                          <span className="text-sm font-medium">{selectedPayment.processedBy || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Thời gian:</span>
                          <span className="text-sm font-medium">{selectedPayment.processedAt || '-'}</span>
                        </div>
                        {selectedPayment.transactionId && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Mã giao dịch:</span>
                            <span className="text-sm font-medium">{selectedPayment.transactionId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => setShowPaymentModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Đóng
                    </button>
                    {selectedPayment.status === 'pending' && (
                      <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90">
                        Xử lý thanh toán
                      </button>
                    )}
                    {selectedPayment.status === 'completed' && (
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        In hóa đơn
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentProcessing;



