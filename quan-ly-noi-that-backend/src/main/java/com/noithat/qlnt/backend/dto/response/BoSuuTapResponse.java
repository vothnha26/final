package com.noithat.qlnt.backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BoSuuTapResponse {
    private Integer maBoSuuTap;
    private String tenBoSuuTap;
    private String moTa;
    private String hinhAnh;
    private Long soLuongSanPham; // số lượng sản phẩm thuộc bộ sưu tập
}
