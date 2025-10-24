package com.noithat.qlnt.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "vip_benefit")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VipBenefit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaVipBenefit")
    private Integer maVipBenefit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MaHangThanhVien")
    private HangThanhVien hangThanhVien;

    // Type of benefit (FREE_SHIPPING, PERCENT_DISCOUNT, BONUS_POINTS, PRIORITY_SHIPPING, etc.)
    @Column(name = "BenefitType", columnDefinition = "NVARCHAR(100)")
    private String benefitType;

    // Params stored as JSON or plain text (eg: {"minOrder":200000})
    @Column(name = "Params", columnDefinition = "NVARCHAR(MAX)")
    private String params;

    @Column(name = "Description", columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "Active")
    @Builder.Default
    private Boolean active = true;

    @Column(name = "CreatedAt")
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "UpdatedAt")
    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();
}
