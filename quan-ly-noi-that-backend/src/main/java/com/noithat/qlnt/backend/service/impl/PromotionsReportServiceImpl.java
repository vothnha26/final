package com.noithat.qlnt.backend.service.impl;

import com.noithat.qlnt.backend.repository.PromotionsReportRepository;
import com.noithat.qlnt.backend.service.PromotionsReportService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class PromotionsReportServiceImpl implements PromotionsReportService {
    private final PromotionsReportRepository repo;

    public PromotionsReportServiceImpl(PromotionsReportRepository repo) {
        this.repo = repo;
    }

    @Override
    public List<Map<String, Object>> summary(String promotionType, String startDate, String endDate, String maVoucherCode, Integer maChuongTrinh, Integer hangKhachHang, Integer topN) {
        return repo.summary(promotionType, startDate, endDate, maVoucherCode, maChuongTrinh, hangKhachHang, topN);
    }

    @Override
    public List<Map<String, Object>> performance(String promotionType, String startDate, String endDate, String maVoucherCode, Integer maChuongTrinh, Integer hangKhachHang) {
        return repo.performance(promotionType, startDate, endDate, maVoucherCode, maChuongTrinh, hangKhachHang);
    }

    @Override
    public List<Map<String, Object>> customerUsage(String promotionType, String startDate, String endDate, String maVoucherCode, Integer maChuongTrinh, Integer hangKhachHang, Integer topN) {
        return repo.customerUsage(promotionType, startDate, endDate, maVoucherCode, maChuongTrinh, hangKhachHang, topN);
    }

    @Override
    public List<Map<String, Object>> productPerformance(String type, String sortBy, String startDate, String endDate, Integer maChuongTrinh, Integer topN) {
        return repo.productPerformance(type, sortBy, startDate, endDate, maChuongTrinh, topN);
    }
}
