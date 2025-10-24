package com.noithat.qlnt.backend.dto.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class VoucherReportPerformanceResponse {
    public String ngay; // yyyy-MM-dd
    public Integer so_lan_su_dung;
    public BigDecimal doanh_thu_gan_voucher;
    public java.math.BigDecimal redemption_rate; // %
}
