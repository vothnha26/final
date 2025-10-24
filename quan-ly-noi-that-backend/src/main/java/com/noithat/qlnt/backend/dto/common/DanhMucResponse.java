package com.noithat.qlnt.backend.dto.common;

import java.util.List;

/**
 * Response DTO for DanhMuc returned by REST API.
 * Extended to include parent name for frontend compatibility.
 */
public record DanhMucResponse(
    Integer maDanhMuc, 
    String tenDanhMuc, 
    String moTa, 
    Integer parentId,
    Integer maDanhMucCha,      // Alias for parentId (frontend compatibility)
    String tenDanhMucCha,      // Parent category name
    List<Integer> childrenIds, 
    Long soLuongSanPham
) {}
