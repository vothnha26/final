package com.noithat.qlnt.backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class GiaoDichThanhToanRequest {
    @NotBlank(message = "Phương thức thanh toán không được để trống")
    private String phuongThuc;

    @NotNull(message = "Số tiền thanh toán không được để trống")
    private BigDecimal soTien;

    @NotBlank(message = "Trạng thái giao dịch không được để trống")
    private String trangThai;
}
