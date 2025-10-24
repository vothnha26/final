package com.noithat.qlnt.backend.dto.response;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * DTO response cho sản phẩm kèm danh sách hình ảnh
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SanPhamWithImagesResponseDto {

    private Integer maSanPham;
    private String tenSanPham;
    private String moTa;
    private String moTaChiTiet;
    // Thông tin liên quan (gộp vào object để frontend dễ tiêu thụ)
    private CategoryDto danhMuc;
    private SupplierDto nhaCungCap;
    private CollectionDto boSuuTap;
    private String trangThai; // ACTIVE, INACTIVE, DISCONTINUED
    private LocalDateTime ngayTao;
    private LocalDateTime ngayCapNhat;

    // Danh sách hình ảnh
    @Builder.Default
    private List<HinhAnhDto> hinhAnhs = new ArrayList<>();

    // Tổng số biến thể
    private Integer soLuongBienThe;

    // Diem thuong (bonus points)
    private Integer diemThuong;
    // Ratings
    private Double averageRating;
    private Integer reviewCount;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class HinhAnhDto {
        private Integer maHinhAnh;
        private String duongDanHinhAnh;
        private Integer thuTu;
        private Boolean laAnhChinh;
        private String moTa;
        private Boolean trangThai;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CategoryDto {
        private Integer id;
        private String name;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SupplierDto {
        private Integer id;
        private String name;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CollectionDto {
        private Integer id;
        private String name;
    }
}
