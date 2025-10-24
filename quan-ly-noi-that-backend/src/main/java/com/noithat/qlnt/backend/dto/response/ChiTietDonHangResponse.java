package com.noithat.qlnt.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChiTietDonHangResponse {
    private String tenSanPham;
    private String sku;
    private int soLuong;
    private BigDecimal donGia; // For backward compatibility (will be donGiaGoc)
    private BigDecimal donGiaGoc; // Original price before discount
    private BigDecimal donGiaThucTe; // Actual price after discount
    private BigDecimal thanhTien;
}
