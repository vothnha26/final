package com.noithat.qlnt.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "BienTheSanPham")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BienTheSanPham {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer maBienThe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MaSanPham", nullable = false)
    private SanPham sanPham;

    @Column(name = "SKU", unique = true, nullable = false, columnDefinition = "NVARCHAR(256)")
    private String sku;

    @Column(name = "GiaMua", precision = 18, scale = 2)
    private BigDecimal giaMua;

    @Column(name = "GiaBan", precision = 18, scale = 2, nullable = false)
    private BigDecimal giaBan;

    @Column(name = "SoLuongTon", nullable = true)
    private Integer soLuongTon = 0;

    @Column(name = "MucTonToiThieu", nullable = true)
    private Integer mucTonToiThieu = 0;

    @Column(name = "NgayCapNhatKho")
    private LocalDateTime ngayCapNhatKho;

    @Column(name = "TrangThaiKho", columnDefinition = "NVARCHAR(50)")
    private String trangThaiKho = "INACTIVE"; // ACTIVE, LOW_STOCK, OUT_OF_STOCK, DISCONTINUED, INACTIVE

    // Relationship với thuộc tính (lưu giá trị trực tiếp trong join)
    @OneToMany(mappedBy = "bienTheSanPham", fetch = FetchType.EAGER, cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnoreProperties("bienTheSanPham")
    private List<BienTheThuocTinh> bienTheThuocTinhs = new ArrayList<>();

    // Helper method để lấy danh sách giá trị thuộc tính (giaTri) cho frontend
    public List<String> getGiaTriThuocTinhs() {
        if (bienTheThuocTinhs == null) return new java.util.ArrayList<>();
        return bienTheThuocTinhs.stream()
                .map(bt -> bt.getGiaTri())
                .toList();
    }

    // Business methods for stock management
    public boolean isLowStock() {
        return soLuongTon <= mucTonToiThieu;
    }

    public boolean isOutOfStock() {
        return soLuongTon <= 0;
    }

    public void updateStock(Integer soLuongThayDoi) {
        Integer soLuongMoi = this.soLuongTon + soLuongThayDoi;
        if (soLuongMoi < 0) {
            throw new IllegalArgumentException("Số lượng tồn kho không được âm");
        }
        this.soLuongTon = soLuongMoi;
        this.ngayCapNhatKho = LocalDateTime.now();
        updateStockStatus();
    }

    private void updateStockStatus() {
        if (isOutOfStock()) {
            this.trangThaiKho = "OUT_OF_STOCK";
        } else if (isLowStock()) {
            this.trangThaiKho = "LOW_STOCK";
        } else {
            this.trangThaiKho = "ACTIVE";
        }
    }
}
