package com.noithat.qlnt.backend.service;

import com.noithat.qlnt.backend.dto.response.VoucherReportCustomerUsageResponse;
import com.noithat.qlnt.backend.dto.response.VoucherReportPerformanceResponse;
import com.noithat.qlnt.backend.dto.response.VoucherReportSummaryResponse;

import java.util.List;

public interface VoucherReportService {
    List<VoucherReportSummaryResponse> getVoucherSummary(String startDate, String endDate, String maVoucher, String maChienDich, Integer hangKhachHang, Integer topN);
    List<VoucherReportPerformanceResponse> getVoucherPerformance(String startDate, String endDate, String maVoucher, String maChienDich, Integer hangKhachHang);
    List<VoucherReportCustomerUsageResponse> getVoucherCustomerUsage(String startDate, String endDate, String maVoucher, String maChienDich, Integer hangKhachHang, Integer topN);
}
