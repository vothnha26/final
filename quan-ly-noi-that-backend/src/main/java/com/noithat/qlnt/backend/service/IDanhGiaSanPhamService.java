package com.noithat.qlnt.backend.service;

import com.noithat.qlnt.backend.entity.DanhGiaSanPham;

import java.util.List;

public interface IDanhGiaSanPhamService {
    DanhGiaSanPham create(DanhGiaSanPham danhGia);
    DanhGiaSanPham update(Integer maDanhGia, DanhGiaSanPham capNhat, Integer currentKhachHangId) ;
    void delete(Integer maDanhGia, Integer currentKhachHangId);
    List<DanhGiaSanPham> getByProduct(Integer maSanPham);
    Double getAverageRating(Integer maSanPham);
    Long getReviewCount(Integer maSanPham);
}
