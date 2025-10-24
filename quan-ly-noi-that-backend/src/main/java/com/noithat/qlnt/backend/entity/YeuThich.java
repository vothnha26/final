package com.noithat.qlnt.backend.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "YeuThich",
    uniqueConstraints = @UniqueConstraint(columnNames = {"MaKhachHang", "MaSanPham"})
)
public class YeuThich {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer maYeuThich;

    @ManyToOne(optional = false)
    @JoinColumn(name = "MaKhachHang", nullable = false)
    private KhachHang khachHang;

    @ManyToOne(optional = false)
    @JoinColumn(name = "MaSanPham", nullable = false)
    private SanPham sanPham;

    private LocalDateTime ngayTao = LocalDateTime.now();

    public Integer getMaYeuThich() {
        return maYeuThich;
    }

    public void setMaYeuThich(Integer maYeuThich) {
        this.maYeuThich = maYeuThich;
    }

    public KhachHang getKhachHang() {
        return khachHang;
    }

    public void setKhachHang(KhachHang khachHang) {
        this.khachHang = khachHang;
    }

    public SanPham getSanPham() {
        return sanPham;
    }

    public void setSanPham(SanPham sanPham) {
        this.sanPham = sanPham;
    }

    public LocalDateTime getNgayTao() {
        return ngayTao;
    }

    public void setNgayTao(LocalDateTime ngayTao) {
        this.ngayTao = ngayTao;
    }
}
