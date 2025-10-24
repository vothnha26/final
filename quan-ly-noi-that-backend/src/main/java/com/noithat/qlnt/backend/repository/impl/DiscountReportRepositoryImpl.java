package com.noithat.qlnt.backend.repository.impl;

import com.noithat.qlnt.backend.dto.response.*;
import com.noithat.qlnt.backend.repository.DiscountReportRepository;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class DiscountReportRepositoryImpl implements DiscountReportRepository {
    private final JdbcTemplate jdbc;

    public DiscountReportRepositoryImpl(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<DiscountReportSummaryResponse> getSummary(String startDate, String endDate, Integer maChuongTrinh, Integer hangKhachHang, Integer topN) {
        String sql = "EXEC sp_report_discounts @action=?, @days=?, @top_n=?, @start_date=?, @end_date=?, @ma_chuong_trinh=?, @hang_khach_hang=?";
        return jdbc.query(
                sql,
                new BeanPropertyRowMapper<>(DiscountReportSummaryResponse.class),
                "summary", 30, topN, startDate, endDate, maChuongTrinh, hangKhachHang
        );
    }

    @Override
    public List<DiscountReportPerformanceResponse> getPerformance(String startDate, String endDate, Integer maChuongTrinh, Integer hangKhachHang) {
        String sql = "EXEC sp_report_discounts @action=?, @days=?, @top_n=?, @start_date=?, @end_date=?, @ma_chuong_trinh=?, @hang_khach_hang=?";
        return jdbc.query(
                sql,
                new BeanPropertyRowMapper<>(DiscountReportPerformanceResponse.class),
                "performance", 30, 10, startDate, endDate, maChuongTrinh, hangKhachHang
        );
    }

    @Override
    public List<DiscountReportCustomerUsageResponse> getCustomerUsage(String startDate, String endDate, Integer maChuongTrinh, Integer hangKhachHang, Integer topN) {
        String sql = "EXEC sp_report_discounts @action=?, @days=?, @top_n=?, @start_date=?, @end_date=?, @ma_chuong_trinh=?, @hang_khach_hang=?";
        return jdbc.query(
                sql,
                new BeanPropertyRowMapper<>(DiscountReportCustomerUsageResponse.class),
                "customer_usage", 30, topN, startDate, endDate, maChuongTrinh, hangKhachHang
        );
    }
}
