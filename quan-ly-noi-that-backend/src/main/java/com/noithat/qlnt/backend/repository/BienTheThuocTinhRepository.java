package com.noithat.qlnt.backend.repository;

import com.noithat.qlnt.backend.entity.BienTheThuocTinh;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BienTheThuocTinhRepository extends JpaRepository<BienTheThuocTinh, Integer> {
    List<BienTheThuocTinh> findByBienTheSanPham_MaBienThe(Integer maBienThe);
    void deleteByBienTheSanPham_MaBienThe(Integer maBienThe);

    // Distinct value helpers
    List<BienTheThuocTinh> findByThuocTinh_MaThuocTinh(Integer maThuocTinh);
    List<BienTheThuocTinh> findByThuocTinh_MaThuocTinhAndBienTheSanPham_SanPham_MaSanPham(Integer maThuocTinh, Integer maSanPham);
}
