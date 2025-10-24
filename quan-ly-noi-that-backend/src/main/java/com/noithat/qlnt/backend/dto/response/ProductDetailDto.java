package com.noithat.qlnt.backend.dto.response;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductDetailDto {
    private Integer maSanPham;
    private String tenSanPham;
    private String moTa;

    // Top-level collection fields for compatibility with existing responses
    private Integer maBoSuuTap;
    private String tenBoSuuTap;

    private CategoryDto danhMuc;
    private SupplierDto nhaCungCap;
    private CollectionDto boSuuTap;

    @Builder.Default
    private List<VariantDto> bienTheList = new ArrayList<>();

    @Builder.Default
    private List<ImageDto> hinhAnhList = new ArrayList<>();

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

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VariantDto {
        private Integer id;
        private String sku;
        private Double gia;
        private Integer soLuongTon;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ImageDto {
        private Integer id;
        private String duongDanHinhAnh;
        private Integer thuTu;
        private Boolean laAnhChinh;
        private String moTa;
    }
}
