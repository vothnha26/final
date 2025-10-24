package com.noithat.qlnt.backend.service;

import java.util.List;
import java.util.Map;

public interface PromotionsReportService {
    List<Map<String, Object>> summary(String promotionType, String startDate, String endDate, String maVoucherCode, Integer maChuongTrinh, Integer hangKhachHang, Integer topN);
    List<Map<String, Object>> performance(String promotionType, String startDate, String endDate, String maVoucherCode, Integer maChuongTrinh, Integer hangKhachHang);
    List<Map<String, Object>> customerUsage(String promotionType, String startDate, String endDate, String maVoucherCode, Integer maChuongTrinh, Integer hangKhachHang, Integer topN);
    List<Map<String, Object>> productPerformance(String type, String sortBy, String startDate, String endDate, Integer maChuongTrinh, Integer topN);
}
