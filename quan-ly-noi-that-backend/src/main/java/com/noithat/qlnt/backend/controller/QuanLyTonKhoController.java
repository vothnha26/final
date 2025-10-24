package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.entity.BienTheSanPham;
import com.noithat.qlnt.backend.entity.LichSuTonKho;
import com.noithat.qlnt.backend.service.IQuanLyTonKhoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/quan-ly-ton-kho")
public class QuanLyTonKhoController {

    @Autowired
    private IQuanLyTonKhoService stockManagementService;

    // =================== STOCK OPERATIONS (Đã đồng bộ với Postman) ===================

    /**
     * Nhập hàng vào kho
     * POST /api/v1/quan-ly-ton-kho/nhap-kho
     */
    @PostMapping("/nhap-kho")
    public ResponseEntity<Map<String, Object>> nhapKho(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer maBienThe = (Integer) request.get("maBienThe");
            Integer quantity = request.get("soLuong") != null ? (Integer) request.get("soLuong") : (Integer) request.get("quantity");
            String nguoiThucHien = request.get("nguoiNhap") != null ? (String) request.get("nguoiNhap") : (String) request.get("nguoiThucHien");
            String lyDo = (String) request.get("lyDo");

            if (maBienThe == null || quantity == null || nguoiThucHien == null) {
                response.put("success", false);
                response.put("message", "Thiếu thông tin bắt buộc: maBienThe, soLuong, nguoiNhap");
                return ResponseEntity.badRequest().body(response);
            }

            Integer maNhaCungCap = request.get("maNhaCungCap") != null ? (Integer) request.get("maNhaCungCap") : null;
            boolean success = stockManagementService.importStock(maBienThe, quantity, nguoiThucHien, lyDo, maNhaCungCap);

            if (success) {
                response.put("success", true);
                response.put("message", "Nhập kho thành công");
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Nhập kho thất bại");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Xuất hàng khỏi kho
     * POST /api/v1/quan-ly-ton-kho/xuat-kho
     */
    @PostMapping("/xuat-kho")
    public ResponseEntity<Map<String, Object>> xuatKho(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer maBienThe = (Integer) request.get("maBienThe");
            Integer quantity = request.get("soLuong") != null ? (Integer) request.get("soLuong") : (Integer) request.get("quantity");
            String nguoiThucHien = request.get("nguoiXuat") != null ? (String) request.get("nguoiXuat") : (String) request.get("nguoiThucHien");
            String lyDo = (String) request.get("lyDo");
            String maThamChieu = (String) request.get("maThamChieu"); // Optional

            if (maBienThe == null || quantity == null || nguoiThucHien == null) {
                response.put("success", false);
                response.put("message", "Thiếu thông tin bắt buộc: maBienThe, soLuong, nguoiXuat");
                return ResponseEntity.badRequest().body(response);
            }

            boolean success = stockManagementService.exportStock(maBienThe, quantity, maThamChieu, nguoiThucHien, lyDo);

            if (success) {
                response.put("success", true);
                response.put("message", "Xuất kho thành công");
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Xuất kho thất bại - Không đủ hàng tồn kho");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Đặt chỗ hàng
     * POST /api/v1/quan-ly-ton-kho/dat-cho
     */
    @PostMapping("/dat-cho")
    public ResponseEntity<Map<String, Object>> datChoHang(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer maBienThe = (Integer) request.get("maBienThe");
            Integer quantity = request.get("soLuong") != null ? (Integer) request.get("soLuong") : (Integer) request.get("quantity");
            String maThamChieu = null;
            if (request.containsKey("maDonHang")) {
                maThamChieu = "DH" + request.get("maDonHang");
            } else if (request.containsKey("maThamChieu")) {
                maThamChieu = (String) request.get("maThamChieu");
            }
            String nguoiThucHien = request.get("nguoiDat") != null ? (String) request.get("nguoiDat") : "System";

            if (maBienThe == null || quantity == null) {
                response.put("success", false);
                response.put("message", "Thiếu thông tin bắt buộc: maBienThe, soLuong");
                return ResponseEntity.badRequest().body(response);
            }

            boolean success = stockManagementService.reserveProduct(maBienThe, quantity, maThamChieu, nguoiThucHien);

            if (success) {
                response.put("success", true);
                response.put("message", "Đặt chỗ hàng thành công");
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Đặt chỗ hàng thất bại - Không đủ hàng có sẵn");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Hủy đặt chỗ
     * POST /api/v1/quan-ly-ton-kho/huy-dat-cho
     */
    @PostMapping("/huy-dat-cho")
    public ResponseEntity<Map<String, Object>> huyDatCho(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer maBienThe = (Integer) request.get("maBienThe");
            Integer quantity = request.get("soLuong") != null ? (Integer) request.get("soLuong") : (Integer) request.get("quantity");
            String maThamChieu = null;
            if (request.containsKey("maDonHang")) {
                maThamChieu = "DH" + request.get("maDonHang");
            } else if (request.containsKey("maThamChieu")) {
                maThamChieu = (String) request.get("maThamChieu");
            }
            String nguoiThucHien = request.get("nguoiHuy") != null ? (String) request.get("nguoiHuy") : "System";

            if (maBienThe == null || quantity == null) {
                response.put("success", false);
                response.put("message", "Thiếu thông tin bắt buộc: maBienThe, soLuong");
                return ResponseEntity.badRequest().body(response);
            }

            boolean success = stockManagementService.releaseReservation(maBienThe, quantity, maThamChieu, nguoiThucHien);

            if (success) {
                response.put("success", true);
                response.put("message", "Hủy đặt chỗ thành công");
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Hủy đặt chỗ thất bại");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Giải phóng hàng (release reservation)
     * POST /api/v1/quan-ly-ton-kho/giai-phong
     */
    @PostMapping("/giai-phong")
    public ResponseEntity<Map<String, Object>> giaiPhong(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer maBienThe = (Integer) request.get("maBienThe");
            Integer quantity = request.get("soLuong") != null ? (Integer) request.get("soLuong") : (Integer) request.get("quantity");
            String maThamChieu = request.containsKey("maDonHang") ? "DH" + request.get("maDonHang") : (String) request.get("maThamChieu");
            String nguoiThucHien = request.get("nguoi") != null ? (String) request.get("nguoi") : (String) request.get("nguoiThucHien");

            if (maBienThe == null || quantity == null) {
                response.put("success", false);
                response.put("message", "Thiếu thông tin bắt buộc: maBienThe, soLuong");
                return ResponseEntity.badRequest().body(response);
            }

            boolean success = stockManagementService.releaseReservation(maBienThe, quantity, maThamChieu, nguoiThucHien);

            if (success) {
                response.put("success", true);
                response.put("message", "Giải phóng hàng thành công");
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Giải phóng hàng thất bại");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Xác nhận bán
     * POST /api/v1/quan-ly-ton-kho/xac-nhan-ban
     */
    @PostMapping("/xac-nhan-ban")
    public ResponseEntity<Map<String, Object>> xacNhanBan(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer maBienThe = (Integer) request.get("maBienThe");
            Integer quantity = request.get("soLuong") != null ? (Integer) request.get("soLuong") : (Integer) request.get("quantity");
            String maThamChieu = null;
            if (request.containsKey("maDonHang")) {
                maThamChieu = "DH" + request.get("maDonHang");
            } else if (request.containsKey("maThamChieu")) {
                maThamChieu = (String) request.get("maThamChieu");
            }
            String nguoiThucHien = request.get("nguoiBan") != null ? (String) request.get("nguoiBan") : "System";

            if (maBienThe == null || quantity == null) {
                response.put("success", false);
                response.put("message", "Thiếu thông tin bắt buộc: maBienThe, soLuong");
                return ResponseEntity.badRequest().body(response);
            }

            boolean success = stockManagementService.confirmSale(maBienThe, quantity, maThamChieu, nguoiThucHien);

            if (success) {
                response.put("success", true);
                response.put("message", "Xác nhận bán thành công");
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Xác nhận bán thất bại");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Điều chỉnh tồn kho
     * POST /api/v1/quan-ly-ton-kho/dieu-chinh
     */
    @PostMapping("/dieu-chinh")
    public ResponseEntity<Map<String, Object>> dieuChinhTonKho(@RequestBody Map<String, Object> request) {
        Map<String, Object> response = new HashMap<>();
        try {
            Integer maBienThe = (Integer) request.get("maBienThe");
            Integer newQuantity = request.get("soLuongMoi") != null ? (Integer) request.get("soLuongMoi") : (Integer) request.get("newQuantity");
            String nguoiThucHien = request.get("nguoiDieuChinh") != null ? (String) request.get("nguoiDieuChinh") : (String) request.get("nguoiThucHien");
            String lyDo = (String) request.get("lyDo");

            if (maBienThe == null || newQuantity == null || nguoiThucHien == null) {
                response.put("success", false);
                response.put("message", "Thiếu thông tin bắt buộc: maBienThe, soLuongMoi, nguoiDieuChinh");
                return ResponseEntity.badRequest().body(response);
            }

            boolean success = stockManagementService.adjustStock(maBienThe, newQuantity, lyDo, nguoiThucHien);

            if (success) {
                response.put("success", true);
                response.put("message", "Điều chỉnh tồn kho thành công");
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("message", "Điều chỉnh tồn kho thất bại");
                return ResponseEntity.badRequest().body(response);
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    // =================== QUERY OPERATIONS (Đã đồng bộ với Postman) ===================

    /**
     * [MỚI] Lấy thông tin tồn kho hiện tại của một biến thể
     * GET /api/v1/quan-ly-ton-kho/ton-kho-hien-tai/{maBienThe}
     */
    @GetMapping("/ton-kho-hien-tai/{maBienThe}")
    public ResponseEntity<Map<String, Object>> getTonKhoHienTai(@PathVariable Integer maBienThe) {
        // Service method đã trả về ResponseEntity, chỉ cần gọi trực tiếp
        return stockManagementService.getCurrentStockInfo(maBienThe);
    }
    
    /**
     * Lấy lịch sử tồn kho của một biến thể
     * GET /api/v1/quan-ly-ton-kho/lich-su-xuat-nhap/{maBienThe}
     */
    @GetMapping("/lich-su-xuat-nhap/{maBienThe}")
    public ResponseEntity<Map<String, Object>> getStockHistory(@PathVariable Integer maBienThe) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<LichSuTonKho> history = stockManagementService.getStockHistory(maBienThe);
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

    // Backwards-compatible route: /lich-su/{maBienThe}
    @GetMapping("/lich-su/{maBienThe}")
    public ResponseEntity<Map<String, Object>> getStockHistoryAlias(@PathVariable Integer maBienThe) {
        return getStockHistory(maBienThe);
    }

    /**
     * Lấy lịch sử tổng hợp (bao gồm CẢ Nhập VÀ Xuất)
     * GET /api/v1/quan-ly-ton-kho/lich-su-xuat-nhap
     * - scope=all: trả về toàn bộ lịch sử nhập
     * - from, to (ISO-8601): lọc theo khoảng thời gian
     */
    @GetMapping("/lich-su-xuat-nhap")
    public ResponseEntity<Map<String, Object>> getCombinedNhapHistory(
            @RequestParam(value = "scope", required = false) String scope,
            @RequestParam(value = "from", required = false) String fromStr,
            @RequestParam(value = "to", required = false) String toStr) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<LichSuTonKho> data;
            if (fromStr != null && toStr != null) {
                LocalDateTime from = LocalDateTime.parse(fromStr);
                LocalDateTime to = LocalDateTime.parse(toStr);
                data = stockManagementService.getStockHistoryBetween(from, to);
            } else if ("all".equalsIgnoreCase(scope)) {
                data = stockManagementService.getAllStockHistory();
            } else {
                // Mặc định: 90 ngày gần nhất
                LocalDateTime to = LocalDateTime.now();
                LocalDateTime from = to.minusDays(90);
                data = stockManagementService.getStockHistoryBetween(from, to);
            }

            response.put("success", true);
            response.put("data", data);
            response.put("count", data != null ? data.size() : 0);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Lấy lịch sử nhập kho tổng hợp (alias)
     * GET /api/v1/quan-ly-ton-kho/lich-su-xuat-nhap/tong-hop
     */
    @GetMapping("/lich-su-xuat-nhap/tong-hop")
    public ResponseEntity<Map<String, Object>> getCombinedNhapHistoryAlias(
            @RequestParam(value = "from", required = false) String fromStr,
            @RequestParam(value = "to", required = false) String toStr) {
        // Alias gọi về endpoint chính, ưu tiên from/to nếu có, nếu không thì scope=all
        if (fromStr != null && toStr != null) {
            return getCombinedNhapHistory(null, fromStr, toStr);
        }
        return getCombinedNhapHistory("all", null, null);
    }

    /**
     * Lấy danh sách sản phẩm sắp hết hàng
     * GET /api/v1/quan-ly-ton-kho/san-pham-sap-het
     */
    @GetMapping("/san-pham-sap-het")
    public ResponseEntity<Map<String, Object>> getLowStockProducts() {
        Map<String, Object> response = new HashMap<>();
        try {
            List<BienTheSanPham> products = stockManagementService.getLowStockProducts();
            response.put("success", true);
            response.put("data", products);
            response.put("count", products.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // Backwards-compatible: /sap-het-hang
    @GetMapping("/sap-het-hang")
    public ResponseEntity<Map<String, Object>> getLowStockProductsAlias() {
        return getLowStockProducts();
    }

    /**
     * Lấy danh sách sản phẩm hết hàng
     * GET /api/v1/quan-ly-ton-kho/san-pham-het-hang
     */
    @GetMapping("/san-pham-het-hang")
    public ResponseEntity<Map<String, Object>> getOutOfStockProducts() {
        Map<String, Object> response = new HashMap<>();
        try {
            List<BienTheSanPham> products = stockManagementService.getOutOfStockProducts();
            response.put("success", true);
            response.put("data", products);
            response.put("count", products.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    // Backwards-compatible: /het-hang
    @GetMapping("/het-hang")
    public ResponseEntity<Map<String, Object>> getOutOfStockProductsAlias() {
        return getOutOfStockProducts();
    }

    /**
     * Thống kê tồn kho theo sản phẩm
     * GET /api/v1/quan-ly-ton-kho/tong-ket-theo-san-pham
     */
    @GetMapping("/tong-ket-theo-san-pham")
    public ResponseEntity<Map<String, Object>> getStockSummaryByProduct() {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Object[]> summary = stockManagementService.getStockSummaryByProduct();
            response.put("success", true);
            response.put("data", summary);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Thống kê tồn kho theo danh mục
     * GET /api/v1/quan-ly-ton-kho/tong-ket-theo-danh-muc
     */
    @GetMapping("/tong-ket-theo-danh-muc")
    public ResponseEntity<Map<String, Object>> getStockSummaryByCategory() {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Object[]> summary = stockManagementService.getStockSummaryByCategory();
            response.put("success", true);
            response.put("data", summary);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Tính tổng giá trị tồn kho
     * GET /api/v1/quan-ly-ton-kho/tong-gia-tri-ton-kho
     */
    @GetMapping("/tong-gia-tri-ton-kho")
    public ResponseEntity<Map<String, Object>> getTotalStockValue() {
        Map<String, Object> response = new HashMap<>();
        try {
            Double totalValue = stockManagementService.getTotalStockValue();
            response.put("success", true);
            response.put("totalValue", totalValue);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Tổng quan tồn kho (overview)
     * GET /api/v1/quan-ly-ton-kho/tong-quan
     */
    @GetMapping("/tong-quan")
    public ResponseEntity<Map<String, Object>> getInventoryOverview() {
        Map<String, Object> response = new HashMap<>();
        try {
            Double totalValue = stockManagementService.getTotalStockValue();
            List<BienTheSanPham> lowStock = stockManagementService.getLowStockProducts();
            List<BienTheSanPham> outOfStock = stockManagementService.getOutOfStockProducts();
            List<Object[]> productSummary = stockManagementService.getStockSummaryByProduct();

            Map<String, Object> overview = new HashMap<>();
            overview.put("tongGiaTriTonKho", totalValue != null ? totalValue : 0.0);
            overview.put("soLuongSanPhamSapHet", lowStock != null ? lowStock.size() : 0);
            overview.put("soLuongSanPhamHetHang", outOfStock != null ? outOfStock.size() : 0);
            overview.put("soLuongMatHang", productSummary != null ? productSummary.size() : 0);
            overview.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

            response.put("success", true);
            response.put("data", overview);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}