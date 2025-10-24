// ...existing code...
package com.noithat.qlnt.backend.repository;

import com.noithat.qlnt.backend.entity.LichSuTonKho;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LichSuTonKhoRepository extends JpaRepository<LichSuTonKho, Integer> {
    
    // Tìm lịch sử theo biến thể sản phẩm
    @Query("SELECT l FROM LichSuTonKho l WHERE l.bienTheSanPham.maBienThe = :maBienThe ORDER BY l.thoiGianThucHien DESC")
    List<LichSuTonKho> findByBienTheSanPhamOrderByThoiGianThucHienDesc(@Param("maBienThe") Integer maBienThe);
    
    // Tìm lịch sử theo loại giao dịch
    @Query("SELECT l FROM LichSuTonKho l WHERE l.loaiGiaoDich = :loaiGiaoDich ORDER BY l.thoiGianThucHien DESC")
    List<LichSuTonKho> findByLoaiGiaoDichOrderByThoiGianThucHienDesc(@Param("loaiGiaoDich") String loaiGiaoDich);
    
    // Tìm lịch sử trong khoảng thời gian
    @Query("SELECT l FROM LichSuTonKho l WHERE l.thoiGianThucHien BETWEEN :fromDate AND :toDate ORDER BY l.thoiGianThucHien DESC")
    List<LichSuTonKho> findByThoiGianThucHienBetweenOrderByThoiGianThucHienDesc(@Param("fromDate") LocalDateTime fromDate, 
                                                                                @Param("toDate") LocalDateTime toDate);
    
    // Tìm lịch sử theo mã tham chiếu (Order ID, Import ID, etc.)
    @Query("SELECT l FROM LichSuTonKho l WHERE l.maThamChieu = :maThamChieu ORDER BY l.thoiGianThucHien DESC")
    List<LichSuTonKho> findByMaThamChieuOrderByThoiGianThucHienDesc(@Param("maThamChieu") String maThamChieu);
    
    // Tìm lịch sử theo người thực hiện
    @Query("SELECT l FROM LichSuTonKho l WHERE l.nguoiThucHien = :nguoiThucHien ORDER BY l.thoiGianThucHien DESC")
    List<LichSuTonKho> findByNguoiThucHienOrderByThoiGianThucHienDesc(@Param("nguoiThucHien") String nguoiThucHien);
    
    // Thống kê giao dịch theo loại
    @Query("SELECT l.loaiGiaoDich, COUNT(l), SUM(l.soLuongThayDoi) FROM LichSuTonKho l GROUP BY l.loaiGiaoDich")
    List<Object[]> getTransactionSummaryByType();
    
    // Thống kê giao dịch theo sản phẩm
    @Query("SELECT sp.tenSanPham, l.loaiGiaoDich, SUM(l.soLuongThayDoi) " +
           "FROM LichSuTonKho l JOIN l.bienTheSanPham b JOIN b.sanPham sp " +
           "GROUP BY sp.maSanPham, sp.tenSanPham, l.loaiGiaoDich " +
           "ORDER BY sp.tenSanPham, l.loaiGiaoDich")
    List<Object[]> getTransactionSummaryByProduct();
    
    // Lấy lịch sử gần nhất của một biến thể
    @Query("SELECT l FROM LichSuTonKho l WHERE l.bienTheSanPham.maBienThe = :maBienThe " +
           "ORDER BY l.thoiGianThucHien DESC LIMIT 1")
    LichSuTonKho findLatestByBienTheSanPham(@Param("maBienThe") Integer maBienThe);

    // Lấy lịch sử theo danh sách biến thể
    List<LichSuTonKho> findByBienTheSanPham_MaBienTheIn(List<Integer> maBienTheList);

       // ===== Nhập kho only (soLuongThayDoi >= 0) =====
       @Query("SELECT l FROM LichSuTonKho l WHERE l.soLuongThayDoi >= 0 ORDER BY l.thoiGianThucHien DESC")
       List<LichSuTonKho> findAllNhapOrderByThoiGianThucHienDesc();

       @Query("SELECT l FROM LichSuTonKho l WHERE l.soLuongThayDoi >= 0 AND l.thoiGianThucHien BETWEEN :fromDate AND :toDate ORDER BY l.thoiGianThucHien DESC")
       List<LichSuTonKho> findNhapBetweenOrderByThoiGianThucHienDesc(@Param("fromDate") LocalDateTime fromDate,
                                                                                                                   @Param("toDate") LocalDateTime toDate);

              // ===== Nhập + Xuất (tất cả giao dịch) =====
              @Query("SELECT l FROM LichSuTonKho l ORDER BY l.thoiGianThucHien DESC")
              List<LichSuTonKho> findAllOrderByThoiGianThucHienDesc();

              @Query("SELECT l FROM LichSuTonKho l WHERE l.thoiGianThucHien BETWEEN :fromDate AND :toDate ORDER BY l.thoiGianThucHien DESC")
              List<LichSuTonKho> findAllBetweenOrderByThoiGianThucHienDesc(@Param("fromDate") LocalDateTime fromDate,
                                                                             @Param("toDate") LocalDateTime toDate);
}