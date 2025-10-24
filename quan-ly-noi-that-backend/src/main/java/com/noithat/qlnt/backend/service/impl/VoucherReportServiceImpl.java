package com.noithat.qlnt.backend.service.impl;

import com.noithat.qlnt.backend.dto.response.VoucherReportCustomerUsageResponse;
import com.noithat.qlnt.backend.dto.response.VoucherReportPerformanceResponse;
import com.noithat.qlnt.backend.dto.response.VoucherReportSummaryResponse;
import com.noithat.qlnt.backend.repository.VoucherReportRepository;
import com.noithat.qlnt.backend.service.VoucherReportService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class VoucherReportServiceImpl implements VoucherReportService {
    private final VoucherReportRepository voucherReportRepository;

    public VoucherReportServiceImpl(VoucherReportRepository voucherReportRepository) {
        this.voucherReportRepository = voucherReportRepository;
    }

    @Override
    public List<VoucherReportSummaryResponse> getVoucherSummary(String startDate, String endDate, String maVoucher, String maChienDich, Integer hangKhachHang, Integer topN) {
        return voucherReportRepository.getSummary(startDate, endDate, maVoucher, maChienDich, hangKhachHang, topN);
    }

    @Override
    public List<VoucherReportPerformanceResponse> getVoucherPerformance(String startDate, String endDate, String maVoucher, String maChienDich, Integer hangKhachHang) {
        return voucherReportRepository.getPerformance(startDate, endDate, maVoucher, maChienDich, hangKhachHang);
    }

    @Override
    public List<VoucherReportCustomerUsageResponse> getVoucherCustomerUsage(String startDate, String endDate, String maVoucher, String maChienDich, Integer hangKhachHang, Integer topN) {
        return voucherReportRepository.getCustomerUsage(startDate, endDate, maVoucher, maChienDich, hangKhachHang, topN);
    }
}
