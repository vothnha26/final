package com.noithat.qlnt.backend.dto.request;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ApplyVoucherRequest {
    private Integer maKhachHang;
    private String maVoucherCode;
    // Tổng tiền của đơn hàng (sau khi đã trừ VIP) để kiểm tra điều kiện
    private BigDecimal orderAmountForCheck; 
}