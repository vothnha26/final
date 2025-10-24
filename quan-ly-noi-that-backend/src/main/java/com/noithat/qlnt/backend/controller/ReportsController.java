package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.service.IDashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportsController {

    @Autowired
    private IDashboardService dashboardService;

    @GetMapping("/customers")
    public ResponseEntity<Map<String, Object>> customersReport() {
        Map<String, Object> resp = new HashMap<>();
        try {
            List<Map<String, Object>> rows = dashboardService.getCustomerMetrics();
            Map<String, Object> data = new HashMap<>();
            data.put("rows", rows);
            data.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            resp.put("success", true);
            resp.put("data", data);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(resp);
        }
    }

    @GetMapping("/sales")
    public ResponseEntity<Map<String, Object>> salesReport() {
        Map<String, Object> resp = new HashMap<>();
        try {
            List<Map<String, Object>> rows = dashboardService.getRevenueSummary();
            Map<String, Object> data = new HashMap<>();
            data.put("rows", rows);
            data.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            resp.put("success", true);
            resp.put("data", data);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(resp);
        }
    }

    @GetMapping("/products")
    public ResponseEntity<Map<String, Object>> productsReport() {
        Map<String, Object> resp = new HashMap<>();
        try {
            List<Map<String, Object>> rows = dashboardService.getSalesByProduct();
            Map<String, Object> data = new HashMap<>();
            data.put("rows", rows);
            data.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            resp.put("success", true);
            resp.put("data", data);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(resp);
        }
    }

    @GetMapping("/inventory")
    public ResponseEntity<Map<String, Object>> inventoryReport() {
        Map<String, Object> resp = new HashMap<>();
        try {
            List<Map<String, Object>> rows = dashboardService.getInventoryMetrics();
            Map<String, Object> data = new HashMap<>();
            data.put("rows", rows);
            data.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            resp.put("success", true);
            resp.put("data", data);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(resp);
        }
    }
    
    /**
     * GET /api/reports/products-analytics
     * Báo cáo chi tiết sản phẩm với nhiều action:
     * - top-revenue: Top sản phẩm theo doanh thu
     * - top-quantity: Top sản phẩm theo số lượng bán
     * - by-category: Doanh thu theo danh mục
     * - by-brand: Doanh thu theo thương hiệu
     * - inventory-turnover: Tốc độ quay vòng tồn kho
     * - rating: Xếp hạng đánh giá sản phẩm
     * - sales-trend: Xu hướng bán theo thời gian
     */
    @GetMapping("/products-analytics")
    public ResponseEntity<Map<String, Object>> productsAnalytics(
            @RequestParam(defaultValue = "top-revenue") String action,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(defaultValue = "10") int topN,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) Integer brandId
    ) {
        Map<String, Object> resp = new HashMap<>();
        try {
            // Always resolve to start/end on backend side
            int d = days <= 0 ? 30 : days;
            LocalDate today = LocalDate.now();
            LocalDate effStart = (startDate != null ? startDate : today.minusDays(d));
            LocalDate effEnd = (endDate != null ? endDate : today);

            List<Map<String, Object>> rows = dashboardService.getProductsReport(
                    action, effStart, effEnd, topN, categoryId, brandId);
            
            Map<String, Object> data = new HashMap<>();
            data.put("rows", rows);
            data.put("action", action);
            data.put("startDate", effStart != null ? effStart.toString() : null);
            data.put("endDate", effEnd != null ? effEnd.toString() : null);
            data.put("generatedAt", LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
            
            resp.put("success", true);
            resp.put("data", data);
            return ResponseEntity.ok(resp);
        } catch (Exception e) {
            resp.put("success", false);
            resp.put("message", e.getMessage());
            return ResponseEntity.internalServerError().body(resp);
        }
    }
}
