package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.dto.response.DiscountReportCustomerUsageResponse;
import com.noithat.qlnt.backend.dto.response.DiscountReportPerformanceResponse;
import com.noithat.qlnt.backend.dto.response.DiscountReportSummaryResponse;
import com.noithat.qlnt.backend.service.DiscountReportService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/report/discount")
public class DiscountReportController {
    private final DiscountReportService service;

    public DiscountReportController(DiscountReportService service) {
        this.service = service;
    }

    @GetMapping("/summary")
    public List<DiscountReportSummaryResponse> summary(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) Integer maChuongTrinh,
            @RequestParam(required = false) Integer hangKhachHang,
            @RequestParam(required = false) Integer topN
    ) {
        return service.getDiscountSummary(startDate, endDate, maChuongTrinh, hangKhachHang, topN);
    }

    @GetMapping("/performance")
    public List<DiscountReportPerformanceResponse> performance(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) Integer maChuongTrinh,
            @RequestParam(required = false) Integer hangKhachHang
    ) {
        return service.getDiscountPerformance(startDate, endDate, maChuongTrinh, hangKhachHang);
    }

    @GetMapping("/customer-usage")
    public List<DiscountReportCustomerUsageResponse> customerUsage(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) Integer maChuongTrinh,
            @RequestParam(required = false) Integer hangKhachHang,
            @RequestParam(required = false) Integer topN
    ) {
        return service.getDiscountCustomerUsage(startDate, endDate, maChuongTrinh, hangKhachHang, topN);
    }
}
