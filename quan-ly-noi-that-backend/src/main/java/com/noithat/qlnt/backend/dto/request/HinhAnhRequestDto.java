package com.noithat.qlnt.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for updating product images
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class HinhAnhRequestDto {
    private Integer maHinhAnh; // null for new images
    private String duongDanHinhAnh;
    private Integer thuTu;
    private Boolean laAnhChinh;
    private String moTa;
    private Boolean trangThai;
}
