package com.noithat.qlnt.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * DTO Request để cập nhật thông tin của một hóa đơn.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class UpdateHoaDonRequest {
    // Hiện tại chỉ cho phép cập nhật nhân viên xuất hóa đơn
    @NotNull(message = "Mã nhân viên mới không được để trống")
    private Integer maNhanVienXuat;

    // Cho phép client gửi trường 'trangThai' nếu có (không bắt buộc).
    // Không có trường tương ứng trong entity HoaDon hiện tại, nhưng
    // việc chấp nhận thuộc tính này tránh lỗi parse khi client gửi nó.
    private String trangThai;
}