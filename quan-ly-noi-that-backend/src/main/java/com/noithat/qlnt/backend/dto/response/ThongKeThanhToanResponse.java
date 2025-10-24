package com.noithat.qlnt.backend.dto.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ThongKeThanhToanResponse {
    private long soGiaoDichDaThanhToan;
    private long soGiaoDichChoXuLy;
    private BigDecimal tongDoanhThu; // Tổng của các giao dịch hoàn thành
    private BigDecimal tongPhiGiaoDich; // Cần logic để tính toán trường này
}