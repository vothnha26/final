package com.noithat.qlnt.backend.repository;

import com.noithat.qlnt.backend.entity.DonHang;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface DonHangRepository extends JpaRepository<DonHang, Integer> {

    // =================== CÁC TRUY VẤN THỐNG KÊ ===================

    // Đếm số đơn hàng theo trạng thái (sử dụng JPQL cho an toàn và nhất quán)
    long countByTrangThaiDonHang(String trangThaiDonHang);
    
    // Tính tổng thành tiền của các đơn hàng có trạng thái nhất định
    @Query("SELECT COALESCE(SUM(d.thanhTien), 0) FROM DonHang d WHERE d.trangThaiDonHang = :trangThai")
    BigDecimal sumThanhTienByTrangThaiDonHang(@Param("trangThai") String trangThai);

    // Tính doanh thu trong ngày hôm nay
    @Query(value = """
            SELECT COALESCE(SUM(ThanhTien), 0)
            FROM DonHang
            WHERE CAST(NgayDatHang AS DATE) = CAST(GETDATE() AS DATE)
              AND TrangThaiDonHang NOT IN ('CANCELLED', 'RETURNED')
            """, nativeQuery = true)
    BigDecimal sumDoanhThuHomNay();
    
    // =================== CÁC TRUY VẤN QUẢN LÝ ĐƠN HÀNG ===================
    
    // Tìm theo một trạng thái đơn hàng
    @Query("SELECT d FROM DonHang d WHERE d.trangThaiDonHang = :trangThai ORDER BY d.ngayDatHang DESC")
    List<DonHang> findByTrangThaiDonHang(@Param("trangThai") String trangThai);
    
    // Tìm theo nhiều trạng thái đơn hàng
    @Query("SELECT d FROM DonHang d WHERE d.trangThaiDonHang IN :trangThaiList ORDER BY d.ngayDatHang DESC")
    List<DonHang> findByTrangThaiDonHangIn(@Param("trangThaiList") List<String> trangThaiList);
    
    // Tìm theo khách hàng
    @Query("SELECT d FROM DonHang d WHERE d.khachHang.maKhachHang = :maKhachHang ORDER BY d.ngayDatHang DESC")
    List<DonHang> findByKhachHang(@Param("maKhachHang") Integer maKhachHang);
    
    // Tìm theo khoảng thời gian đặt hàng
    @Query("SELECT d FROM DonHang d WHERE d.ngayDatHang BETWEEN :fromDate AND :toDate ORDER BY d.ngayDatHang DESC")
    List<DonHang> findByNgayDatHangBetween(@Param("fromDate") LocalDateTime fromDate, 
                                           @Param("toDate") LocalDateTime toDate);
    
  // NOTE: 'nhanVienDuyet' removed from DonHang entity; queries by approver should be
  // implemented via a custom repository or by joining on a persisted relationship when needed.
    
    // Đếm tổng số đơn hàng của một khách hàng
    long countByKhachHang_MaKhachHang(Integer maKhachHang);
}