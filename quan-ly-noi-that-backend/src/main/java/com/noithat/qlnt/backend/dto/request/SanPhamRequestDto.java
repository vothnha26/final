package com.noithat.qlnt.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SanPhamRequestDto(
        @NotBlank(message = "Tên sản phẩm không được để trống") String tenSanPham,

        String moTa,

        @NotNull(message = "Mã nhà cung cấp không được để trống")
        Integer maNhaCungCap,
        // Optional: Danh mục sản phẩm
        Integer maDanhMuc,

        // Optional: Bộ sưu tập
        Integer maBoSuuTap,

        // Optional: Diem Thuong (bonus points)
        Integer diemThuong,
        
        // Optional: Trạng thái sản phẩm (ACTIVE, INACTIVE, DISCONTINUED)
        String trangThai
) {
    // Note: chieuDai, chieuRong, chieuCao, canNang đã chuyển sang lưu ở
    // BienTheSanPham (variant level)
}