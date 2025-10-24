package com.noithat.qlnt.backend.dto.response;

import lombok.Data;
import java.math.BigDecimal;

/**
 * DTO chứa dữ liệu thống kê tổng quan về hóa đơn.
 */
@Data
public class ThongKeHoaDonResponse {
    private long tongHoaDon;
    private long daThanhToan;
    private long choThanhToan;
    private BigDecimal tongDoanhThu;
}