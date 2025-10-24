package com.noithat.qlnt.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "LichSuTonKho")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class LichSuTonKho {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer maLichSu;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MaBienThe", nullable = false)
    private BienTheSanPham bienTheSanPham;
    
    @Column(name = "SoLuongTruoc", nullable = false)
    private Integer soLuongTruoc;
    
    @Column(name = "SoLuongThayDoi", nullable = false)
    private Integer soLuongThayDoi;
    
    @Column(name = "SoLuongSau", nullable = false)
    private Integer soLuongSau;
    
    @Column(name = "LoaiGiaoDich", nullable = false, columnDefinition = "NVARCHAR(50)")
    private String loaiGiaoDich; // NHAP_KHO, XUAT_KHO, DAT_TRUOC, BAN_HANG, TRA_HANG, DIEU_CHINH
    
    @Column(name = "MaThamChieu", columnDefinition = "NVARCHAR(100)")
    private String maThamChieu; // Order ID, Import ID, etc.
    
    @Column(name = "LyDo", columnDefinition = "NVARCHAR(255)")
    private String lyDo;
    
    @Column(name = "NguoiThucHien", columnDefinition = "NVARCHAR(100)")
    private String nguoiThucHien;
    
    @Column(name = "ThoiGianThucHien", nullable = false)
    private LocalDateTime thoiGianThucHien = LocalDateTime.now();
    
    // Constructor for easy creation
    public LichSuTonKho(BienTheSanPham bienTheSanPham, Integer soLuongTruoc, 
                        Integer soLuongThayDoi, Integer soLuongSau, 
                        String loaiGiaoDich, String maThamChieu, 
                        String lyDo, String nguoiThucHien) {
        this.bienTheSanPham = bienTheSanPham;
        this.soLuongTruoc = soLuongTruoc;
        this.soLuongThayDoi = soLuongThayDoi;
        this.soLuongSau = soLuongSau;
        this.loaiGiaoDich = loaiGiaoDich;
        this.maThamChieu = maThamChieu;
        this.lyDo = lyDo;
        this.nguoiThucHien = nguoiThucHien;
        this.thoiGianThucHien = LocalDateTime.now();
    }
}
