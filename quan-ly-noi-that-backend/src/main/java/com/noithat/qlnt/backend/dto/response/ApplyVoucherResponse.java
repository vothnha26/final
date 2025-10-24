package com.noithat.qlnt.backend.dto.response;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Builder // Dùng Builder để tạo đối tượng dễ dàng hơn
public class ApplyVoucherResponse {
    private boolean success;
    private String message;
    private String maVoucherCode;
    private BigDecimal giamGiaVoucher; // Số tiền được giảm
}