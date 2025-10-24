package com.noithat.qlnt.backend.dto.response;

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
public class SanPhamGiamGiaResponse {
    private Integer maSanPham;
    private String tenSanPham;
    private Integer maChuongTrinhGiamGia;
    private String tenChuongTrinh;
}