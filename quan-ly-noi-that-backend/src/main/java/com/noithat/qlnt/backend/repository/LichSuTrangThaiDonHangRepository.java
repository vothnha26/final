package com.noithat.qlnt.backend.repository;

import com.noithat.qlnt.backend.entity.LichSuTrangThaiDonHang;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LichSuTrangThaiDonHangRepository extends JpaRepository<LichSuTrangThaiDonHang, Integer> {
    
    // Tìm lịch sử theo đơn hàng
    @Query("SELECT l FROM LichSuTrangThaiDonHang l WHERE l.donHang.maDonHang = :maDonHang ORDER BY l.thoiGianThayDoi DESC")
    List<LichSuTrangThaiDonHang> findByDonHangOrderByThoiGianThayDoiDesc(@Param("maDonHang") Integer maDonHang);
    
    // Tìm lịch sử theo trạng thái
    @Query("SELECT l FROM LichSuTrangThaiDonHang l WHERE l.trangThaiMoi = :trangThai")
    List<LichSuTrangThaiDonHang> findByTrangThaiMoi(@Param("trangThai") String trangThai);
    
    // Tìm lịch sử trong khoảng thời gian
    @Query("SELECT l FROM LichSuTrangThaiDonHang l WHERE l.thoiGianThayDoi BETWEEN :fromDate AND :toDate")
    List<LichSuTrangThaiDonHang> findByThoiGianThayDoiBetween(@Param("fromDate") LocalDateTime fromDate, 
                                                               @Param("toDate") LocalDateTime toDate);
    
    // Tìm lịch sử theo người thay đổi
    @Query("SELECT l FROM LichSuTrangThaiDonHang l WHERE l.nguoiThayDoi = :nguoiThayDoi")
    List<LichSuTrangThaiDonHang> findByNguoiThayDoi(@Param("nguoiThayDoi") String nguoiThayDoi);
    
    // Thống kê thời gian xử lý đơn hàng theo trạng thái
    @Query("SELECT l.trangThaiMoi, AVG(TIMESTAMPDIFF(HOUR, l.donHang.ngayDatHang, l.thoiGianThayDoi)) " +
           "FROM LichSuTrangThaiDonHang l GROUP BY l.trangThaiMoi")
    List<Object[]> getAverageProcessingTimeByStatus();
}