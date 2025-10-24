package com.noithat.qlnt.backend.repository;

import com.noithat.qlnt.backend.entity.KhachHang;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface KhachHangRepository extends JpaRepository<KhachHang, Integer> {
    
    // Membership tier related queries
    long countByHangThanhVien_MaHangThanhVien(Integer maHangThanhVien);
    
    List<KhachHang> findByHangThanhVien_MaHangThanhVien(Integer maHangThanhVien);
    
    Page<KhachHang> findByHangThanhVien_MaHangThanhVien(Integer maHangThanhVien, Pageable pageable);
    
    List<KhachHang> findByHangThanhVien_TenHang(String tenHang);
    
    // Customer lookup methods
    Optional<KhachHang> findByEmail(String email);
    
    Optional<KhachHang> findBySoDienThoai(String soDienThoai);
    
    // Tìm KhachHang theo tên đăng nhập của tài khoản liên kết
    Optional<KhachHang> findByTaiKhoan_TenDangNhap(String tenDangNhap);
    
    // Search functionality
    @Query("SELECT k FROM KhachHang k WHERE k.hoTen LIKE %:keyword% OR k.email LIKE %:keyword% OR k.soDienThoai LIKE %:keyword%")
    Page<KhachHang> findByKeyword(@Param("keyword") String keyword, Pageable pageable);
}