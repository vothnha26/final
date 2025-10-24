package com.noithat.qlnt.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductPerformanceResponse {
    
    @JsonProperty("ma_san_pham")
    private Integer maSanPham;
    
    @JsonProperty("ten_san_pham")
    private String tenSanPham;
    
    @JsonProperty("ma_bien_the")
    private Integer maBienThe;
    
    @JsonProperty("sku")
    private String sku;
    
    @JsonProperty("so_don_hang_ap_dung")
    private Integer soDonHangApDung;
    
    @JsonProperty("so_luong_ban")
    private Integer soLuongBan;
    
    @JsonProperty("tong_gia_tri_giam")
    private BigDecimal tongGiaTriGiam;
}
