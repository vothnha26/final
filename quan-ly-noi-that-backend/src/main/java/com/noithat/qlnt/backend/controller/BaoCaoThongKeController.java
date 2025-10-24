package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.entity.BienTheSanPham;
import com.noithat.qlnt.backend.service.IQuanLyTonKhoService;
import com.noithat.qlnt.backend.service.IQuanLyTrangThaiDonHangService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/bao-cao-thong-ke")
public class BaoCaoThongKeController {

    @Autowired
    private IQuanLyTonKhoService quanLyTonKhoService;

    @Autowired
    private IQuanLyTrangThaiDonHangService quanLyTrangThaiDonHangService;

    @Autowired
    private com.noithat.qlnt.backend.service.IDonHangService donHangService;

    @Autowired
    private com.noithat.qlnt.backend.service.IKhachHangService khachHangService;

    @Autowired
    private com.noithat.qlnt.backend.repository.KhachHangRepository khachHangRepository;

    @Autowired
    private com.noithat.qlnt.backend.repository.HangThanhVienRepository hangThanhVienRepository;

    @Autowired
    private com.noithat.qlnt.backend.repository.ChiTietDonHangRepository chiTietDonHangRepository;

    @Autowired
    private com.noithat.qlnt.backend.service.IDashboardService dashboardService;
    
