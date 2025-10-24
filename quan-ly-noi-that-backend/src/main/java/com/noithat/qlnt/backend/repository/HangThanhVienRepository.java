package com.noithat.qlnt.backend.repository;

import com.noithat.qlnt.backend.entity.HangThanhVien;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface HangThanhVienRepository extends JpaRepository<HangThanhVien, Integer> {

    // Basic sorting methods (from both branches)
    List<HangThanhVien> findAllByOrderByDiemToiThieuAsc();

    List<HangThanhVien> findAllByOrderByDiemToiThieuDesc();

    Optional<HangThanhVien> findFirstByOrderByDiemToiThieuAsc();

    // Validation methods
    boolean existsByTenHang(String tenHang);

    boolean existsByDiemToiThieu(Integer diemToiThieu);

    Optional<HangThanhVien> findByTenHang(String tenHang);

    // VIP Management methods (new features)
    List<HangThanhVien> findAllByTrangThaiTrueOrderByDiemToiThieuAsc();

    Optional<HangThanhVien> findFirstByTrangThaiTrueOrderByDiemToiThieuAsc();

    // Deprecated: original finder based on SoTienToiThieu removed. Use
    // diemToiThieu-based finder below.
    Optional<HangThanhVien> findTopByDiemToiThieuLessThanEqualAndTrangThaiTrueOrderByDiemToiThieuDesc(Integer diem);

    List<HangThanhVien> findAllByTrangThaiOrderByDiemToiThieuAsc(Boolean trangThai);
}