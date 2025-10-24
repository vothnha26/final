package com.noithat.qlnt.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonFormat;
import java.util.List;

/**
 * Response chi tiết voucher
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoucherResponse {

    private Integer maVoucher;
    private String tenVoucher;
    private String maCode;
    private String loaiGiamGia;
    private BigDecimal giaTriGiam;
    private Integer soLuongToiDa;
    private Integer soLuongDaSuDung;
    private BigDecimal giaTriDonHangToiThieu;
    private BigDecimal giaTriGiamToiDa;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime ngayBatDau;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime ngayKetThuc;

    // Effective/computed status string for UI: "CHUA_BAT_DAU", "DANG_HOAT_DONG", "DA_HET_HAN", or "KHONG_HOAT_DONG"
    private String trangThai;

    private String moTa;
    private Boolean apDungChoMoiNguoi;
    private List<String> tenHangThanhVienApDung;
    private List<Integer> maHangThanhVienIds; // IDs of membership tiers for this voucher
}
