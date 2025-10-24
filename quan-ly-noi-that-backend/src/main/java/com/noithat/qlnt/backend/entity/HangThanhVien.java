package com.noithat.qlnt.backend.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "hang_thanh_vien")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HangThanhVien {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "ma_hang_thanh_vien")
    private Integer maHangThanhVien;

    @Column(name = "ten_hang", nullable = false, unique = true, columnDefinition = "NVARCHAR(100)")
    private String tenHang;

    @Column(name = "diem_toi_thieu", nullable = false)
    private Integer diemToiThieu = 0;

    @Column(name = "mo_ta", columnDefinition = "NVARCHAR(MAX)")
    private String moTa; // Mô tả hạng thành viên

    @Column(name = "mau_sac", columnDefinition = "NVARCHAR(20)")
    private String mauSac; // Màu sắc hiển thị UI (hex color)

    @Column(name = "trang_thai")
    private Boolean trangThai = true; // Trạng thái kích hoạt

    @Column(name = "icon", columnDefinition = "NVARCHAR(50)")
    private String icon; // Tên icon cho frontend

    @OneToMany(mappedBy = "hangThanhVien", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<VipBenefit> vipBenefits = new ArrayList<>();
}