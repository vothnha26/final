package com.noithat.qlnt.backend.repository;

import com.noithat.qlnt.backend.entity.DanhGiaSanPham;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DanhGiaSanPhamRepository extends JpaRepository<DanhGiaSanPham, Integer> {
    List<DanhGiaSanPham> findBySanPham_MaSanPham(Integer maSanPham);

    @Query("SELECT AVG(d.diem) FROM DanhGiaSanPham d WHERE d.sanPham.maSanPham = :pid")
    Double findAverageByProductId(@Param("pid") Integer productId);

    @Query("SELECT COUNT(d) FROM DanhGiaSanPham d WHERE d.sanPham.maSanPham = :pid")
    Long countByProductId(@Param("pid") Integer productId);

    List<DanhGiaSanPham> findByKhachHang_MaKhachHangAndSanPham_MaSanPham(Integer maKhachHang, Integer maSanPham);
}
