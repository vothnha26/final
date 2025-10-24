package com.noithat.qlnt.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response DTO cho biến thể sản phẩm với thông tin chi tiết
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BienTheSanPhamDetailResponse {
    
    private Integer maBienThe;
    private String sku;
    private BigDecimal giaBan;
    private BigDecimal giaMua;
    private Integer soLuongTon;
    
    // Thông tin sản phẩm
    private Integer maSanPham;
    private String tenSanPham;
    
    // Danh sách thuộc tính của biến thể này
    private List<ThuocTinhBienTheResponse> thuocTinhs;
    
    // Thông tin giảm giá hiện tại (nếu có)
    private BigDecimal giaTotNhat;
    private List<GiamGiaHienTaiResponse> giamGias;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ThuocTinhBienTheResponse {
        private Integer id; // ID của BienTheThuocTinh mapping (để xóa/sửa)
        private Integer maThuocTinh;
        private String tenThuocTinh;
        private Integer maGiaTriThuocTinh;
        private String giaTriThuocTinh;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GiamGiaHienTaiResponse {
        private Integer maChuongTrinhGiamGia;
        private String tenChuongTrinh;
        private BigDecimal giaSauGiam;
        private BigDecimal phanTramGiam;
    }
}