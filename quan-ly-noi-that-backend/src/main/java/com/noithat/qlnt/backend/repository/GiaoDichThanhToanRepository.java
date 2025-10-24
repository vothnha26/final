package com.noithat.qlnt.backend.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.noithat.qlnt.backend.entity.GiaoDichThanhToan;

import java.math.BigDecimal;
import java.util.List;

public interface GiaoDichThanhToanRepository extends JpaRepository<GiaoDichThanhToan, Integer> {
    List<GiaoDichThanhToan> findByDonHang_MaDonHang(Integer maDonHang);
     long countByTrangThai(String trangThai);

    /**
     * Tính tổng số tiền của các giao dịch theo trạng thái.
     */
    @Query("SELECT SUM(g.soTien) FROM GiaoDichThanhToan g WHERE g.trangThai = :trangThai")
    BigDecimal sumSoTienByTrangThai(@Param("trangThai") String trangThai);

    @Query("SELECT g FROM GiaoDichThanhToan g WHERE " +
           "(:trangThai IS NULL OR g.trangThai = :trangThai) AND " +
           "(:phuongThuc IS NULL OR g.phuongThuc = :phuongThuc)")
    List<GiaoDichThanhToan> findByFilters(@Param("trangThai") String trangThai,
                                          @Param("phuongThuc") String phuongThuc);
}
