package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.entity.DonHang;
import com.noithat.qlnt.backend.entity.LichSuTrangThaiDonHang;
import com.noithat.qlnt.backend.service.IDonHangService;
import com.noithat.qlnt.backend.service.IQuanLyTrangThaiDonHangService;
import com.noithat.qlnt.backend.repository.DonHangRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/quan-ly-trang-thai-don-hang")
public class QuanLyTrangThaiDonHangController {

    @Autowired
    private IQuanLyTrangThaiDonHangService orderStatusService;

    @Autowired
    private DonHangRepository donHangRepository;

    // =================== ORDER STATUS MANAGEMENT ===================

    /**
     * Cập nhật trạng thái đơn hàng (Vietnamese URL mapping)
     * PUT /api/v1/quan-ly-trang-thai-don-hang/cap-nhat-trang-thai/{maDonHang}
     */
    @PutMapping("/cap-nhat-trang-thai/{maDonHang}")
    public ResponseEntity<Map<String, Object>> capNhatTrangThai(
            @PathVariable Integer maDonHang,
            @RequestBody Map<String, Object> payload) {

        Map<String, Object> response = new HashMap<>();

        try {
            // Hỗ trợ nhiều tên tham số
            String trangThaiMoi = (String) payload.get("trangThaiMoi");
            String nguoiCapNhat = (String) payload.get("nguoiCapNhat");
            if (nguoiCapNhat == null)
                nguoiCapNhat = (String) payload.get("nguoiThayDoi");
            String ghiChu = (String) payload.get("ghiChu");

            // Kiểm tra đầu vào
            if (trangThaiMoi == null || trangThaiMoi.isEmpty()) {
                response.put("success", false);
                response.put("message", "Trạng thái mới không được để trống");
                return ResponseEntity.badRequest().body(response);
            }

            if (nguoiCapNhat == null || nguoiCapNhat.isEmpty()) {
                response.put("success", false);
                response.put("message", "Người cập nhật không được để trống");
                return ResponseEntity.badRequest().body(response);
            }

            boolean success = orderStatusService.changeOrderStatus(maDonHang, trangThaiMoi, nguoiCapNhat, ghiChu);

            if (success) {
                response.put("success", true);
                response.put("message", "Cập nhật trạng thái đơn hàng thành công");
                response.put("maDonHang", maDonHang);
                response.put("trangThaiMoi", trangThaiMoi);
                // include updated order entity so frontend can apply change immediately
                response.put("order", donHangRepository.findById(maDonHang).orElse(null));
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Cập nhật trạng thái thất bại");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Cập nhật trạng thái thất bại: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Thay đổi trạng thái đơn hàng
     * PUT /api/warehouse/order-status/{maDonHang}
     */
    @PutMapping("/{maDonHang}")
    public ResponseEntity<Map<String, Object>> changeOrderStatus(
            @PathVariable Integer maDonHang,
            @RequestBody Map<String, Object> request) {

        Map<String, Object> response = new HashMap<>();

        try {
            String trangThaiMoi = (String) request.get("trangThaiMoi");
            String nguoiThayDoi = (String) request.get("nguoiThayDoi");
            String ghiChu = (String) request.get("ghiChu");

            boolean success = orderStatusService.changeOrderStatus(maDonHang, trangThaiMoi, nguoiThayDoi, ghiChu);

            if (success) {
                response.put("success", true);
                response.put("message", "Thay đổi trạng thái đơn hàng thành công");
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message",
                        "Thay đổi trạng thái thất bại - Không thể chuyển trạng thái hoặc thiếu hàng tồn kho");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Xác nhận đơn hàng (CHO_XAC_NHAN → XAC_NHAN)
     * POST /api/warehouse/order-status/{maDonHang}/confirm
     */
    @PostMapping("/{maDonHang}/confirm")
    public ResponseEntity<Map<String, Object>> confirmOrder(
            @PathVariable Integer maDonHang,
            @RequestBody Map<String, Object> request) {

        Map<String, Object> response = new HashMap<>();

        try {
            // Log incoming payload for diagnostics
            String nguoiThayDoi = (String) request.get("nguoiThayDoi");
            String ghiChu = (String) request.getOrDefault("ghiChu", "Xác nhận đơn hàng");

            // 🔹 Validation: Check if nguoiThayDoi is provided
            if (nguoiThayDoi == null || nguoiThayDoi.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Thiếu thông tin người thay đổi");
                return ResponseEntity.badRequest().body(response);
            }

            boolean success = orderStatusService.changeOrderStatus(maDonHang,
                    IQuanLyTrangThaiDonHangService.XAC_NHAN, nguoiThayDoi, ghiChu);

            if (success) {
                response.put("success", true);
                response.put("message", "Xác nhận đơn hàng thành công - Đã đặt trước hàng");
                response.put("order", donHangRepository.findById(maDonHang).orElse(null));
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Xác nhận đơn hàng thất bại - Không đủ hàng tồn kho");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Chuẩn bị đơn hàng (XAC_NHAN → DANG_CHUAN_BI)
     * POST /api/warehouse/order-status/{maDonHang}/prepare
     */
    @PostMapping("/{maDonHang}/prepare")
    public ResponseEntity<Map<String, Object>> prepareOrder(
            @PathVariable Integer maDonHang,
            @RequestBody Map<String, Object> request) {

        Map<String, Object> response = new HashMap<>();

        try {
            // Log incoming payload for diagnostics
            String nguoiThayDoi = (String) request.get("nguoiThayDoi");
            String ghiChu = (String) request.getOrDefault("ghiChu", "Bắt đầu chuẩn bị đơn hàng");

            if (nguoiThayDoi == null || nguoiThayDoi.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Thiếu thông tin người thay đổi");
                return ResponseEntity.badRequest().body(response);
            }

            boolean success = orderStatusService.changeOrderStatus(maDonHang,
                    IQuanLyTrangThaiDonHangService.DANG_CHUAN_BI, nguoiThayDoi, ghiChu);

            if (success) {
                response.put("success", true);
                response.put("message", "Bắt đầu chuẩn bị đơn hàng thành công");
                response.put("order", donHangRepository.findById(maDonHang).orElse(null));
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Không thể chuẩn bị đơn hàng");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Giao hàng (DANG_CHUAN_BI → DANG_GIAO)
     * POST /api/warehouse/order-status/{maDonHang}/ship
     */
    @PostMapping("/{maDonHang}/ship")
    public ResponseEntity<Map<String, Object>> shipOrder(
            @PathVariable Integer maDonHang,
            @RequestBody Map<String, Object> request) {

        Map<String, Object> response = new HashMap<>();

        try {
            // Log incoming payload for diagnostics
            String nguoiThayDoi = (String) request.get("nguoiThayDoi");
            String ghiChu = (String) request.getOrDefault("ghiChu", "Bắt đầu giao hàng");

            if (nguoiThayDoi == null || nguoiThayDoi.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Thiếu thông tin người thay đổi");
                return ResponseEntity.badRequest().body(response);
            }

            boolean success = orderStatusService.changeOrderStatus(maDonHang,
                    IQuanLyTrangThaiDonHangService.DANG_GIAO_HANG, nguoiThayDoi, ghiChu);

            if (success) {
                response.put("success", true);
                response.put("message", "Bắt đầu giao hàng thành công");
                response.put("order", donHangRepository.findById(maDonHang).orElse(null));
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Không thể bắt đầu giao hàng");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Hoàn thành đơn hàng (DANG_GIAO → HOAN_THANH)
     * POST /api/warehouse/order-status/{maDonHang}/complete
     */
    @PostMapping("/{maDonHang}/complete")
    public ResponseEntity<Map<String, Object>> completeOrder(
            @PathVariable Integer maDonHang,
            @RequestBody(required = false) Map<String, Object> request) {

        Map<String, Object> response = new HashMap<>();

        try {
            // Log incoming payload for diagnostics (optional payload)

            orderStatusService.capNhatTrangThai(maDonHang,
                    IQuanLyTrangThaiDonHangService.HOAN_THANH,
                    request != null ? (String) request.get("nguoiThayDoi") : "Hệ thống",
                    request != null
                            ? (String) request.getOrDefault("ghiChu",
                                    "Hoàn thành đơn hàng của " + request.get("maKhachHang"))
                            : "Hoàn thành đơn hàng");

            response.put("success", true);
            response.put("message", "Hoàn thành đơn hàng thành công");
            response.put("order", donHangRepository.findById(maDonHang).orElse(null));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Hủy đơn hàng (→ HUY_BO)
     * POST /api/warehouse/order-status/{maDonHang}/cancel
     */
    @PostMapping("/{maDonHang}/cancel")
    public ResponseEntity<Map<String, Object>> cancelOrder(
            @PathVariable Integer maDonHang,
            @RequestBody Map<String, Object> request) {

        Map<String, Object> response = new HashMap<>();

        try {
            // Log incoming payload for diagnostics
            String nguoiThayDoi = (String) request.get("nguoiThayDoi");
            String ghiChu = (String) request.getOrDefault("ghiChu", "Hủy đơn hàng");

            if (nguoiThayDoi == null || nguoiThayDoi.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "Thiếu thông tin người thay đổi");
                return ResponseEntity.badRequest().body(response);
            }

            boolean success = orderStatusService.changeOrderStatus(maDonHang,
                    IQuanLyTrangThaiDonHangService.HUY_BO, nguoiThayDoi, ghiChu);

            if (success) {
                response.put("success", true);
                response.put("message", "Hủy đơn hàng thành công - Đã hủy đặt trước");
                response.put("order", donHangRepository.findById(maDonHang).orElse(null));
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Không thể hủy đơn hàng");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // =================== QUERY OPERATIONS ===================

    /**
     * Lấy lịch sử trạng thái đơn hàng
     * GET /api/v1/quan-ly-trang-thai-don-hang/lich-su-trang-thai/{maDonHang}
     */
    // [ĐÃ SỬA] Đường dẫn
    @GetMapping("/lich-su-trang-thai/{maDonHang}")
    public ResponseEntity<Map<String, Object>> getOrderStatusHistory(@PathVariable Integer maDonHang) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<LichSuTrangThaiDonHang> history = orderStatusService.getOrderStatusHistory(maDonHang);
            response.put("success", true);
            response.put("data", history);
            response.put("count", history.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Lấy danh sách đơn hàng theo trạng thái
     * GET
     * /api/v1/quan-ly-trang-thai-don-hang/don-hang-theo-trang-thai?trangThai=...
     */
    // [ĐÃ SỬA] Đường dẫn và kiểu tham số @PathVariable -> @RequestParam
    @GetMapping("/don-hang-theo-trang-thai")
    public ResponseEntity<Map<String, Object>> getOrdersByStatus(@RequestParam(name = "trangThai") String trangThai) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<DonHang> orders = orderStatusService.getOrdersByStatus(trangThai);
            response.put("success", true);
            response.put("data", orders);
            response.put("count", orders.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Lấy danh sách đơn hàng cần xử lý
     * GET /api/v1/quan-ly-trang-thai-don-hang/don-hang-cho-xu-ly
     */
    // [ĐÃ SỬA] Đường dẫn
    @GetMapping("/don-hang-cho-xu-ly")
    public ResponseEntity<Map<String, Object>> getPendingOrders() {
        Map<String, Object> response = new HashMap<>();
        try {
            List<DonHang> orders = orderStatusService.getPendingOrders();
            response.put("success", true);
            response.put("data", orders);
            response.put("count", orders.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Lấy danh sách đơn hàng đang giao
     * GET /api/v1/quan-ly-trang-thai-don-hang/don-hang-dang-giao
     */
    // [ĐÃ SỬA] Đường dẫn
    @GetMapping("/don-hang-dang-giao")
    public ResponseEntity<Map<String, Object>> getShippingOrders() {
        Map<String, Object> response = new HashMap<>();
        try {
            List<DonHang> orders = orderStatusService.getShippingOrders();
            response.put("success", true);
            response.put("data", orders);
            response.put("count", orders.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * [MỚI] Lấy danh sách đơn hàng cần chú ý
     * GET /api/v1/quan-ly-trang-thai-don-hang/don-hang-can-chu-y
     */
    @GetMapping("/don-hang-can-chu-y")
    public ResponseEntity<Map<String, Object>> getOrdersNeedingAttention() {
        Map<String, Object> response = new HashMap<>();
        try {
            // LƯU Ý: Bạn cần tạo phương thức `getOrdersNeedingAttention` trong Service
            List<DonHang> orders = orderStatusService.getOrdersNeedingAttention();
            response.put("success", true);
            response.put("data", orders);
            response.put("count", orders.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Thống kê thời gian xử lý đơn hàng
     * GET /api/v1/quan-ly-trang-thai-don-hang/thong-ke-thoi-gian-xu-ly
     */
    // [ĐÃ SỬA] Đường dẫn
    @GetMapping("/thong-ke-thoi-gian-xu-ly")
    public ResponseEntity<Map<String, Object>> getProcessingTimeStats() {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Object[]> stats = orderStatusService.getProcessingTimeStats();
            response.put("success", true);
            response.put("data", stats);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}