package com.noithat.qlnt.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ChuongTrinhGiamGiaRequest {
    @NotBlank(message = "Tên chương trình không được để trống")
    private String tenChuongTrinh;
    
    private String moTa;
    
    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDateTime ngayBatDau;
    
    @NotNull(message = "Ngày kết thúc không được để trống")
    private LocalDateTime ngayKetThuc;
    
    private String trangThai = "đang hoạt động";
    
    private String loaiGiamGia;
    
    private java.math.BigDecimal giaTriGiam;
}