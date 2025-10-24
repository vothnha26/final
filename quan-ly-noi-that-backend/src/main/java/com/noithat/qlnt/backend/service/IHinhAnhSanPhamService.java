package com.noithat.qlnt.backend.service;

import com.noithat.qlnt.backend.dto.request.HinhAnhSanPhamRequestDto;
import com.noithat.qlnt.backend.entity.HinhAnhSanPham;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface IHinhAnhSanPhamService {
    
    /**
     * Lấy tất cả hình ảnh với phân trang
     */
    Page<HinhAnhSanPham> getAllHinhAnh(Pageable pageable);
    
    /**
     * Lấy hình ảnh theo ID
     */
    HinhAnhSanPham getHinhAnhById(Integer id);
    
    /**
     * Lấy tất cả hình ảnh của một sản phẩm
     */
    List<HinhAnhSanPham> getHinhAnhBySanPham(Integer maSanPham);
    
    /**
     * Lấy hình ảnh chính của sản phẩm
     */
    HinhAnhSanPham getHinhAnhChinh(Integer maSanPham);
    
    /**
     * Tạo hình ảnh mới cho sản phẩm
     */
    HinhAnhSanPham createHinhAnh(Integer maSanPham, HinhAnhSanPhamRequestDto request);
    
    /**
     * Cập nhật hình ảnh
     */
    HinhAnhSanPham updateHinhAnh(Integer id, HinhAnhSanPhamRequestDto request);
    
    /**
     * Xóa hình ảnh
     */
    void deleteHinhAnh(Integer id);
    
    /**
     * Đặt hình ảnh làm ảnh chính
     */
    HinhAnhSanPham setAsMainImage(Integer id);
    
    /**
     * Cập nhật thứ tự hình ảnh
     */
    HinhAnhSanPham updateThuTu(Integer id, Integer thuTu);
    
    /**
     * Xóa tất cả hình ảnh của sản phẩm
     */
    void deleteAllBySanPham(Integer maSanPham);
}
