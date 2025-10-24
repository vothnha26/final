package com.noithat.qlnt.backend.service;

import com.noithat.qlnt.backend.dto.response.DiscountReportCustomerUsageResponse;
import com.noithat.qlnt.backend.dto.response.DiscountReportPerformanceResponse;
import com.noithat.qlnt.backend.dto.response.DiscountReportSummaryResponse;

import java.util.List;

public interface DiscountReportService {
    List<DiscountReportSummaryResponse> getDiscountSummary(String startDate, String endDate, Integer maChuongTrinh, Integer hangKhachHang, Integer topN);
    List<DiscountReportPerformanceResponse> getDiscountPerformance(String startDate, String endDate, Integer maChuongTrinh, Integer hangKhachHang);
    List<DiscountReportCustomerUsageResponse> getDiscountCustomerUsage(String startDate, String endDate, Integer maChuongTrinh, Integer hangKhachHang, Integer topN);
}
