package com.noithat.qlnt.backend.dto.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class DiscountReportSummaryResponse {
    public Integer ma_chuong_trinh;
    public String ten_chuong_trinh;
    public String loai_giam_gia;
    public BigDecimal gia_tri_giam;
    public Integer so_lan_su_dung;
    public BigDecimal doanh_thu_gan_chuong_trinh;
    public String thoi_gian_bat_dau; // yyyy-MM-dd
    public String thoi_gian_ket_thuc; // yyyy-MM-dd
    public String trang_thai;
}
