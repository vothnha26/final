package com.noithat.qlnt.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class KhachHangCreationRequest {
    @NotBlank(message = "Họ tên không được để trống")
    private String hoTen;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0|\\+84)[0-9]{9}$", message = "Số điện thoại không hợp lệ")
    private String soDienThoai;

    private String diaChi;

    @NotNull(message = "Hạng thành viên không được để trống")
    private Integer maHangThanhVien;

    // Optional - có thể tạo khách hàng mà không cần tài khoản ngay lập tức
    private Integer maTaiKhoan;
}