package com.noithat.qlnt.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "GiaoDichThanhToan")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class GiaoDichThanhToan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer maGiaoDich;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MaDonHang", nullable = false)
    private DonHang donHang;

    @Column(name = "PhuongThuc", nullable = false, columnDefinition = "NVARCHAR(50)")
    private String phuongThuc;

    @Column(name = "SoTien", precision = 18, scale = 2, nullable = false)
    private BigDecimal soTien;

    @Column(name = "NgayGiaoDich")
    private LocalDateTime ngayGiaoDich;

    @Column(name = "TrangThai", nullable = false, columnDefinition = "NVARCHAR(50)")
    private String trangThai;
}