package com.noithat.qlnt.backend.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class BienTheGiamGiaRequest {
    
    @NotNull(message = "Mã biến thể không được để trống")
    @Positive(message = "Mã biến thể không hợp lệ")
    private Integer maBienThe;
    
    @NotNull(message = "Giá sau giảm không được để trống")
    @Positive(message = "Giá sau giảm phải là số dương")
    private BigDecimal giaSauGiam;
}
