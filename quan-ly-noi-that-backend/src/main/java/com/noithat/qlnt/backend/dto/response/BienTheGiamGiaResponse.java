package com.noithat.qlnt.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

/**
 * Response thông tin biến thể trong chương trình giảm giá
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BienTheGiamGiaResponse {
    
    private Integer maChuongTrinhGiamGia;
    private Integer maBienThe;
    private String skuBienThe;
    private String tenChuongTrinh;
    private BigDecimal giaGoc;
    private BigDecimal giaSauGiam;
    private BigDecimal phanTramGiam;
    // parent product info (when included in list responses)
    private Integer maSanPham;
    private String tenSanPham;
}
