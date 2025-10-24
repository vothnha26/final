package com.noithat.qlnt.backend.dto.response;

import lombok.Data;
import java.math.BigDecimal;

// Plain DTO for summary rows
@Data
public class VoucherReportSummaryResponse {
    public Integer ma_voucher;
    public String ma_code;
    public BigDecimal gia_tri_giam;
    public Integer so_luong_phat_hanh;
    public Integer so_lan_su_dung;
    public BigDecimal doanh_thu_gan_voucher;
    public String thoi_gian_redeem; // yyyy-MM-dd
    public String ma_chien_dich;    // currently NULL (placeholder)
    public Integer hang_khach_hang;
}
