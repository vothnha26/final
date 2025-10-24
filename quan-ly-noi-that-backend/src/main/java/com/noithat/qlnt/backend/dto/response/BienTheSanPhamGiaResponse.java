package com.noithat.qlnt.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.util.List;

/**
 * Response giá hiển thị của biến thể sản phẩm với thông tin giảm giá
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BienTheSanPhamGiaResponse {
    
    private Integer maBienThe;
    private String sku;
    private String tenSanPham;
    private BigDecimal giaBanGoc;
    private BigDecimal giaHienThi;
    private Boolean coGiamGia;
    private BigDecimal phanTramGiam;
    private BigDecimal soTienTietKiem;
    private List<ChuongTrinhDangApDung> cacChuongTrinhDangApDung;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChuongTrinhDangApDung {
        private Integer maChuongTrinh;
        private String tenChuongTrinh;
        private BigDecimal giaSauGiam;
    }
}
