package com.noithat.qlnt.backend.service;

import com.noithat.qlnt.backend.dto.request.BienTheRequestDto;
import com.noithat.qlnt.backend.dto.request.BienTheUpdateRequestDto;
import com.noithat.qlnt.backend.entity.BienTheSanPham;

import java.util.List;

/**
 * Interface quản lý biến thể sản phẩm (Variant)
 */
public interface IVariantService {
    
    /**
     * Tạo biến thể mới
     */
    BienTheSanPham createVariant(BienTheRequestDto dto);
    
    /**
     * Lấy danh sách biến thể theo sản phẩm
     */
    List<BienTheSanPham> getVariantsByProductId(Integer productId);
    
    /**
     * Lấy biến thể theo ID
     */
    BienTheSanPham getVariantById(Integer id);
    
    /**
     * Cập nhật biến thể
     */
    BienTheSanPham updateVariant(Integer id, BienTheUpdateRequestDto dto);
    
    /**
     * Xóa biến thể
     */
    void deleteVariant(Integer id);
}
