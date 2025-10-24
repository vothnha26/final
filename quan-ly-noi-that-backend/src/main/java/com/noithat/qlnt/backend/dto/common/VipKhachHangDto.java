package com.noithat.qlnt.backend.dto.common;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class VipKhachHangDto {
    private Integer maKhachHang;
    
    @NotBlank(message = "Họ tên không được để trống")
    private String hoTen;
    
    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không hợp lệ")
    private String email;
    
    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^[0-9]{10,11}$", message = "Số điện thoại không hợp lệ")
    private String soDienThoai;
    
    private String diaChi;
    
    private Integer diemThuong;
    
    // VIP related fields
    private String vipLevel; // Level code: bronze, silver, gold, platinum, diamond
    private String tenHang; // Tên hạng thành viên
    
    @DecimalMin(value = "0.0", message = "Tổng chi tiêu phải lớn hơn hoặc bằng 0")
    private BigDecimal tongChiTieu;
    
    @Min(value = 0, message = "Tổng đơn hàng phải lớn hơn hoặc bằng 0")
    private Integer tongDonHang;
    
    private LocalDate ngayThamGia;
    private LocalDate donHangCuoi;
    
    @Pattern(regexp = "^(active|inactive)$", message = "Trạng thái VIP phải là active hoặc inactive")
    private String trangThaiVip;
    
    // Display fields from frontend
    private List<String> benefits; // Danh sách ưu đãi
    private String mauSac; // Màu sắc hiển thị
    private String icon; // Icon hiển thị
}