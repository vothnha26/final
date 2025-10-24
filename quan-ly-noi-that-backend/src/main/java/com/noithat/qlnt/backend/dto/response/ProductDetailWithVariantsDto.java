package com.noithat.qlnt.backend.dto.response;

import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * DTO đầy đủ cho chi tiết sản phẩm, bao gồm biến thể với thuộc tính và giá giảm
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductDetailWithVariantsDto {
    private Integer maSanPham;
    private String tenSanPham;
    private String moTa;

    private CategoryDto danhMuc;
    private SupplierDto nhaCungCap;
    private CollectionDto boSuuTap;

    @Builder.Default
    private List<VariantDetailDto> bienThe = new ArrayList<>();

    @Builder.Default
    private List<ImageDto> hinhAnh = new ArrayList<>();

    // Thông tin giá chung (dựa trên tất cả các biến thể)
    private BigDecimal giaMin;
    private BigDecimal giaMax;
    private BigDecimal giaGocMin;
    private BigDecimal giaGocMax;
    private Integer tongSoLuong;
    private Double danhGia;
    private Integer soLuotDanhGia;

    @Builder.Default
    private java.util.List<ReviewDto> danhGiaKhachHang = new java.util.ArrayList<>();

    // Thông số kỹ thuật (tổng hợp từ các thuộc tính của biến thể)
    @Builder.Default
    private List<SpecificationDto> thongSoKyThuat = new ArrayList<>();

    // Sản phẩm liên quan (cùng danh mục hoặc bộ sưu tập)
    @Builder.Default
    private List<RelatedProductDto> sanPhamLienQuan = new ArrayList<>();

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CategoryDto {
        private Integer maDanhMuc;
        private String tenDanhMuc;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SupplierDto {
        private Integer maNhaCungCap;
        private String tenNhaCungCap;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CollectionDto {
        private Integer maBoSuuTap;
        private String tenBoSuuTap;
    }

    /**
     * Chi tiết biến thể với thuộc tính và giá giảm
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class VariantDetailDto {
        private Integer maBienThe;
        private String sku;
        private BigDecimal giaBan;
        private BigDecimal giaGoc;
        private Integer soLuong;
        private String trangThaiKho;

        // Thuộc tính của biến thể (màu sắc, kích thước, v.v.)
        @Builder.Default
        private List<AttributeDto> thuocTinh = new ArrayList<>();

        // Thông tin giảm giá (nếu có)
        private DiscountDto giamGia;

        // Giá sau khi giảm (nếu có)
        private BigDecimal giaSauGiam;
        
        // Phần trăm giảm hoặc số tiền giảm
        private BigDecimal phanTramGiam;
        private BigDecimal soTienGiam;
    }

    /**
     * Thuộc tính của biến thể (màu sắc, kích thước, chất liệu, v.v.)
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AttributeDto {
        private Integer maThuocTinh;
        private String tenThuocTinh;
        private String giaTri;
    }

    /**
     * Thông tin giảm giá áp dụng cho biến thể
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DiscountDto {
        private Integer maChuongTrinh;
        private String tenChuongTrinh;
        private String loaiGiam; // PERCENT hoặc FIXED
        private BigDecimal giaTriGiam;
        private String ngayBatDau;
        private String ngayKetThuc;
    }

    /**
     * Hình ảnh sản phẩm
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ImageDto {
        private Integer maHinhAnh;
        private String duongDanHinhAnh;
        private Integer thuTu;
        private Boolean laAnhChinh;
        private String moTa;
    }

    /**
     * Thông số kỹ thuật (tổng hợp từ thuộc tính của các biến thể)
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SpecificationDto {
        private String tenThuocTinh;
        @Builder.Default
        private List<String> giaTriList = new ArrayList<>(); // Tất cả các giá trị có thể
    }

    /**
     * Sản phẩm liên quan
     */
    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RelatedProductDto {
        private Integer maSanPham;
        private String tenSanPham;
        private String moTa;
        private BigDecimal giaMin;
        private BigDecimal giaMax;
        private String hinhAnh; // Ảnh chính
        private Double danhGia;
        private Integer soLuotDanhGia;
        private Integer soLuongTon;
    }

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ReviewDto {
        private Integer id;
        private String tenKhachHang;
        private Integer danhGia; // diem
        private String tieuDe;
        private String noiDung;
        private String ngayDanhGia;
        private String bienThe; // optional
        private Integer maKhachHang;
        @Builder.Default
        private java.util.List<String> hinhAnh = new java.util.ArrayList<>();
    }
}
