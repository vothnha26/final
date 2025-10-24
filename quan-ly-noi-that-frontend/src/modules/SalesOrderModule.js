// Module: Quản lý Bán hàng & Đơn hàng
// Người phụ trách: Huy
// Mô tả: Module quản lý toàn bộ quy trình bán hàng và xử lý đơn hàng

import SalesManagement from '../components/staff/SalesManagement';
import OrderManagement from '../components/staff/OrderManagement';
import OrderDetailManagement from '../components/staff/OrderDetailManagement';
import PaymentProcessing from '../components/shared/PaymentProcessing';
import PaymentTransactionManagement from '../components/staff/PaymentTransactionManagement';
import InvoiceManagement from '../components/staff/InvoiceManagement';
import CustomerShop from '../components/customer/CustomerShop';
import CustomerShopPage from '../components/customer/CustomerShopPage';
import CustomerProductDetail from '../components/customer/CustomerProductDetail';
import CustomerCart from '../components/customer/CustomerCart';
import CustomerCheckout from '../components/customer/CustomerCheckout';

/**
 * 🛒 2. QUẢN LÝ BÁN HÀNG & ĐƠN HÀNG
 * =====================================
 * Bao quát toàn bộ quy trình từ khi khách hàng lựa chọn đến khi hoàn tất giao dịch.
 * 
 * CÁC CHỨC NĂNG CHÍNH:
 * ---------------------
 * 
 * A. HỖ TRỢ BÁN HÀNG ĐA KÊNH:
 *    - Kênh Online: Khách hàng tự tìm kiếm, lựa chọn biến thể và đặt hàng qua website
 *    - Kênh tại cửa hàng: Nhân viên bán hàng có thể tạo đơn hàng trực tiếp trên hệ thống
 * 
 * B. QUY TRÌNH ĐẶT HÀNG (CHECKOUT) LINH HOẠT:
 *    - Áp dụng mã voucher giảm giá
 *    - Tùy chọn dịch vụ đi kèm (ví dụ: lắp đặt, giao hàng hẹn giờ)
 *    - Tự động tính toán tổng tiền cuối cùng
 * 
 * C. QUẢN LÝ ĐƠN HÀNG TẬP TRUNG:
 *    - Xác nhận đơn hàng thủ công (đặc biệt cho đơn COD)
 *    - Hủy đơn hàng và tự động hoàn trả tồn kho
 * 
 * D. QUẢN LÝ THANH TOÁN VÀ HÓA ĐƠN:
 *    - Ghi nhận các giao dịch thanh toán
 *    - Hỗ trợ xuất hóa đơn
 */

