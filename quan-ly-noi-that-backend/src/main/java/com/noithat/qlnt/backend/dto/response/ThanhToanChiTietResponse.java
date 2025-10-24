package com.noithat.qlnt.backend.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO (Data Transfer Object) for detailed payment transaction information.
 * Used to populate the payment details modal/pop-up.
 */
@Data
public class ThanhToanChiTietResponse {

    // === Thông tin giao dịch ===
    private String maThanhToan;       // Example: "PAY003"
    private String maDonHang;         // Example: "ORD003"
    private BigDecimal soTien;          // The total amount of the transaction
    private BigDecimal phiGiaoDich;     // Transaction fees, if any
    private BigDecimal soTienThucNhan; // Amount after deducting fees

    // === Thông tin xử lý ===
    private String trangThai;           // Status: "Hoàn thành", "Chờ xử lý", "Thất bại"
    private String nguoiXuLy;          // Name of the employee who processed it
    private LocalDateTime thoiGianGiaoDich; // Timestamp of the transaction
    private String maGiaoDichNgoai;   // External transaction ID (e.g., from VNPay, Momo)
    private String phuongThuc;          // Payment method: "Tiền mặt", "Chuyển khoản"
}