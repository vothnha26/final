package com.noithat.qlnt.backend.repository;

import com.noithat.qlnt.backend.entity.ThongBao;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Repository cho ThongBao
 * Quản lý truy vấn dữ liệu thông báo
 */
@Repository
public interface ThongBaoRepository extends JpaRepository<ThongBao, Integer> {
    
    // ==================== Queries cơ bản ====================
    
    /**
     * Lấy tất cả thông báo chưa bị xóa, sắp xếp theo ngày tạo mới nhất
     */
    List<ThongBao> findByNgayXoaIsNullOrderByNgayTaoDesc();
    
    /**
     * Lấy thông báo theo ID và chưa bị xóa
     */
    @Query("SELECT t FROM ThongBao t WHERE t.maThongBao = :id AND t.ngayXoa IS NULL")
    ThongBao findByIdAndNotDeleted(@Param("id") Integer id);
    
    // ==================== Queries theo người nhận ====================
    
    /**
     * Lấy thông báo cho người nhận cụ thể (chưa bị xóa)
     */
    List<ThongBao> findByNguoiNhanIdAndNgayXoaIsNullOrderByNgayTaoDesc(Integer nguoiNhanId);
    
    /**
     * Lấy thông báo theo loại người nhận (ALL, ADMIN, NHANVIEN)
     */
    List<ThongBao> findByLoaiNguoiNhanAndNgayXoaIsNullOrderByNgayTaoDesc(String loaiNguoiNhan);
    
    /**
     * Lấy thông báo cho người dùng (bao gồm cả thông báo cho ALL và cho user cụ thể)
     */
    @Query("SELECT t FROM ThongBao t WHERE t.ngayXoa IS NULL " +
           "AND (t.loaiNguoiNhan = 'ALL' OR (t.loaiNguoiNhan = :loaiNguoiNhan AND t.nguoiNhanId = :nguoiNhanId)) " +
           "ORDER BY t.ngayTao DESC")
    List<ThongBao> findNotificationsForUser(@Param("nguoiNhanId") Integer nguoiNhanId, 
                                            @Param("loaiNguoiNhan") String loaiNguoiNhan);
    
    /**
     * Lấy thông báo cho người dùng với phân trang
     */
    @Query("SELECT t FROM ThongBao t WHERE t.ngayXoa IS NULL " +
           "AND (t.loaiNguoiNhan = 'ALL' OR (t.loaiNguoiNhan = :loaiNguoiNhan AND t.nguoiNhanId = :nguoiNhanId)) " +
           "ORDER BY t.ngayTao DESC")
    Page<ThongBao> findNotificationsForUser(@Param("nguoiNhanId") Integer nguoiNhanId, 
                                            @Param("loaiNguoiNhan") String loaiNguoiNhan,
                                            Pageable pageable);
    
    // ==================== Queries theo trạng thái đã đọc ====================
    
    /**
     * Đếm thông báo chưa đọc của người nhận cụ thể
     */
    long countByNguoiNhanIdAndDaDocFalseAndNgayXoaIsNull(Integer nguoiNhanId);
    
    /**
     * Đếm thông báo chưa đọc theo loại người nhận
     */
    long countByLoaiNguoiNhanAndDaDocFalseAndNgayXoaIsNull(String loaiNguoiNhan);
    
    /**
     * Đếm thông báo chưa đọc cho người dùng (bao gồm ALL và user cụ thể)
     */
    @Query("SELECT COUNT(t) FROM ThongBao t WHERE t.ngayXoa IS NULL AND t.daDoc = false " +
           "AND (t.loaiNguoiNhan = 'ALL' OR (t.loaiNguoiNhan = :loaiNguoiNhan AND t.nguoiNhanId = :nguoiNhanId))")
    long countUnreadForUser(@Param("nguoiNhanId") Integer nguoiNhanId, 
                           @Param("loaiNguoiNhan") String loaiNguoiNhan);
    
    /**
     * Lấy thông báo chưa đọc của người dùng
     */
    @Query("SELECT t FROM ThongBao t WHERE t.ngayXoa IS NULL AND t.daDoc = false " +
           "AND (t.loaiNguoiNhan = 'ALL' OR (t.loaiNguoiNhan = :loaiNguoiNhan AND t.nguoiNhanId = :nguoiNhanId)) " +
           "ORDER BY t.ngayTao DESC")
    List<ThongBao> findUnreadNotificationsForUser(@Param("nguoiNhanId") Integer nguoiNhanId, 
                                                   @Param("loaiNguoiNhan") String loaiNguoiNhan);
    
    // ==================== Queries theo loại thông báo ====================
    
