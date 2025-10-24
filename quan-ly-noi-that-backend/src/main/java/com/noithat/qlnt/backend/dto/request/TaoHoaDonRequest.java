package com.noithat.qlnt.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * DTO Request để tạo một hóa đơn mới (sử dụng trong luồng tự động).
 */
@Data
public class TaoHoaDonRequest {
    @NotNull(message = "Mã đơn hàng không được để trống")
    private Integer maDonHang;

    @NotNull(message = "Mã nhân viên xuất không được để trống")
    private Integer maNhanVienXuat;
}