package com.noithat.qlnt.backend.dto.response;

import com.noithat.qlnt.backend.entity.HinhAnhSanPham;
import java.time.LocalDateTime;

/**
 * DTO response cho hình ảnh sản phẩm
 */
public record HinhAnhSanPhamResponseDto(
    Integer maHinhAnh,
    Integer maSanPham,
    String tenSanPham,
    String duongDanHinhAnh,
    Integer thuTu,
    Boolean laAnhChinh,
    String moTa,
    LocalDateTime ngayTao,
    LocalDateTime ngayCapNhat,
    Boolean trangThai
) {
    public static HinhAnhSanPhamResponseDto fromEntity(HinhAnhSanPham entity) {
        return new HinhAnhSanPhamResponseDto(
            entity.getMaHinhAnh(),
            entity.getSanPham().getMaSanPham(),
            entity.getSanPham().getTenSanPham(),
            entity.getDuongDanHinhAnh(),
            entity.getThuTu(),
            entity.getLaAnhChinh(),
            entity.getMoTa(),
            entity.getNgayTao(),
            entity.getNgayCapNhat(),
            entity.getTrangThai()
        );
    }
}
