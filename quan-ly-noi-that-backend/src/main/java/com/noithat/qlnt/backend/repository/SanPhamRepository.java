package com.noithat.qlnt.backend.repository;

import com.noithat.qlnt.backend.entity.SanPham;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SanPhamRepository extends JpaRepository<SanPham, Integer> {
    
    // Tìm tất cả sản phẩm thuộc một bộ sưu tập (quan hệ 1-N)
    List<SanPham> findByBoSuuTap_MaBoSuuTap(Integer maBoSuuTap);
    
    // Hoặc dùng JPQL query
    @Query("SELECT s FROM SanPham s WHERE s.boSuuTap.maBoSuuTap = :maBoSuuTap")
    List<SanPham> findByBoSuuTapId(@Param("maBoSuuTap") Integer maBoSuuTap);
    
    // Tìm sản phẩm theo danh mục
    List<SanPham> findByDanhMuc_MaDanhMuc(Integer maDanhMuc);

    // Đếm số lượng sản phẩm trong một danh mục (không tính đệ quy)
    long countByDanhMuc_MaDanhMuc(Integer maDanhMuc);

    // Đếm số lượng sản phẩm trong một bộ sưu tập
    long countByBoSuuTap_MaBoSuuTap(Integer maBoSuuTap);
}