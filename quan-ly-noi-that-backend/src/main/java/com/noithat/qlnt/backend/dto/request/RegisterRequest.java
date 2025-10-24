package com.noithat.qlnt.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(min = 3, max = 50, message = "Tên đăng nhập phải từ 3 đến 50 ký tự")
    private String tenDangNhap;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 6, message = "Mật khẩu phải có ít nhất 6 ký tự")
    @JsonAlias({ "matKhau", "mat_khau", "password" })
    private String password;

    @NotBlank(message = "Họ tên không được để trống")
    @JsonAlias({ "ho", "ten", "hoTen", "fullName" })
    private String hoTen;

    @NotBlank(message = "Số điện thoại không được để trống")
    @JsonAlias({ "soDienThoai", "so_dien_thoai", "phone" })
    private String soDienThoai;

    // Optional role - if not provided, defaults to USER
    @JsonAlias({ "vaiTro", "role", "roleName" })
    private String vaiTro;
}