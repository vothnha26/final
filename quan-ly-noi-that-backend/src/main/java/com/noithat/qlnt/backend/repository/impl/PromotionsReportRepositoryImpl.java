package com.noithat.qlnt.backend.repository.impl;

import com.noithat.qlnt.backend.repository.PromotionsReportRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public class PromotionsReportRepositoryImpl implements PromotionsReportRepository {
    private final JdbcTemplate jdbc;

    public PromotionsReportRepositoryImpl(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<Map<String, Object>> summary(String promotionType, String startDate, String endDate, String maVoucherCode, Integer maChuongTrinh, Integer hangKhachHang, Integer topN) {
        String sql = "EXEC sp_report_promotions @promotion_type=?, @action=?, @days=?, @top_n=?, @start_date=?, @end_date=?, @ma_voucher_code=?, @ma_chuong_trinh=?, @hang_khach_hang=?";
        return jdbc.queryForList(sql, promotionType, "summary", 30, topN, startDate, endDate, maVoucherCode, maChuongTrinh, hangKhachHang);
    }

    @Override
    public List<Map<String, Object>> performance(String promotionType, String startDate, String endDate, String maVoucherCode, Integer maChuongTrinh, Integer hangKhachHang) {
        String sql = "EXEC sp_report_promotions @promotion_type=?, @action=?, @days=?, @top_n=?, @start_date=?, @end_date=?, @ma_voucher_code=?, @ma_chuong_trinh=?, @hang_khach_hang=?";
        return jdbc.queryForList(sql, promotionType, "performance", 30, 10, startDate, endDate, maVoucherCode, maChuongTrinh, hangKhachHang);
    }

    @Override
    public List<Map<String, Object>> customerUsage(String promotionType, String startDate, String endDate, String maVoucherCode, Integer maChuongTrinh, Integer hangKhachHang, Integer topN) {
        String sql = "EXEC sp_report_promotions @promotion_type=?, @action=?, @days=?, @top_n=?, @start_date=?, @end_date=?, @ma_voucher_code=?, @ma_chuong_trinh=?, @hang_khach_hang=?";
        return jdbc.queryForList(sql, promotionType, "customer_usage", 30, topN, startDate, endDate, maVoucherCode, maChuongTrinh, hangKhachHang);
    }

    @Override
    public List<Map<String, Object>> productPerformance(String type, String sortBy, String startDate, String endDate, Integer maChuongTrinh, Integer topN) {
        String sql = "EXEC sp_report_product_performance @type=?, @sort_by=?, @top_n=?, @start_date=?, @end_date=?, @ma_chuong_trinh=?";
        return jdbc.queryForList(sql, type, sortBy, topN, startDate, endDate, maChuongTrinh);
    }
}
