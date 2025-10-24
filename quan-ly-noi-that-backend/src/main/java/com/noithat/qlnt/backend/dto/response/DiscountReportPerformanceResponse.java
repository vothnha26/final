package com.noithat.qlnt.backend.dto.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class DiscountReportPerformanceResponse {
    public String ngay; // yyyy-MM-dd
    public Integer so_lan_su_dung;
    public BigDecimal doanh_thu_gan_chuong_trinh;
    public BigDecimal redemption_rate; // may be null
}