    /**
     * Lấy dữ liệu tổng quan cho Dashboard
     * GET /api/v1/bao-cao-thong-ke/tong-quan-dashboard
     */
    // [ĐÃ SỬA] Đường dẫn
    @GetMapping("/tong-quan-dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardOverview() {
        Map<String, Object> response = new HashMap<>();
        try {
            // Thống kê tồn kho
            Double totalStockValue = quanLyTonKhoService.getTotalStockValue();
            List<BienTheSanPham> lowStockProducts = quanLyTonKhoService.getLowStockProducts();
            List<BienTheSanPham> outOfStockProducts = quanLyTonKhoService.getOutOfStockProducts();

            // Thống kê đơn hàng
            var pendingOrders = quanLyTrangThaiDonHangService.getPendingOrders();
            var shippingOrders = quanLyTrangThaiDonHangService.getShippingOrders();


            // Tạo dashboard data
            Map<String, Object> dashboard = new HashMap<>();
            dashboard.put("tongGiaTriTonKho", totalStockValue != null ? totalStockValue : 0.0);
            dashboard.put("soLuongSanPhamSapHet", lowStockProducts.size());
            dashboard.put("soLuongSanPhamHetHang", outOfStockProducts.size());
            dashboard.put("soDonHangChoXuLy", pendingOrders.size());
            dashboard.put("soDonHangDangGiao", shippingOrders.size());
            dashboard.put("lastUpdated", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

            response.put("success", true);
            response.put("data", dashboard);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Endpoint trả về các số liệu tổng quan (từ stored-proc)
     * GET /api/v1/bao-cao-thong-ke/overview-metrics
     */
    @GetMapping("/overview-metrics")
    public ResponseEntity<Map<String, Object>> getOverviewMetrics() {
        Map<String, Object> response = new HashMap<>();
        try {
            var rows = dashboardService.getOverviewMetrics();
            Map<String, Object> data = new HashMap<>();
            data.put("rows", rows);
            data.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            response.put("success", true);
            response.put("data", data);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/revenue-trend")
    public ResponseEntity<Map<String, Object>> getRevenueTrend() {
        Map<String, Object> response = new HashMap<>();
        try {
            var rows = dashboardService.getRevenueTrend();
            Map<String, Object> data = new HashMap<>();
            data.put("rows", rows);
            data.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            response.put("success", true);
            response.put("data", data);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/sales-by-product")
    public ResponseEntity<Map<String, Object>> getSalesByProduct() {
        Map<String, Object> response = new HashMap<>();
        try {
            var rows = dashboardService.getSalesByProduct();
            Map<String, Object> data = new HashMap<>();
            data.put("rows", rows);
            data.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            response.put("success", true);
            response.put("data", data);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/customer-metrics")
    public ResponseEntity<Map<String, Object>> getCustomerMetrics() {
        Map<String, Object> response = new HashMap<>();
        try {
            var rows = dashboardService.getCustomerMetrics();
            Map<String, Object> data = new HashMap<>();
            data.put("rows", rows);
            data.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            response.put("success", true);
            response.put("data", data);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/inventory-metrics")
    public ResponseEntity<Map<String, Object>> getInventoryMetricsProc() {
        Map<String, Object> response = new HashMap<>();
        try {
            var rows = dashboardService.getInventoryMetrics();
            Map<String, Object> data = new HashMap<>();
            data.put("rows", rows);
            data.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            response.put("success", true);
            response.put("data", data);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/inventory-alerts-proc")
    public ResponseEntity<Map<String, Object>> getInventoryAlertsProc() {
        Map<String, Object> response = new HashMap<>();
        try {
            var rows = dashboardService.getInventoryAlerts();
            Map<String, Object> data = new HashMap<>();
            data.put("rows", rows);
            data.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            response.put("success", true);
            response.put("data", data);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/revenue-summary")
    public ResponseEntity<Map<String, Object>> getRevenueSummaryProc(@org.springframework.web.bind.annotation.RequestParam(value = "days", required = false) Integer days) {
        Map<String, Object> response = new HashMap<>();
        try {
            int d = (days == null || days <= 0) ? 30 : days;
            var rows = dashboardService.getRevenueSummary(d);
            Map<String, Object> data = new HashMap<>();
            data.put("rows", rows);
            data.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            response.put("success", true);
            response.put("data", data);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/sales-metrics")
    public ResponseEntity<Map<String, Object>> getSalesMetricsProc() {
        Map<String, Object> response = new HashMap<>();
        try {
            var rows = dashboardService.getSalesMetrics();
            Map<String, Object> data = new HashMap<>();
            data.put("rows", rows);
            data.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            response.put("success", true);
            response.put("data", data);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    @GetMapping("/vip-customer-analysis")
    public ResponseEntity<Map<String, Object>> getVipCustomerAnalysisProc() {
        Map<String, Object> response = new HashMap<>();
        try {
            var rows = dashboardService.getVipCustomerAnalysis();
            Map<String, Object> data = new HashMap<>();
            data.put("rows", rows);
            data.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            response.put("success", true);
            response.put("data", data);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Consolidated Customer Report
     * GET /api/v1/bao-cao-thong-ke/customers/report?action=segmentation|growth|top_spenders&days=30&topN=10
     */
    @GetMapping("/customers/report")
    public ResponseEntity<Map<String, Object>> getCustomersReport(
            @org.springframework.web.bind.annotation.RequestParam("action") String action,
            @org.springframework.web.bind.annotation.RequestParam(value = "days", required = false) Integer days,
            @org.springframework.web.bind.annotation.RequestParam(value = "topN", required = false) Integer topN,
            @org.springframework.web.bind.annotation.RequestParam(value = "startDate", required = false) String startDate,
            @org.springframework.web.bind.annotation.RequestParam(value = "endDate", required = false) String endDate
    ) {
        Map<String, Object> response = new HashMap<>();
        try {            
            int n = (topN == null || topN <= 0) ? 10 : topN;
            java.time.LocalDate sd = null;
            java.time.LocalDate ed = null;
            if (startDate != null && !startDate.isBlank() && endDate != null && !endDate.isBlank()) {
                sd = java.time.LocalDate.parse(startDate);
                ed = java.time.LocalDate.parse(endDate);
            }
            java.util.List<java.util.Map<String, Object>> rows;
            if (sd != null && ed != null) {
                rows = dashboardService.getCustomerReport(action, sd, ed, n);
            } else {
                int d = (days == null || days <= 0) ? 30 : days;
                rows = dashboardService.getCustomerReport(action, d, n);
            }
            
            Map<String, Object> data = new HashMap<>();
            data.put("rows", rows);
            data.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            response.put("success", true);
            response.put("data", data);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Advanced Customer Analytics
     * GET /api/v1/bao-cao-thong-ke/customers/analytics?action=rfm|retention_cohort|voucher_usage|purchase_frequency&days=30
     * Or with date range: &startDate=2024-01-01&endDate=2024-12-31
     */
    @GetMapping("/customers/analytics")
    public ResponseEntity<Map<String, Object>> getCustomerAnalytics(
            @org.springframework.web.bind.annotation.RequestParam("action") String action,
            @org.springframework.web.bind.annotation.RequestParam(value = "days", required = false) Integer days,
            @org.springframework.web.bind.annotation.RequestParam(value = "startDate", required = false) String startDate,
            @org.springframework.web.bind.annotation.RequestParam(value = "endDate", required = false) String endDate
    ) {
        Map<String, Object> response = new HashMap<>();
        try {
            java.time.LocalDate sd = null;
            java.time.LocalDate ed = null;
            if (startDate != null && !startDate.isBlank() && endDate != null && !endDate.isBlank()) {
                sd = java.time.LocalDate.parse(startDate);
                ed = java.time.LocalDate.parse(endDate);
            }
            
            java.util.List<java.util.Map<String, Object>> rows;
            if (sd != null && ed != null) {
                rows = dashboardService.getCustomerAnalytics(action, sd, ed);
            } else {
                int d = (days == null || days <= 0) ? 30 : days;
                rows = dashboardService.getCustomerAnalytics(action, d);
            }
            
            Map<String, Object> data = new HashMap<>();
            data.put("action", action);
            data.put("rows", rows);
            data.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            response.put("success", true);
            response.put("data", data);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Báo cáo tồn kho
     * GET /api/v1/bao-cao-thong-ke/bao-cao-ton-kho
     */
    // [ĐÃ SỬA] Đường dẫn
    @GetMapping("/bao-cao-ton-kho")
    public ResponseEntity<Map<String, Object>> getStockReportSummary() {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Object[]> productSummary = quanLyTonKhoService.getStockSummaryByProduct();
            List<Object[]> categorySummary = quanLyTonKhoService.getStockSummaryByCategory();
            Double totalValue = quanLyTonKhoService.getTotalStockValue();

            Map<String, Object> report = new HashMap<>();
            report.put("tongKetTheoSanPham", productSummary);
            report.put("tongKetTheoDanhMuc", categorySummary);
            report.put("tongGiaTriTonKho", totalValue);
            report.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

            response.put("success", true);
            response.put("data", report);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Cảnh báo tồn kho
     * GET /api/v1/bao-cao-thong-ke/canh-bao-ton-kho
     */
    // [ĐÃ SỬA] Đường dẫn
    @GetMapping("/canh-bao-ton-kho")
    public ResponseEntity<Map<String, Object>> getStockAlerts() {
        Map<String, Object> response = new HashMap<>();
        try {
            List<BienTheSanPham> lowStockProducts = quanLyTonKhoService.getLowStockProducts();
            List<BienTheSanPham> outOfStockProducts = quanLyTonKhoService.getOutOfStockProducts();

            Map<String, Object> alerts = new HashMap<>();
            alerts.put("sanPhamSapHet", lowStockProducts);
            alerts.put("sanPhamHetHang", outOfStockProducts);
            alerts.put("soLuongSapHet", lowStockProducts.size());
            alerts.put("soLuongHetHang", outOfStockProducts.size());
            alerts.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

            response.put("success", true);
            response.put("data", alerts);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Tổng kết trạng thái đơn hàng
     * GET /api/v1/bao-cao-thong-ke/tong-ket-trang-thai-don-hang
     */
    // [ĐÃ SỬA] Đường dẫn
    @GetMapping("/tong-ket-trang-thai-don-hang")
    public ResponseEntity<Map<String, Object>> getOrderStatusSummary() {
        Map<String, Object> response = new HashMap<>();
        try {
            // Giả sử service có một phương thức để lấy số lượng theo từng trạng thái
            Map<String, Long> statusCounts = quanLyTrangThaiDonHangService.countOrdersByStatus();

            Map<String, Object> summary = new HashMap<>();
            summary.put("thongKeTrangThai", statusCounts);
            summary.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

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
     * Báo cáo hiệu suất xử lý đơn hàng
     * GET /api/v1/bao-cao-thong-ke/hieu-suat-xu-ly-don-hang
     */
    // [ĐÃ SỬA] Đường dẫn
    @GetMapping("/hieu-suat-xu-ly-don-hang")
    public ResponseEntity<Map<String, Object>> getOrderProcessingPerformance() {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Object[]> processingStats = quanLyTrangThaiDonHangService.getProcessingTimeStats();
            
            Map<String, Object> report = new HashMap<>();
            report.put("thongKeThoiGianXuLy", processingStats);
            report.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            
            response.put("success", true);
            response.put("data", report);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
    
    /**
     * Báo cáo kiểm kê
     * GET /api/v1/bao-cao-thong-ke/bao-cao-kiem-ke
     */
    // [ĐÃ SỬA] Đường dẫn
    @GetMapping("/bao-cao-kiem-ke")
    public ResponseEntity<Map<String, Object>> getInventoryReportSummary() {
        Map<String, Object> response = new HashMap<>();
        try {
            
            Map<String, Object> summary = new HashMap<>();
            summary.put("soKiemKeDangThucHien", 0);
            summary.put("thongKeChung", new HashMap<>());
            summary.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            
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
     * Báo cáo doanh thu bán hàng
     * GET /api/v1/bao-cao-thong-ke/bao-cao-doanh-thu
     */
    @GetMapping("/bao-cao-doanh-thu")
    public ResponseEntity<Map<String, Object>> getRevenueReport() {
        Map<String, Object> response = new HashMap<>();
        try {
            var stats = donHangService.thongKeBanHang(); // ThongKeBanHangResponse
            Map<String, Object> data = new HashMap<>();
            data.put("tongDonHang", stats.getTongDonHang());
            data.put("choXuLy", stats.getChoXuLy());
            data.put("hoanThanh", stats.getHoanThanh());
            data.put("doanhThuHomNay", stats.getDoanhThuHomNay());
            data.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

            response.put("success", true);
            response.put("data", data);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Báo cáo khách hàng
     * GET /api/v1/bao-cao-thong-ke/bao-cao-khach-hang
     */
    @GetMapping("/bao-cao-khach-hang")
    public ResponseEntity<Map<String, Object>> getCustomerReport() {
        Map<String, Object> response = new HashMap<>();
        try {
            // Lấy tất cả khách hàng
            var allCustomers = khachHangService.getAll();
            long totalCustomers = allCustomers.size();

            // Thống kê theo hạng thành viên
            var allTiers = hangThanhVienRepository.findAll();
            Map<String, Object> tierStats = new HashMap<>();
            
            for (var tier : allTiers) {
                long count = khachHangRepository.countByHangThanhVien_MaHangThanhVien(tier.getMaHangThanhVien());
                tierStats.put(tier.getTenHang(), count);
            }

            // Tính tổng điểm thưởng của tất cả khách hàng
            int totalLoyaltyPoints = allCustomers.stream()
                .mapToInt(k -> k.getDiemThuong() != null ? k.getDiemThuong() : 0)
                .sum();

            // Tạo báo cáo
            Map<String, Object> report = new HashMap<>();
            report.put("tongSoKhachHang", totalCustomers);
            report.put("thongKeTheoHangThanhVien", tierStats);
            report.put("tongDiemThuong", totalLoyaltyPoints);
            report.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));

            response.put("success", true);
            response.put("data", report);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Báo cáo sản phẩm bán chạy
     * GET /api/v1/bao-cao-thong-ke/san-pham-ban-chay?limit=10
     */
    @GetMapping("/san-pham-ban-chay")
    public ResponseEntity<Map<String, Object>> getTopSellingProducts(
            @RequestParam(value = "limit", defaultValue = "10") Integer limit) {
        Map<String, Object> response = new HashMap<>();
        try {
            // Validate limit
            if (limit == null || limit <= 0) {
                limit = 10;
            }
            if (limit > 100) {
                limit = 100; // Giới hạn tối đa 100 sản phẩm
            }
            
            // Lấy dữ liệu sản phẩm bán chạy
            List<Object[]> topProducts = chiTietDonHangRepository.findTopSellingProducts();
            
            // Giới hạn số lượng kết quả
            int actualLimit = Math.min(limit, topProducts.size());
            List<Object[]> limitedProducts = topProducts.subList(0, actualLimit);
            
            // Chuyển đổi dữ liệu sang format dễ đọc
            List<Map<String, Object>> productList = new java.util.ArrayList<>();
            int rank = 1;
            for (Object[] row : limitedProducts) {
                Map<String, Object> product = new HashMap<>();
                product.put("rank", rank++);
                product.put("maBienThe", row[0]);
                product.put("tenSanPham", row[1]);
                product.put("sku", row[2]);
                product.put("tongSoLuongBan", row[3]);
                product.put("tongDoanhThu", row[4]);
                productList.add(product);
            }
            
            Map<String, Object> report = new HashMap<>();
            report.put("sanPhamBanChay", productList);
            report.put("soLuongHienThi", actualLimit);
            report.put("tongSoSanPham", topProducts.size());
            report.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            
            response.put("success", true);
            response.put("data", report);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * Cảnh báo hệ thống
     * GET /api/v1/bao-cao-thong-ke/canh-bao-he-thong
     */
    // [ĐÃ SỬA] Đường dẫn
    @GetMapping("/canh-bao-he-thong")
    public ResponseEntity<Map<String, Object>> getSystemAlerts() {
        Map<String, Object> response = new HashMap<>();
        try {
            Map<String, Object> healthCheck = new HashMap<>();

            boolean hasLowStock = !quanLyTonKhoService.getLowStockProducts().isEmpty();
            boolean hasOutOfStock = !quanLyTonKhoService.getOutOfStockProducts().isEmpty();
            boolean hasPendingOrders = !quanLyTrangThaiDonHangService.getPendingOrders().isEmpty();

            String systemStatus;
            if (hasOutOfStock) {
                systemStatus = "CRITICAL"; // Có sản phẩm hết hàng
            } else if (hasLowStock || hasPendingOrders) {
                systemStatus = "WARNING"; // Có cảnh báo
            } else {
                systemStatus = "HEALTHY"; // Tất cả bình thường
            }
            
            healthCheck.put("trangThaiHeThong", systemStatus);
            healthCheck.put("cacCanhBao", Map.of(
                "coSanPhamSapHetHang", hasLowStock,
                "coSanPhamHetHang", hasOutOfStock,
                "coDonHangChoXuLy", hasPendingOrders
            ));
            healthCheck.put("checkedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            
            response.put("success", true);
            response.put("data", healthCheck);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
}