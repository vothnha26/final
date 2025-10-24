package com.noithat.qlnt.backend.repository;

import com.noithat.qlnt.backend.entity.YeuThich;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface YeuThichRepository extends JpaRepository<YeuThich, Integer> {
    List<YeuThich> findByKhachHang_MaKhachHang(Integer maKhachHang);

    @Query("SELECT y.sanPham.maSanPham FROM YeuThich y WHERE y.khachHang.maKhachHang = :khId")
    List<Integer> findProductIdsByKhachHang(@Param("khId") Integer khId);

    void deleteByKhachHang_MaKhachHangAndSanPham_MaSanPham(Integer maKhachHang, Integer maSanPham);

    boolean existsByKhachHang_MaKhachHangAndSanPham_MaSanPham(Integer maKhachHang, Integer maSanPham);
}
