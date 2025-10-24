package com.noithat.qlnt.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.noithat.qlnt.backend.config.LenientBooleanDeserializer;
import java.util.List;
import com.noithat.qlnt.backend.dto.common.VipBenefitDto;

@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class HangThanhVienRequest {

    @NotBlank(message = "Tên hạng thành viên không được để trống")
    @Size(min = 2, max = 50, message = "Tên hạng thành viên phải có độ dài từ 2 đến 50 ký tự")
    private String tenHang;

    @NotNull(message = "Điểm tối thiểu không được để trống")
    @Min(value = 0, message = "Điểm tối thiểu không được âm")
    private Integer diemToiThieu;
    // Optional additional fields to allow richer create/update payloads from the
    // admin UI. Note: discount/min-amount/raw uuDai were removed in favor of
    // structured `VipBenefit` rows stored in the `vip_benefit` table.
    private String moTa;
    private String mauSac;
    @JsonDeserialize(using = LenientBooleanDeserializer.class)
    private Boolean trangThai;
    private String icon;
    
    // Optional: structured list of benefits sent from the admin UI. If provided,
    // the service will persist these into vip_benefit. Kept as Optional to remain
    // backward-compatible with older clients that only send `moTa`.
    private List<VipBenefitDto> vipBenefits;
}