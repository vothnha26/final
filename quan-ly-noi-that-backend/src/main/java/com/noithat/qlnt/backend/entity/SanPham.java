package com.noithat.qlnt.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "SanPham")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class SanPham {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer maSanPham;

    @Column(name = "TenSanPham", nullable = false, columnDefinition = "NVARCHAR(255)")
    private String tenSanPham;

    @Column(name = "MoTa", columnDefinition = "NVARCHAR(MAX)")
    private String moTa;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MaDanhMuc")
    private DanhMuc danhMuc;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MaNhaCungCap")
    private NhaCungCap nhaCungCap;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MaBoSuuTap")
    private BoSuuTap boSuuTap;

    @OneToMany(mappedBy = "sanPham", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BienTheSanPham> bienTheList = new ArrayList<>();

    @OneToMany(mappedBy = "sanPham", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<HinhAnhSanPham> hinhAnhList = new ArrayList<>();
    
    @Column(name = "DiemThuong", nullable = false)
    private Integer diemThuong = 0;
    
    @Column(name = "TrangThai", columnDefinition = "NVARCHAR(50)", nullable = false)
    private String trangThai = "ACTIVE"; // ACTIVE, INACTIVE, DISCONTINUED
}
