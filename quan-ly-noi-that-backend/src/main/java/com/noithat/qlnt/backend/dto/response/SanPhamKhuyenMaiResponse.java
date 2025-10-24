package com.noithat.qlnt.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SanPhamKhuyenMaiResponse {
    private Integer maSanPham;
    private String tenSanPham;
    private List<BienTheGiamGiaResponse> bienTheGiamGias;
}
