package com.noithat.qlnt.backend.dto.response;

import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopProductResponseDto {
    private Integer maSanPham;
    private String tenSanPham;
    private String moTa;
    // Friendly fields for frontend compatibility
    private Integer id; // alias of maSanPham
    private String name; // alias of tenSanPham
    private Double price; // min price (for display)
    private Double originalPrice; // max price (for display as range end)
    private Integer stockQuantity; // aggregated stock from variants

    private Double minPrice;
    private Double maxPrice;
    private Integer totalStock; // sum of variant stocks
    private Integer discountPercent; // e.g. 10 => 10% off from maxPrice down to minPrice
    private Integer availableVariantCount; // number of variants with stock > 0
    private Integer soLuongBienThe; // total variants count
    // Variant-level lowest final price (after promotions) and metadata
    private Integer lowestVariantId;
    private String lowestVariantSku;
    private Double lowestVariantPrice; // final price after discount (giaSauGiam) or giaBan if no discount
    private Double lowestVariantOriginalPrice; // original variant price (giaBan)
    private Integer lowestVariantDiscountPercent; // percent discount on that variant, if any
    private Double lowestVariantDiscountAmount; // amount discounted on that variant, if any
    @Builder.Default
    private List<String> images = new ArrayList<>();
    // Ratings
    private Double averageRating;
    private Integer reviewCount;
    // Category and supplier info for shop filtering
    private CategoryDto category;

    // Bonus points (Điểm thưởng)
    private Integer diemThuong;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SupplierDto {
        private Integer id;
        private String name;
    }
    private SupplierDto supplier;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CategoryDto {
        private Integer id;
        private String name;
    }
}
