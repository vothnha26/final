package com.noithat.qlnt.backend.repository;

import com.noithat.qlnt.backend.entity.HinhAnhSanPham;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HinhAnhSanPhamRepository extends JpaRepository<HinhAnhSanPham, Integer> {
    
    /**
     * Lấy tất cả hình ảnh của một sản phẩm
     */
    List<HinhAnhSanPham> findBySanPhamMaSanPham(Integer maSanPham);
    
    /**
     * Lấy tất cả hình ảnh của một sản phẩm, sắp xếp theo thứ tự
     */
    List<HinhAnhSanPham> findBySanPhamMaSanPhamOrderByThuTuAsc(Integer maSanPham);
    
    /**
     * Lấy hình ảnh chính của sản phẩm
     */
    Optional<HinhAnhSanPham> findBySanPhamMaSanPhamAndLaAnhChinhTrue(Integer maSanPham);
    
    /**
     * Lấy tất cả hình ảnh active của sản phẩm
     */
    List<HinhAnhSanPham> findBySanPhamMaSanPhamAndTrangThaiTrue(Integer maSanPham);
    
    /**
     * Đếm số lượng hình ảnh của sản phẩm
     */
    @Query("SELECT COUNT(h) FROM HinhAnhSanPham h WHERE h.sanPham.maSanPham = :maSanPham")
    Long countBySanPham(@Param("maSanPham") Integer maSanPham);
    
    /**
     * Xóa tất cả hình ảnh của sản phẩm
     */
    void deleteBySanPhamMaSanPham(Integer maSanPham);
}
