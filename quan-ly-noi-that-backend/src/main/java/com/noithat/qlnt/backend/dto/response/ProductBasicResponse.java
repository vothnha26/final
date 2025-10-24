package com.noithat.qlnt.backend.dto.response;

/**
 * Lightweight product response for assignment UI
 */
public record ProductBasicResponse(
        Integer id,
        String tenSanPham,
        Integer maDanhMuc,
        String tenDanhMuc
) {}
