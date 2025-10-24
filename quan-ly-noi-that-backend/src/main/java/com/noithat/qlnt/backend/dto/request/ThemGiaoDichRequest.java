package com.noithat.qlnt.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import java.math.BigDecimal;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ThemGiaoDichRequest {

    @NotNull(message = "Mã đơn hàng không được để trống")
    private Integer maDonHang;

    @NotNull(message = "Số tiền không được để trống")
    @Positive(message = "Số tiền phải là số dương")
    private BigDecimal soTien;

    private BigDecimal phiGiaoDich;

    @NotEmpty(message = "Phương thức thanh toán không được để trống")
    @JsonAlias({"phuongThucThanhToan", "phuongThuc"})
    private String phuongThuc;

    private String trangThai; // Thường sẽ có giá trị mặc định là "Hoàn thành" hoặc "Chờ xử lý"

    private String maGiaoDichNganHang; // Mã tham chiếu từ bên ngoài

    private String ghiChu;
}