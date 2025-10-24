package com.noithat.qlnt.backend.repository.impl;

import com.noithat.qlnt.backend.dto.response.*;
import com.noithat.qlnt.backend.repository.VoucherReportRepository;
import org.springframework.jdbc.core.BeanPropertyRowMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class VoucherReportRepositoryImpl implements VoucherReportRepository {
    private final JdbcTemplate jdbc;

    public VoucherReportRepositoryImpl(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public List<VoucherReportSummaryResponse> getSummary(String startDate, String endDate, String maVoucher, String maChienDich, Integer hangKhachHang, Integer topN) {
        String sql = "EXEC sp_report_vouchers @action=?, @days=?, @top_n=?, @start_date=?, @end_date=?, @ma_voucher=?, @ma_chien_dich=?, @hang_khach_hang=?";
    return jdbc.query(
        sql,
        new BeanPropertyRowMapper<>(VoucherReportSummaryResponse.class),
        "summary", 30, topN, startDate, endDate, maVoucher, maChienDich, hangKhachHang
    );
    }

    @Override
    public List<VoucherReportPerformanceResponse> getPerformance(String startDate, String endDate, String maVoucher, String maChienDich, Integer hangKhachHang) {
        String sql = "EXEC sp_report_vouchers @action=?, @days=?, @top_n=?, @start_date=?, @end_date=?, @ma_voucher=?, @ma_chien_dich=?, @hang_khach_hang=?";
    return jdbc.query(
        sql,
        new BeanPropertyRowMapper<>(VoucherReportPerformanceResponse.class),
        "performance", 30, 10, startDate, endDate, maVoucher, maChienDich, hangKhachHang
    );
    }

    @Override
    public List<VoucherReportCustomerUsageResponse> getCustomerUsage(String startDate, String endDate, String maVoucher, String maChienDich, Integer hangKhachHang, Integer topN) {
        String sql = "EXEC sp_report_vouchers @action=?, @days=?, @top_n=?, @start_date=?, @end_date=?, @ma_voucher=?, @ma_chien_dich=?, @hang_khach_hang=?";
    return jdbc.query(
        sql,
        new BeanPropertyRowMapper<>(VoucherReportCustomerUsageResponse.class),
        "customer_usage", 30, topN, startDate, endDate, maVoucher, maChienDich, hangKhachHang
    );
    }
}
