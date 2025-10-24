package com.noithat.qlnt.backend.repository;

import com.noithat.qlnt.backend.entity.VoucherHangThanhVien;
import com.noithat.qlnt.backend.entity.VoucherHangThanhVien.VoucherHangThanhVienId;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

// Khóa chính phức hợp yêu cầu phải dùng VoucherHangThanhVienId
public interface VoucherHangThanhVienRepository extends JpaRepository<VoucherHangThanhVien, VoucherHangThanhVienId> {
    List<VoucherHangThanhVien> findByHangThanhVien_MaHangThanhVien(Integer maHangThanhVien);
}