    /**
     * Lấy thông báo theo loại (success, warning, error, etc.)
     */
    List<ThongBao> findByLoaiAndNgayXoaIsNullOrderByNgayTaoDesc(String loai);
    
    /**
     * Lấy thông báo theo loại cho người dùng
     */
    @Query("SELECT t FROM ThongBao t WHERE t.ngayXoa IS NULL AND t.loai = :loai " +
           "AND (t.loaiNguoiNhan = 'ALL' OR (t.loaiNguoiNhan = :loaiNguoiNhan AND t.nguoiNhanId = :nguoiNhanId)) " +
           "ORDER BY t.ngayTao DESC")
    List<ThongBao> findByLoaiForUser(@Param("loai") String loai,
                                      @Param("nguoiNhanId") Integer nguoiNhanId, 
                                      @Param("loaiNguoiNhan") String loaiNguoiNhan);
    
    // ==================== Queries theo độ ưu tiên ====================
    
    /**
     * Lấy thông báo theo độ ưu tiên (high, medium, low, normal)
     */
    List<ThongBao> findByDoUuTienAndNgayXoaIsNullOrderByNgayTaoDesc(String doUuTien);
    
    /**
     * Lấy thông báo ưu tiên cao chưa đọc
     */
    @Query("SELECT t FROM ThongBao t WHERE t.ngayXoa IS NULL AND t.daDoc = false AND t.doUuTien = 'high' " +
           "AND (t.loaiNguoiNhan = 'ALL' OR (t.loaiNguoiNhan = :loaiNguoiNhan AND t.nguoiNhanId = :nguoiNhanId)) " +
           "ORDER BY t.ngayTao DESC")
    List<ThongBao> findHighPriorityUnreadForUser(@Param("nguoiNhanId") Integer nguoiNhanId, 
                                                  @Param("loaiNguoiNhan") String loaiNguoiNhan);
    
    // ==================== Queries theo liên kết ====================
    
    /**
     * Lấy thông báo theo loại liên kết và ID (ví dụ: DON_HANG, maDonHang)
     */
    List<ThongBao> findByLoaiLienKetAndLienKetIdAndNgayXoaIsNullOrderByNgayTaoDesc(String loaiLienKet, Integer lienKetId);
    
    // ==================== Update operations ====================
    
    /**
     * Đánh dấu tất cả thông báo của người dùng là đã đọc
     */
    @Modifying
    @Query("UPDATE ThongBao t SET t.daDoc = true, t.ngayCapNhat = :now " +
           "WHERE t.ngayXoa IS NULL AND t.daDoc = false " +
           "AND (t.loaiNguoiNhan = 'ALL' OR (t.loaiNguoiNhan = :loaiNguoiNhan AND t.nguoiNhanId = :nguoiNhanId))")
    int markAllAsReadForUser(@Param("nguoiNhanId") Integer nguoiNhanId, 
                             @Param("loaiNguoiNhan") String loaiNguoiNhan,
                             @Param("now") LocalDateTime now);
    
    /**
     * Soft delete thông báo cũ (quá 30 ngày)
     */
    @Modifying
    @Query("UPDATE ThongBao t SET t.ngayXoa = :now " +
           "WHERE t.ngayXoa IS NULL AND t.ngayTao < :cutoffDate")
    int softDeleteOldNotifications(@Param("now") LocalDateTime now, 
                                   @Param("cutoffDate") LocalDateTime cutoffDate);
    
    /**
     * Xóa hẳn thông báo đã soft delete quá 90 ngày
     */
    @Modifying
    @Query("DELETE FROM ThongBao t WHERE t.ngayXoa IS NOT NULL AND t.ngayXoa < :cutoffDate")
    int permanentlyDeleteOldNotifications(@Param("cutoffDate") LocalDateTime cutoffDate);
    
    // ==================== Statistics ====================
    
    /**
     * Đếm tổng số thông báo chưa xóa
     */
    long countByNgayXoaIsNull();
    
    /**
     * Đếm thông báo theo loại
     */
    long countByLoaiAndNgayXoaIsNull(String loai);
    
    /**
     * Đếm thông báo theo độ ưu tiên
     */
    long countByDoUuTienAndNgayXoaIsNull(String doUuTien);
    
    /**
     * Lấy thông báo trong khoảng thời gian
     */
    @Query("SELECT t FROM ThongBao t WHERE t.ngayXoa IS NULL " +
           "AND t.ngayTao BETWEEN :startDate AND :endDate " +
           "ORDER BY t.ngayTao DESC")
    List<ThongBao> findNotificationsBetweenDates(@Param("startDate") LocalDateTime startDate,
                                                  @Param("endDate") LocalDateTime endDate);
}