const SalesOrderModule = {
  // Tên module
  moduleName: 'Huy - 🛒 Quản lý Bán hàng & Đơn hàng',
  
  // Icon đại diện
  moduleIcon: '🛒',
  
  // Người phụ trách
  assignee: 'Huy',
  
  // Mô tả
  description: 'Bao quát toàn bộ quy trình từ khi khách hàng lựa chọn đến khi hoàn tất giao dịch',

  // ============================================
  // PHẦN A: QUẢN LÝ BÁN HÀNG VÀ DOANH SỐ
  // ============================================
  sales: {
    // 💰 Quản lý doanh số bán hàng
    management: {
      id: 'sales',
      name: '💰 Quản lý doanh số',
      component: SalesManagement,
      description: 'Theo dõi và quản lý doanh số bán hàng theo thời gian',
      features: [
        'Xem tổng quan doanh số theo ngày/tháng/năm',
        'Phân tích xu hướng bán hàng',
        'Báo cáo top sản phẩm bán chạy',
        'So sánh doanh số giữa các kênh (online/offline)'
      ]
    }
  },

  // ============================================
  // PHẦN B: QUẢN LÝ ĐƠN HÀNG
  // ============================================
  orders: {
    // 📋 Xử lý đơn hàng tổng quan
    management: {
      id: 'orders',
      name: '📋 Xử lý đơn hàng',
      component: OrderManagement,
      description: 'Quản lý tập trung tất cả đơn hàng trong hệ thống',
      features: [
        'Xem danh sách đơn hàng theo trạng thái',
        'Xác nhận đơn hàng thủ công (đặc biệt cho COD)',
        'Hủy đơn hàng với lý do',
        'Tự động hoàn trả tồn kho khi hủy đơn',
        'Cập nhật trạng thái đơn hàng (Chờ xác nhận → Đang xử lý → Đang giao → Hoàn thành)',
        'Tìm kiếm và lọc đơn hàng'
      ],
      orderStatuses: [
        { status: 'PENDING', label: 'Chờ xác nhận', color: 'yellow' },
        { status: 'CONFIRMED', label: 'Đã xác nhận', color: 'blue' },
        { status: 'PROCESSING', label: 'Đang xử lý', color: 'purple' },
        { status: 'SHIPPING', label: 'Đang giao hàng', color: 'orange' },
        { status: 'COMPLETED', label: 'Hoàn thành', color: 'green' },
        { status: 'CANCELLED', label: 'Đã hủy', color: 'red' },
        { status: 'RETURNED', label: 'Hoàn trả', color: 'gray' }
      ]
    },

    // 📄 Chi tiết đơn hàng
    details: {
      id: 'orderdetails',
      name: '📄 Chi tiết đơn hàng',
      component: OrderDetailManagement,
      description: 'Xem và quản lý thông tin chi tiết từng đơn hàng',
      features: [
        'Xem danh sách sản phẩm trong đơn (biến thể, số lượng, giá)',
        'Xem thông tin khách hàng',
        'Xem thông tin giao hàng',
        'Xem lịch sử thay đổi trạng thái',
        'Thêm/sửa/xóa sản phẩm trong đơn (nếu chưa xác nhận)',
        'Tính toán lại tổng tiền khi thay đổi'
      ]
    }
  },

  // ============================================
  // PHẦN C: QUẢN LÝ THANH TOÁN
  // ============================================
  payment: {
    // 💳 Xử lý thanh toán
    processing: {
      id: 'payment',
      name: '💳 Xử lý thanh toán',
      component: PaymentProcessing,
      description: 'Xử lý các giao dịch thanh toán cho đơn hàng',
      features: [
        'Hỗ trợ nhiều phương thức thanh toán (COD, Chuyển khoản, Ví điện tử, Thẻ)',
        'Xác nhận thanh toán thành công/thất bại',
        'Xử lý hoàn tiền (nếu hủy đơn sau khi đã thanh toán)',
        'Gửi thông báo thanh toán cho khách hàng'
      ],
      paymentMethods: [
        { id: 'COD', name: 'Thanh toán khi nhận hàng (COD)', icon: '💵' },
        { id: 'BANK_TRANSFER', name: 'Chuyển khoản ngân hàng', icon: '🏦' },
        { id: 'E_WALLET', name: 'Ví điện tử (Momo, ZaloPay)', icon: '📱' },
        { id: 'CREDIT_CARD', name: 'Thẻ tín dụng/Ghi nợ', icon: '💳' }
      ]
    },

    // 💰 Giao dịch thanh toán
    transactions: {
      id: 'paymenttransactions',
      name: '💰 Giao dịch thanh toán',
      component: PaymentTransactionManagement,
      description: 'Theo dõi lịch sử các giao dịch thanh toán',
      features: [
        'Xem danh sách giao dịch theo thời gian',
        'Lọc theo trạng thái (Thành công/Thất bại/Đang xử lý)',
        'Xem chi tiết giao dịch',
        'Xuất báo cáo giao dịch',
        'Đối chiếu với ngân hàng/cổng thanh toán'
      ]
    }
  },

  // ============================================
  // PHẦN D: QUẢN LÝ HÓA ĐƠN
  // ============================================
  invoice: {
    // 🧾 Hóa đơn & thuế
    management: {
      id: 'invoices',
      name: '🧾 Hóa đơn & thuế',
      component: InvoiceManagement,
      description: 'Quản lý hóa đơn điện tử và xử lý thuế',
      features: [
        'Tự động tạo hóa đơn khi đơn hàng hoàn thành',
        'Xuất hóa đơn điện tử cho khách hàng',
        'Quản lý thông tin thuế',
        'Lưu trữ và tra cứu hóa đơn',
        'Hủy hóa đơn (nếu cần)'
      ]
    }
  },

  // ============================================
  // PHẦN E: GIAO DIỆN KHÁCH HÀNG (FRONTEND)
  // ============================================
  customer: {
    // 🛍️ Giao diện cửa hàng
    shop: {
      id: 'customershop',
      name: '🛍️ Giao diện cửa hàng',
      component: CustomerShop,
      description: 'Trang hiển thị danh sách sản phẩm cho khách hàng',
      features: [
        'Hiển thị danh sách sản phẩm với hình ảnh',
        'Bộ lọc sản phẩm (theo danh mục, giá, màu sắc, chất liệu)',
        'Sắp xếp sản phẩm (theo giá, tên, mới nhất)',
        'Tìm kiếm sản phẩm',
        'Hiển thị giá có giảm giá (nếu có)'
      ]
    },

    // 🏪 Trang chủ shop
    homepage: {
      id: 'customershoppage',
      name: '🏪 Trang chủ shop',
      component: CustomerShopPage,
      description: 'Trang chủ của cửa hàng với banner và sản phẩm nổi bật',
      features: [
        'Banner quảng cáo chương trình khuyến mãi',
        'Sản phẩm nổi bật/bán chạy',
        'Bộ sưu tập nổi bật',
        'Danh mục sản phẩm'
      ]
    },

    // 🔍 Chi tiết sản phẩm
    productDetail: {
      id: 'customerproductdetail',
      name: '🔍 Chi tiết sản phẩm',
      component: CustomerProductDetail,
      description: 'Trang chi tiết sản phẩm với khả năng chọn biến thể',
      features: [
        'Hiển thị hình ảnh sản phẩm (gallery)',
        'Mô tả chi tiết sản phẩm',
        'Chọn biến thể (màu sắc, chất liệu, kích thước)',
        'Hiển thị giá và tồn kho theo biến thể đã chọn',
        'Thêm vào giỏ hàng',
        'Xem sản phẩm liên quan'
      ]
    },

    // 🛒 Giỏ hàng
    cart: {
      id: 'customercart',
      name: '🛒 Giỏ hàng',
      component: CustomerCart,
      description: 'Quản lý giỏ hàng của khách hàng',
      features: [
        'Xem danh sách sản phẩm đã chọn',
        'Thay đổi số lượng sản phẩm',
        'Xóa sản phẩm khỏi giỏ',
        'Hiển thị tổng tiền tạm tính',
        'Chuyển sang trang thanh toán'
      ]
    },

    // 💰 Checkout
    checkout: {
      id: 'customercheckout',
      name: '💰 Checkout',
      component: CustomerCheckout,
      description: 'Trang thanh toán và hoàn tất đơn hàng',
      features: [
        'Nhập thông tin giao hàng',
        'Chọn phương thức thanh toán',
        'Áp dụng mã voucher giảm giá',
        'Chọn dịch vụ đi kèm (lắp đặt, vận chuyển nhanh)',
        'Tính toán tổng tiền cuối cùng',
        'Xác nhận và tạo đơn hàng',
        'Hiển thị thông tin đơn hàng sau khi đặt thành công'
      ],
      checkoutSteps: [
        { step: 1, name: 'Thông tin giao hàng', icon: '📍' },
        { step: 2, name: 'Phương thức thanh toán', icon: '💳' },
        { step: 3, name: 'Xem lại đơn hàng', icon: '📋' },
        { step: 4, name: 'Hoàn thành', icon: '✅' }
      ]
    }
  },

  // ============================================
  // CÁC CHỨC NĂNG PHỤ TRỢ
  // ============================================
  helpers: {
    // Tính toán tổng tiền đơn hàng
    calculateOrderTotal: (items, voucher = null, services = []) => {
      let subtotal = items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
      }, 0);

      let discount = 0;
      if (voucher) {
        if (voucher.type === 'PERCENTAGE') {
          discount = subtotal * (voucher.value / 100);
          if (voucher.maxDiscount) {
            discount = Math.min(discount, voucher.maxDiscount);
          }
        } else if (voucher.type === 'FIXED') {
          discount = voucher.value;
        }
      }

      let serviceTotal = services.reduce((sum, service) => {
        return sum + service.price;
      }, 0);

      return {
        subtotal: subtotal,
        discount: discount,
        serviceTotal: serviceTotal,
        total: subtotal - discount + serviceTotal
      };
    },

    // Validate đơn hàng trước khi tạo
    validateOrder: (orderData) => {
      const errors = [];

      if (!orderData.items || orderData.items.length === 0) {
        errors.push('Đơn hàng phải có ít nhất 1 sản phẩm');
      }

      if (!orderData.customer) {
        errors.push('Thiếu thông tin khách hàng');
      }

      if (!orderData.shippingAddress) {
        errors.push('Thiếu địa chỉ giao hàng');
      }

      if (!orderData.paymentMethod) {
        errors.push('Chưa chọn phương thức thanh toán');
      }

      // Kiểm tra tồn kho
      orderData.items.forEach(item => {
        if (item.quantity > item.availableStock) {
          errors.push(`Sản phẩm "${item.name}" không đủ tồn kho`);
        }
      });

      return {
        isValid: errors.length === 0,
        errors: errors
      };
    }
  },

  // ============================================
  // DANH SÁCH VIEWS CHO APP.JS
  // ============================================
  getViews: () => {
    return [
      { id: 'sales', name: '💰 Quản lý doanh số', component: SalesManagement },
      { id: 'orders', name: '📋 Xử lý đơn hàng', component: OrderManagement },
      { id: 'orderdetails', name: '📄 Chi tiết đơn hàng', component: OrderDetailManagement },
      { id: 'payment', name: '💳 Xử lý thanh toán', component: PaymentProcessing },
      { id: 'paymenttransactions', name: '💰 Giao dịch thanh toán', component: PaymentTransactionManagement },
      { id: 'invoices', name: '🧾 Hóa đơn & thuế', component: InvoiceManagement },
      { id: 'customershop', name: '🛍️ Giao diện cửa hàng', component: CustomerShop },
      { id: 'customershoppage', name: '🏪 Trang chủ shop', component: CustomerShopPage },
      { id: 'customerproductdetail', name: '🔍 Chi tiết sản phẩm', component: CustomerProductDetail },
      { id: 'customercart', name: '🛒 Giỏ hàng', component: CustomerCart },
      { id: 'customercheckout', name: '💰 Checkout', component: CustomerCheckout }
    ];
  }
};

export default SalesOrderModule;
