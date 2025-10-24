package com.noithat.qlnt.backend.repository;

import java.util.List;
import java.util.Map;

public interface PromotionsReportRepository {
    List<Map<String, Object>> summary(String promotionType, String startDate, String endDate, String maVoucherCode, Integer maChuongTrinh, Integer hangKhachHang, Integer topN);
    List<Map<String, Object>> performance(String promotionType, String startDate, String endDate, String maVoucherCode, Integer maChuongTrinh, Integer hangKhachHang);
    List<Map<String, Object>> customerUsage(String promotionType, String startDate, String endDate, String maVoucherCode, Integer maChuongTrinh, Integer hangKhachHang, Integer topN);
    List<Map<String, Object>> productPerformance(String type, String sortBy, String startDate, String endDate, Integer maChuongTrinh, Integer topN);
}
