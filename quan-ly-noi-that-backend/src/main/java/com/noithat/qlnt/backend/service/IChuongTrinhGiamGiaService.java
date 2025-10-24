package com.noithat.qlnt.backend.service;

import com.noithat.qlnt.backend.dto.request.ChuongTrinhGiamGiaDetailRequest;
import com.noithat.qlnt.backend.dto.request.ChuongTrinhGiamGiaRequest;
import com.noithat.qlnt.backend.dto.response.ChuongTrinhGiamGiaResponse;
import com.noithat.qlnt.backend.entity.ChuongTrinhGiamGia;
import com.noithat.qlnt.backend.dto.response.BienTheSanPhamGiaResponse;

import java.time.LocalDateTime;
import java.util.List;

public interface IChuongTrinhGiamGiaService {
    List<ChuongTrinhGiamGia> getAll();

    ChuongTrinhGiamGia getById(Integer id);

    ChuongTrinhGiamGia create(ChuongTrinhGiamGiaRequest chuongTrinhGiamGia);

    ChuongTrinhGiamGia create(String ten, LocalDateTime start, LocalDateTime end);

    ChuongTrinhGiamGia update(Integer id, String ten, LocalDateTime start, LocalDateTime end);

    void delete(Integer id);

    void updateStatus(Integer id, String trangThai);

    // Compatibility: compute the display price information for a variant (BienThe)
    BienTheSanPhamGiaResponse getBienTheGiaChiTiet(Integer maBienThe);

    // Variant-level operations removed; use product-level mappings (SanPhamGiamGia)
    // instead.
    ChuongTrinhGiamGiaResponse createWithDetails(ChuongTrinhGiamGiaDetailRequest request);

    ChuongTrinhGiamGiaResponse updateWithDetails(Integer id, ChuongTrinhGiamGiaDetailRequest request);

    ChuongTrinhGiamGiaResponse getDetailById(Integer id);

    List<ChuongTrinhGiamGiaResponse> getAllWithDetails();

    /**
     * Lấy danh sách chương trình ở dạng tóm tắt (không kèm danh sách biến thể) —
     * dùng cho giao diện danh sách để tránh trả payload quá lớn.
     */
    List<ChuongTrinhGiamGiaResponse> getAllSummaries();
}
