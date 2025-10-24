package com.noithat.qlnt.backend.dto.common;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VipBenefitDto {
    private Integer maVipBenefit;
    private Integer maHangThanhVien;
    private String benefitType; // FREE_SHIPPING | PERCENT_DISCOUNT | BONUS_POINTS | PRIORITY_SHIPPING
    private String params; // JSON string
    private String description;
    private Boolean active;
}
