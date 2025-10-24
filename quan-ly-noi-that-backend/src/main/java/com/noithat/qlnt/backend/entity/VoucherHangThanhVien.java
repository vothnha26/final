package com.noithat.qlnt.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;

@Entity
// Use snake_case to align with SpringPhysicalNamingStrategy so Hibernate can create/find the table
@Table(name = "voucher_hang_thanh_vien")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class VoucherHangThanhVien implements Serializable {

    @EmbeddedId
    private VoucherHangThanhVienId id = new VoucherHangThanhVienId();

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("maVoucher")
    @JoinColumn(name = "ma_voucher")
    private Voucher voucher;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("maHangThanhVien")
    @JoinColumn(name = "ma_hang_thanh_vien")
    private HangThanhVien hangThanhVien;

    // Lớp cho Khóa chính phức hợp
    @Embeddable
    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @EqualsAndHashCode
    public static class VoucherHangThanhVienId implements Serializable {
        @Column(name = "ma_voucher")
        private Integer maVoucher;

        @Column(name = "ma_hang_thanh_vien")
        private Integer maHangThanhVien;
    }
}