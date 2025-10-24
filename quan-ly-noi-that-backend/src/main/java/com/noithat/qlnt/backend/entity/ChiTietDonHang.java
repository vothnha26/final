package com.noithat.qlnt.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;
import java.math.BigDecimal;

@Entity
@Table(name = "ChiTietDonHang")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ChiTietDonHang implements Serializable {

    @EmbeddedId
    private ChiTietDonHangId id = new ChiTietDonHangId(); // ensure an id object exists so Hibernate can set nested fields during persist

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("maDonHang")
    private DonHang donHang;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("maBienThe")
    private BienTheSanPham bienThe;

    @Column(name = "SoLuong", nullable = false)
    private Integer soLuong;

    @Column(name = "DonGiaGoc", precision = 18, scale = 2, nullable = false)
    private BigDecimal donGiaGoc;

    @Column(name = "DonGiaThucTe", precision = 18, scale = 2, nullable = false)
    private BigDecimal donGiaThucTe;

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class ChiTietDonHangId implements Serializable {
        @Column(name = "MaDonHang")
        private Integer maDonHang;

        @Column(name = "MaBienThe")
        private Integer maBienThe;
        
        // Static factory method để tạo ID dễ dàng
        public static ChiTietDonHangId of(Integer maDonHang, Integer maBienThe) {
            return new ChiTietDonHangId(maDonHang, maBienThe);
        }
    }
    
    // Helper method để tạo ChiTietDonHang với composite key
    public static ChiTietDonHang create(DonHang donHang, BienTheSanPham bienThe, 
                                       Integer soLuong, BigDecimal donGiaGoc, BigDecimal donGiaThucTe) {
        ChiTietDonHang chiTiet = new ChiTietDonHang();
        // Populate the embedded id fields defensively. Always set maBienThe from the variant.
        // Only set maDonHang if DonHang already has a generated id. When DonHang is new
        // (not yet persisted, maDonHang == null) we avoid setting maDonHang; Hibernate will
        // populate the composite key from the association when the parent is persisted.
        ChiTietDonHangId id = new ChiTietDonHangId();
        if (donHang != null && donHang.getMaDonHang() != null) {
            id.setMaDonHang(donHang.getMaDonHang());
        }
        if (bienThe != null && bienThe.getMaBienThe() != null) {
            id.setMaBienThe(bienThe.getMaBienThe());
        }
        chiTiet.setId(id);
        chiTiet.setDonHang(donHang);
        chiTiet.setBienThe(bienThe);
        chiTiet.setSoLuong(soLuong);
        chiTiet.setDonGiaGoc(donGiaGoc);
        chiTiet.setDonGiaThucTe(donGiaThucTe);
        return chiTiet;
    }
}