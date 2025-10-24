package com.noithat.qlnt.backend.repository;

import com.noithat.qlnt.backend.dto.response.DiscountReportCustomerUsageResponse;
import com.noithat.qlnt.backend.dto.response.DiscountReportPerformanceResponse;
import com.noithat.qlnt.backend.dto.response.DiscountReportSummaryResponse;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiscountReportRepository {
    List<DiscountReportSummaryResponse> getSummary(String startDate, String endDate, Integer maChuongTrinh, Integer hangKhachHang, Integer topN);
    List<DiscountReportPerformanceResponse> getPerformance(String startDate, String endDate, Integer maChuongTrinh, Integer hangKhachHang);
    List<DiscountReportCustomerUsageResponse> getCustomerUsage(String startDate, String endDate, Integer maChuongTrinh, Integer hangKhachHang, Integer topN);
}
