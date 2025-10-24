package com.noithat.qlnt.backend.dto.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ThongKeBanHangResponse {
    private long tongDonHang;
    private long choXuLy;
    private long hoanThanh;
    private BigDecimal doanhThuHomNay;
}
