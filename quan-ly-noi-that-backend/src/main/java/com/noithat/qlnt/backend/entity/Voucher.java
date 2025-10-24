package com.noithat.qlnt.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;

@Entity
@Table(name = "voucher")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Voucher {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_voucher")
    private Integer maVoucher;

    @Column(name = "ma_code", columnDefinition = "NVARCHAR(50)")
    private String maCode;
    
    @Column(name = "ten_voucher", columnDefinition = "NVARCHAR(255)")
    private String tenVoucher;
    
    @Column(name = "mo_ta", columnDefinition = "NVARCHAR(MAX)")
    private String moTa;

    @Column(name = "loai_giam_gia", columnDefinition = "NVARCHAR(20)")
    private String loaiGiamGia; // 'PERCENTAGE' hoặc 'FIXED'

    @Column(name = "gia_tri_giam", precision = 18, scale = 2)
    private BigDecimal giaTriGiam;
    
    @Column(name = "gia_tri_don_hang_toi_thieu", precision = 18, scale = 2)
    private BigDecimal giaTriDonHangToiThieu = BigDecimal.ZERO;
    
    @Column(name = "gia_tri_giam_toi_da", precision = 18, scale = 2)
    private BigDecimal giaTriGiamToiDa;

    @Column(name = "ngay_bat_dau")
    private LocalDateTime ngayBatDau;
    @Column(name = "ngay_ket_thuc")
    private LocalDateTime ngayKetThuc;
    
    @Column(name = "so_luong_toi_da")
    private Integer soLuongToiDa = 1000;
    
    @Column(name = "so_luong_da_su_dung")
    private Integer soLuongDaSuDung = 0;
    
    // Voucher status: one of "CHUA_BAT_DAU", "DANG_HOAT_DONG", "DA_HET_HAN"
    @Column(name = "trang_thai", columnDefinition = "NVARCHAR(50)")
    private String trangThai = "DANG_HOAT_DONG";

    @Column(name = "ap_dung_cho_moi_nguoi")
    private Boolean apDungChoMoiNguoi = true;

    @OneToMany(mappedBy = "voucher", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<VoucherHangThanhVien> hanCheHangThanhVien;
}