package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.dto.response.VoucherReportCustomerUsageResponse;
import com.noithat.qlnt.backend.dto.response.VoucherReportPerformanceResponse;
import com.noithat.qlnt.backend.dto.response.VoucherReportSummaryResponse;
import com.noithat.qlnt.backend.service.VoucherReportService;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/v1/report/voucher")
public class VoucherReportController {
    private final VoucherReportService voucherReportService;

    public VoucherReportController(VoucherReportService voucherReportService) {
        this.voucherReportService = voucherReportService;
    }

    @GetMapping("/summary")
    public List<VoucherReportSummaryResponse> getVoucherSummary(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String maVoucher,
            @RequestParam(required = false) String maChienDich,
            @RequestParam(required = false) Integer hangKhachHang,
            @RequestParam(required = false) Integer topN
    ) {
        return voucherReportService.getVoucherSummary(startDate, endDate, maVoucher, maChienDich, hangKhachHang, topN);
    }

    @GetMapping("/performance")
    public List<VoucherReportPerformanceResponse> getVoucherPerformance(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String maVoucher,
            @RequestParam(required = false) String maChienDich,
            @RequestParam(required = false) Integer hangKhachHang
    ) {
        return voucherReportService.getVoucherPerformance(startDate, endDate, maVoucher, maChienDich, hangKhachHang);
    }

    @GetMapping("/customer-usage")
    public List<VoucherReportCustomerUsageResponse> getVoucherCustomerUsage(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String maVoucher,
            @RequestParam(required = false) String maChienDich,
            @RequestParam(required = false) Integer hangKhachHang,
            @RequestParam(required = false) Integer topN
    ) {
        return voucherReportService.getVoucherCustomerUsage(startDate, endDate, maVoucher, maChienDich, hangKhachHang, topN);
    }
}
