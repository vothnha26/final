package com.noithat.qlnt.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

/**
 * Response khi áp dụng voucher
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherApplyResponse {
    
    private Boolean success;
    private String message;
    private String maCode;
    private BigDecimal tongTienGoc;
    private BigDecimal soTienGiam;
    private BigDecimal tongTienSauGiam;
    private String loaiGiamGia;
    private BigDecimal giaTriGiam;
}
