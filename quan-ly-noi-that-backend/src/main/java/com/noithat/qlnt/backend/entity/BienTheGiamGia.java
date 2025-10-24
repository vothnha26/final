package com.noithat.qlnt.backend.entity;

import java.io.Serializable;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity mapping giữa Biến thể sản phẩm và Chương trình giảm giá
 */
@Entity
@Table(name = "BienThe_GiamGia")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class BienTheGiamGia {
    
    @EmbeddedId
    private BienTheGiamGiaId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maBienThe", nullable = false, insertable = false, updatable = false)
    private BienTheSanPham bienTheSanPham;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maChuongTrinhGiamGia", nullable = false, insertable = false, updatable = false)
    private ChuongTrinhGiamGia chuongTrinhGiamGia;

    // Giá sau khi giảm cho biến thể này
    private java.math.BigDecimal giaSauGiam;

    @Embeddable
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @EqualsAndHashCode
    public static class BienTheGiamGiaId implements Serializable {
        private Integer maBienThe;
        private Integer maChuongTrinhGiamGia;
    }
}
