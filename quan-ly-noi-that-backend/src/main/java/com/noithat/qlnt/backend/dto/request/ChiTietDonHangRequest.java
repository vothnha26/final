package com.noithat.qlnt.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ChiTietDonHangRequest {

    @NotNull(message = "Mã sản phẩm không được để trống")
    private Integer maSanPham;
    
    @NotNull(message = "Mã biến thể không được để trống")
    private Integer maBienThe;

    @NotNull(message = "Số lượng không được để trống")
    private Integer soLuong;
    
    // Optional - có thể client gửi đơn giá nhưng server sẽ tính lại từ database
    private BigDecimal donGia;
}
