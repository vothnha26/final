package com.noithat.qlnt.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

/**
 * DTO để tạo hoặc cập nhật hình ảnh sản phẩm
 */
public record HinhAnhSanPhamRequestDto(
    @NotBlank(message = "Đường dẫn hình ảnh không được để trống")
    String duongDanHinhAnh,
    
    @NotNull(message = "Thứ tự không được để trống")
    @PositiveOrZero(message = "Thứ tự phải >= 0")
    Integer thuTu,
    
    Boolean laAnhChinh,
    
    String moTa,
    
    Boolean trangThai
) {
    // Constructor compact để set default values
    public HinhAnhSanPhamRequestDto {
        if (thuTu == null) {
            thuTu = 0;
        }
        if (laAnhChinh == null) {
            laAnhChinh = false;
        }
        if (trangThai == null) {
            trangThai = true;
        }
    }
}
