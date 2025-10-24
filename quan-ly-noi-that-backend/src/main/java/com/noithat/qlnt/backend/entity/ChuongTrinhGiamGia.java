package com.noithat.qlnt.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "ChuongTrinhGiamGia")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChuongTrinhGiamGia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer maChuongTrinhGiamGia;

    @Column(name = "TenChuongTrinh", nullable = false)
    private String tenChuongTrinh;

    @Column(name = "MoTa")
    private String moTa;

    @Column(name = "NgayBatDau", nullable = false)
    private LocalDateTime ngayBatDau;

    @Column(name = "NgayKetThuc", nullable = false)
    private LocalDateTime ngayKetThuc;

    @Column(name = "TrangThai", nullable = false)
    private String trangThai = "đang hoạt động";

    @Column(name = "LoaiGiamGia", nullable = false)
    private String loaiGiamGia; // "PERCENT" hoặc "FIXED"

    @Column(name = "GiaTriGiam", precision = 18, scale = 2, nullable = false)
    private BigDecimal giaTriGiam;

    // Liên kết với biến thể sản phẩm (1 chương trình - nhiều biến thể)
    @OneToMany(mappedBy = "chuongTrinhGiamGia", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private Set<BienTheGiamGia> bienTheGiamGias = new HashSet<>();

    // DEPRECATED: Sẽ xóa sau khi chuyển sang biến thể
    // @OneToMany(mappedBy = "chuongTrinhGiamGia", cascade = CascadeType.ALL, orphanRemoval = true)
    // private Set<SanPhamGiamGia> sanPhamGiamGias = new HashSet<>();
}
