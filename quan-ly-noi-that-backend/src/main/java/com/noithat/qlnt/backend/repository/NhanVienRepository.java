package com.noithat.qlnt.backend.repository;

import com.noithat.qlnt.backend.entity.NhanVien;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface NhanVienRepository extends JpaRepository<NhanVien, Integer> {
    // Các phương thức CRUD cơ bản đã được JpaRepository cung cấp.
    java.util.Optional<NhanVien> findByTaiKhoan(com.noithat.qlnt.backend.entity.TaiKhoan taiKhoan);
    java.util.Optional<NhanVien> findByTaiKhoan_TenDangNhap(String tenDangNhap);
}
