package com.noithat.qlnt.backend.dto.response;

import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class XemGioHangResponse {
    private List<Item> items;
    private BigDecimal tongTienGoc;         // tổng tiền trước giảm
    private BigDecimal vipDiscountTotal;    // tổng tiền giảm do VIP
    private BigDecimal tongSauVip;          // tổng sau áp dụng VIP (trước voucher/điểm)
    private Integer diemThuongAvailable;    // điểm thưởng hiện có của KH
    private BigDecimal giaTriDiemAvailable; // giá trị quy đổi của điểm
    private List<VoucherCandidate> eligibleVouchers;

    @Data
    public static class Item {
        private Integer maBienThe;
        private String tenBienThe;
        private BigDecimal donGia;            // đơn giá gốc
        private BigDecimal donGiaSauVip;      // đơn giá sau áp VIP (nếu có)
        private Integer soLuong;
        private BigDecimal thanhTienSauVip;   // donGiaSauVip * soLuong
    }

    @Data
    public static class VoucherCandidate {
        private Integer maVoucher;
        private String maCode;
        private String loaiGiamGia;
        private BigDecimal giaTriGiam;    // as configured on voucher
        private BigDecimal soTienGiam;    // calculated when applying to this cart
        private BigDecimal tongTienSauGiam;
    }
}
