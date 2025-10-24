package com.noithat.qlnt.backend.repository;

import com.noithat.qlnt.backend.dto.response.VoucherReportSummaryResponse;
import com.noithat.qlnt.backend.dto.response.VoucherReportPerformanceResponse;
import com.noithat.qlnt.backend.dto.response.VoucherReportCustomerUsageResponse;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface VoucherReportRepository {
    List<VoucherReportSummaryResponse> getSummary(String startDate, String endDate, String maVoucher, String maChienDich, Integer hangKhachHang, Integer topN);
    List<VoucherReportPerformanceResponse> getPerformance(String startDate, String endDate, String maVoucher, String maChienDich, Integer hangKhachHang);
    List<VoucherReportCustomerUsageResponse> getCustomerUsage(String startDate, String endDate, String maVoucher, String maChienDich, Integer hangKhachHang, Integer topN);
}
