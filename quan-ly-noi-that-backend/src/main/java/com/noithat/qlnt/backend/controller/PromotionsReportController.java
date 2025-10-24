package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.service.PromotionsReportService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/report/promotions")
public class PromotionsReportController {
    private final PromotionsReportService service;

    public PromotionsReportController(PromotionsReportService service) {
        this.service = service;
    }

    // Summary endpoint for both voucher and discount_program
    @GetMapping("/summary")
    public List<Map<String, Object>> summary(
            @RequestParam(defaultValue = "voucher") String promotionType,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String maVoucherCode,
            @RequestParam(required = false) Integer maChuongTrinh,
            @RequestParam(required = false) Integer hangKhachHang,
            @RequestParam(required = false) Integer topN
    ) {
        return service.summary(promotionType, startDate, endDate, maVoucherCode, maChuongTrinh, hangKhachHang, topN);
    }

    // Performance endpoint for both types
    @GetMapping("/performance")
    public List<Map<String, Object>> performance(
            @RequestParam(defaultValue = "voucher") String promotionType,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String maVoucherCode,
            @RequestParam(required = false) Integer maChuongTrinh,
            @RequestParam(required = false) Integer hangKhachHang
    ) {
        return service.performance(promotionType, startDate, endDate, maVoucherCode, maChuongTrinh, hangKhachHang);
    }

    // Customer usage endpoint for both types
    @GetMapping("/customer-usage")
    public List<Map<String, Object>> customerUsage(
            @RequestParam(defaultValue = "voucher") String promotionType,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String maVoucherCode,
            @RequestParam(required = false) Integer maChuongTrinh,
            @RequestParam(required = false) Integer hangKhachHang,
            @RequestParam(required = false) Integer topN
    ) {
        return service.customerUsage(promotionType, startDate, endDate, maVoucherCode, maChuongTrinh, hangKhachHang, topN);
    }

    // Product performance endpoint for discount_program
    @GetMapping("/product-performance")
    public List<Map<String, Object>> productPerformance(
            @RequestParam(defaultValue = "discount_program") String promotionType,
            @RequestParam(defaultValue = "top") String type, // top or bottom
            @RequestParam(defaultValue = "discount_value") String sortBy, // discount_value or quantity_sold
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) Integer maChuongTrinh,
            @RequestParam(required = false) Integer topN
    ) {
        return service.productPerformance(type, sortBy, startDate, endDate, maChuongTrinh, topN);
    }
}
