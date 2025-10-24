package com.noithat.qlnt.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

/**
 * Entity ThongBao - Quản lý thông báo cho Admin/Nhân viên
 * 
 * Loại thông báo:
 * - success: Thông báo thành công (xanh lá)
 * - warning: Cảnh báo (vàng)
 * - error: Lỗi (đỏ)
 * - info: Thông tin (xanh dương)
 * - order: Đơn hàng
 * - customer: Khách hàng
 * - inventory: Tồn kho
 * 
 * Loại người nhận:
 * - ADMIN: Chỉ admin xem được
 * - NHANVIEN: Nhân viên cụ thể (dựa vào NguoiNhanId)
 * - ALL: Tất cả mọi người
 */
@Entity
@Table(name = "ThongBao")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThongBao {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "MaThongBao")
    private Integer maThongBao;
    
    @Column(name = "Loai", nullable = false, columnDefinition = "NVARCHAR(50)")
    private String loai;
    
    @Column(name = "TieuDe", nullable = false, columnDefinition = "NVARCHAR(255)")
    private String tieuDe;
    
    @Column(name = "NoiDung", nullable = false, columnDefinition = "NVARCHAR(MAX)")
    private String noiDung;
    
    // `thoiGian` is a human-readable representation derived from `ngayTao`.
    // Keep it transient (computed) instead of persisted to avoid redundant stored data.
    
    @Builder.Default
    @Column(name = "DaDoc", nullable = false)
    private Boolean daDoc = false;
    
    @Column(name = "NguoiNhanId")
    private Integer nguoiNhanId;

    // Link to KhachHang entity for convenience (no schema change: use existing NguoiNhanId column)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "NguoiNhanId", referencedColumnName = "maKhachHang", insertable = false, updatable = false)
    private KhachHang khachHang;
    
    @Column(name = "LoaiNguoiNhan", nullable = false, columnDefinition = "NVARCHAR(20)")
    private String loaiNguoiNhan;
    
    @Builder.Default
    @Column(name = "NgayTao", nullable = false)
    private LocalDateTime ngayTao = LocalDateTime.now();
    
    @Column(name = "NgayCapNhat")
    private LocalDateTime ngayCapNhat;
    
    @Column(name = "NgayXoa")
    private LocalDateTime ngayXoa;
    
    @Column(name = "DuongDanHanhDong", columnDefinition = "NVARCHAR(500)")
    private String duongDanHanhDong;
    
    @Builder.Default
    @Column(name = "DoUuTien", nullable = false, columnDefinition = "NVARCHAR(20)")
    private String doUuTien = "normal";
    
    @Column(name = "LienKetId")
    private Integer lienKetId;
    
    @Column(name = "LoaiLienKet", columnDefinition = "NVARCHAR(50)")
    private String loaiLienKet;
    
    /**
     * Hook trước khi persist - Tự động set ngày tạo và tính thời gian hiển thị
     */
    @PrePersist
    protected void onCreate() {
        if (ngayTao == null) {
            ngayTao = LocalDateTime.now();
        }
        if (daDoc == null) {
            daDoc = false;
        }
        if (doUuTien == null) {
            doUuTien = "normal";
        }
    }
    
    /**
     * Hook trước khi update - Tự động set ngày cập nhật
     */
    @PreUpdate
    protected void onUpdate() {
        ngayCapNhat = LocalDateTime.now();
        // Cập nhật lại thời gian hiển thị
        if (ngayTao != null) {
            // computed transient thoiGian will reflect updated ngayTao via getThoiGian()
        }
    }

    @Transient
    public String getThoiGian() {
        return tinhThoiGianHienThi(this.ngayTao);
    }
    
    /**
     * Tính thời gian hiển thị dạng human-readable
     * Ví dụ: "Vừa xong", "5 phút trước", "2 giờ trước", "3 ngày trước"
     */
    public static String tinhThoiGianHienThi(LocalDateTime ngayTao) {
        if (ngayTao == null) {
            return "Không rõ";
        }
        
        LocalDateTime now = LocalDateTime.now();
        long minutes = ChronoUnit.MINUTES.between(ngayTao, now);
        
        if (minutes < 1) {
            return "Vừa xong";
        }
        if (minutes < 60) {
            return minutes + " phút trước";
        }
        
        long hours = minutes / 60;
        if (hours < 24) {
            return hours + " giờ trước";
        }
        
        long days = hours / 24;
        if (days < 30) {
            return days + " ngày trước";
        }
        
        long months = days / 30;
        if (months < 12) {
            return months + " tháng trước";
        }
        
        long years = months / 12;
        return years + " năm trước";
    }
    
    /**
     * Soft delete - Đánh dấu đã xóa thay vì xóa thật
     */
    public void softDelete() {
        this.ngayXoa = LocalDateTime.now();
    }
    
    /**
     * Kiểm tra thông báo đã bị xóa chưa
     */
    public boolean isDeleted() {
        return ngayXoa != null;
    }
    
    /**
     * Đánh dấu đã đọc
     */
    public void markAsRead() {
        this.daDoc = true;
        this.ngayCapNhat = LocalDateTime.now();
    }
    
    /**
     * Đánh dấu chưa đọc
     */
    public void markAsUnread() {
        this.daDoc = false;
        this.ngayCapNhat = LocalDateTime.now();
    }
    
    /**
     * Kiểm tra độ ưu tiên cao
     */
    public boolean isHighPriority() {
        return "high".equalsIgnoreCase(doUuTien);
    }
    
    /**
     * Kiểm tra có phải thông báo cho tất cả không
     */
    public boolean isForAll() {
        return "ALL".equalsIgnoreCase(loaiNguoiNhan);
    }
}
