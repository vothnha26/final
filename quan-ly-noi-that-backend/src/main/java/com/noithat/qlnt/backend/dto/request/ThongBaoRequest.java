package com.noithat.qlnt.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO Request cho việc tạo hoặc cập nhật Thông báo
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ThongBaoRequest {
    
    @NotBlank(message = "Loại thông báo không được để trống")
    private String loai; // 'success', 'warning', 'error', 'info', 'order', 'customer', 'inventory'
    
    @NotBlank(message = "Tiêu đề không được để trống")
    private String tieuDe;
    
    @NotBlank(message = "Nội dung không được để trống")
    private String noiDung;
    
    private Integer nguoiNhanId; // Có thể null nếu gửi cho ALL
    
    @NotBlank(message = "Loại người nhận không được để trống")
    private String loaiNguoiNhan; // 'ALL', 'ADMIN', 'NHANVIEN'
    
    private String duongDanHanhDong; // URL để navigate
    
    private String doUuTien; // 'high', 'medium', 'low', 'normal' - default: 'normal'
    
    private Integer lienKetId; // ID của entity liên quan (DonHang, KhachHang, SanPham, etc.)
    
    private String loaiLienKet; // 'DON_HANG', 'KHACH_HANG', 'SAN_PHAM', 'TON_KHO', etc.
}
