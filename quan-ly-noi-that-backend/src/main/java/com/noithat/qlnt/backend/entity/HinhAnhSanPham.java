package com.noithat.qlnt.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Entity HinhAnhSanPham - Quản lý nhiều hình ảnh cho một sản phẩm
 * Quan hệ: N hình ảnh - 1 sản phẩm (Many-to-One)
 */
@Entity
@Table(name = "HinhAnhSanPham")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HinhAnhSanPham {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer maHinhAnh;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MaSanPham", nullable = false)
    private SanPham sanPham;

    @Column(name = "DuongDanHinhAnh", nullable = false, columnDefinition = "NVARCHAR(500)")
    private String duongDanHinhAnh;

    @Column(name = "ThuTu")
    private Integer thuTu = 0; // Thứ tự hiển thị (0 là ảnh chính)

    @Column(name = "LaAnhChinh")
    private Boolean laAnhChinh = false; // Đánh dấu ảnh chính

    @Column(name = "MoTa", columnDefinition = "NVARCHAR(255)")
    private String moTa;

    @Column(name = "NgayTao")
    private LocalDateTime ngayTao;

    @Column(name = "NgayCapNhat")
    private LocalDateTime ngayCapNhat;

    @Column(name = "TrangThai")
    private Boolean trangThai = true; // true: active, false: inactive

    @PrePersist
    protected void onCreate() {
        ngayTao = LocalDateTime.now();
        ngayCapNhat = LocalDateTime.now();
        if (trangThai == null) {
            trangThai = true;
        }
        if (thuTu == null) {
            thuTu = 0;
        }
        if (laAnhChinh == null) {
            laAnhChinh = false;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        ngayCapNhat = LocalDateTime.now();
    }
}
