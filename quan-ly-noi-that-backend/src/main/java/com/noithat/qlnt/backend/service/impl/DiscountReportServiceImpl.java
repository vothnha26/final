package com.noithat.qlnt.backend.service.impl;

import com.noithat.qlnt.backend.dto.response.DiscountReportCustomerUsageResponse;
import com.noithat.qlnt.backend.dto.response.DiscountReportPerformanceResponse;
import com.noithat.qlnt.backend.dto.response.DiscountReportSummaryResponse;
import com.noithat.qlnt.backend.repository.DiscountReportRepository;
import com.noithat.qlnt.backend.service.DiscountReportService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DiscountReportServiceImpl implements DiscountReportService {
    private final DiscountReportRepository repository;

    public DiscountReportServiceImpl(DiscountReportRepository repository) {
        this.repository = repository;
    }

    @Override
    public List<DiscountReportSummaryResponse> getDiscountSummary(String startDate, String endDate, Integer maChuongTrinh, Integer hangKhachHang, Integer topN) {
        return repository.getSummary(startDate, endDate, maChuongTrinh, hangKhachHang, topN);
    }

    @Override
    public List<DiscountReportPerformanceResponse> getDiscountPerformance(String startDate, String endDate, Integer maChuongTrinh, Integer hangKhachHang) {
        return repository.getPerformance(startDate, endDate, maChuongTrinh, hangKhachHang);
    }

    @Override
    public List<DiscountReportCustomerUsageResponse> getDiscountCustomerUsage(String startDate, String endDate, Integer maChuongTrinh, Integer hangKhachHang, Integer topN) {
        return repository.getCustomerUsage(startDate, endDate, maChuongTrinh, hangKhachHang, topN);
    }
}
