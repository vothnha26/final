import React, { useRef } from 'react';
import { IoClose, IoPrint, IoDownload } from 'react-icons/io5';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const InvoiceModal = ({ order, onClose }) => {
  const invoiceRef = useRef(null);

  if (!order) return null;

  const formatDate = (value) => {
    if (!value) return '';
    const d = (value instanceof Date) ? value : new Date(value);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleString('vi-VN');
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Chờ xử lý';
      case 'processing': return 'Đang xử lý';
      case 'shipping': return 'Đang giao hàng';
      case 'delivered': return 'Đã giao hàng';
      case 'completed': return 'Hoàn thành';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const getPaymentStatusText = (ps) => {
    switch (ps) {
      case 'paid': return 'Đã thanh toán';
      case 'pending': return 'Chờ thanh toán';
      case 'refunded': return 'Đã hoàn tiền';
      default: return ps;
    }
  };

  const exportToPDF = async () => {
    if (!invoiceRef.current) return;

    try {
      // Hide buttons before capture
      const buttons = invoiceRef.current.querySelectorAll('.no-print');
      buttons.forEach(btn => btn.style.display = 'none');

      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // Show buttons again
      buttons.forEach(btn => btn.style.display = '');

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `hoa-don-${order.orderNumber}.pdf`;

      // Prefer native save dialog when available (Chromium File System Access API)
      if (typeof window !== 'undefined' && 'showSaveFilePicker' in window) {
        const pdfBlob = pdf.output('blob');
        try {
          const handle = await window.showSaveFilePicker({
            suggestedName: fileName,
            types: [
              {
                description: 'PDF Files',
                accept: { 'application/pdf': ['.pdf'] }
              }
            ]
          });
          const writable = await handle.createWritable();
          await writable.write(pdfBlob);
          await writable.close();
        } catch (pickerErr) {
          // If user cancels or API fails, fallback to default download behavior
          pdf.save(fileName);
        }
      } else {
        // Fallback: trigger browser download (save location depends on browser settings)
        pdf.save(fileName);
      }
    } catch (error) {
      alert('Không thể tạo file PDF. Vui lòng thử lại.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const subtotal = (order.items || []).reduce((sum, item) => 
    sum + (Number(item.quantity || 0) * Number(item.price || 0)), 0
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header buttons */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between no-print">
          <h2 className="text-xl font-bold text-gray-900">Hóa đơn bán hàng</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <IoPrint className="w-5 h-5" />
              In hóa đơn
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <IoDownload className="w-5 h-5" />
              Xuất PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <IoClose className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div ref={invoiceRef} className="p-8 bg-white">
          {/* Company Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">CỬA HÀNG NỘI THẤT</h1>
            <p className="text-gray-600">Địa chỉ: Số 123, Đường ABC, Quận XYZ, TP.HCM</p>
            <p className="text-gray-600">Điện thoại: 0123 456 789 | Email: contact@noithat.com</p>
          </div>

          {/* Invoice Title */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">HÓA ĐƠN BÁN HÀNG</h2>
            <p className="text-gray-600">Số: {order.orderNumber}</p>
          </div>

          {/* Invoice Info Grid */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Thông tin khách hàng</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Họ tên:</span> {order.customerName || 'Khách lẻ'}</p>
                <p><span className="font-medium">Số điện thoại:</span> {order.customerPhone || '-'}</p>
                <p><span className="font-medium">Địa chỉ:</span> {order.address || '-'}</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Thông tin đơn hàng</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Ngày tạo:</span> {formatDate(order.createdAt)}</p>
                <p><span className="font-medium">Trạng thái:</span> {getStatusText(order.status)}</p>
                <p><span className="font-medium">Thanh toán:</span> {getPaymentStatusText(order.paymentStatus)}</p>
                <p><span className="font-medium">Phương thức:</span> {
                  order.paymentMethod === 'cash' ? 'Tiền mặt' :
                  order.paymentMethod === 'card' ? 'Thẻ' : 'Chuyển khoản'
                }</p>
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="mb-6">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">STT</th>
                  <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold">Tên sản phẩm</th>
                  <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold">Số lượng</th>
                  <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">Đơn giá</th>
                  <th className="border border-gray-300 px-4 py-2 text-right text-sm font-semibold">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 px-4 py-2 text-sm">{index + 1}</td>
                    <td className="border border-gray-300 px-4 py-2 text-sm">{item.name || '-'}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center text-sm">{Number(item.quantity || 0)}</td>
                    <td className="border border-gray-300 px-4 py-2 text-right text-sm">
                      {Number(item.price || 0).toLocaleString('vi-VN')}đ
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-right text-sm font-medium">
                      {(Number(item.quantity || 0) * Number(item.price || 0)).toLocaleString('vi-VN')}đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="flex justify-end mb-8">
            <div className="w-80">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tạm tính:</span>
                  <span>{subtotal.toLocaleString('vi-VN')}đ</span>
                </div>
                
                {order.giamGiaVoucher > 0 && (
                  <div className="flex justify-between text-sm text-indigo-600">
                    <span>Giảm giá voucher:</span>
                    <span>-{Number(order.giamGiaVoucher || 0).toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
                
                {order.giamGiaDiemThuong > 0 && (
                  <div className="flex justify-between text-sm text-amber-600">
                    <span>Giảm giá điểm thưởng:</span>
                    <span>-{Number(order.giamGiaDiemThuong || 0).toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
                
                {order.giamGiaVip > 0 && (
                  <div className="flex justify-between text-sm text-fuchsia-600">
                    <span>Giảm giá VIP:</span>
                    <span>-{Number(order.giamGiaVip || 0).toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
                
                {(order.tongGiamGia || 0) > 0 && (
                  <div className="flex justify-between text-sm font-semibold text-rose-600">
                    <span>Tổng giảm giá:</span>
                    <span>-{Number(order.tongGiamGia || 0).toLocaleString('vi-VN')}đ</span>
                  </div>
                )}
                
                <div className="border-t border-gray-300 pt-2 flex justify-between text-lg font-bold">
                  <span>Tổng cộng:</span>
                  <span className="text-primary">{Number(order.total || 0).toLocaleString('vi-VN')}đ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Ghi chú</h3>
              <p className="text-sm text-gray-600">{order.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-300 pt-6 mt-8">
            <div className="grid grid-cols-2 gap-8 text-center">
              <div>
                <p className="font-semibold mb-8">Người bán hàng</p>
                <p className="text-sm text-gray-600">(Ký và ghi rõ họ tên)</p>
              </div>
              <div>
                <p className="font-semibold mb-8">Khách hàng</p>
                <p className="text-sm text-gray-600">(Ký và ghi rõ họ tên)</p>
              </div>
            </div>
          </div>

          {/* Print Footer */}
          <div className="text-center mt-8 text-sm text-gray-500">
            <p>Cảm ơn quý khách đã mua hàng!</p>
            <p>Mọi thắc mắc xin liên hệ: 0123 456 789</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .fixed.inset-0 {
            position: static !important;
            background: white !important;
          }
          #invoice-content,
          #invoice-content * {
            visibility: visible;
          }
          #invoice-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default InvoiceModal;
