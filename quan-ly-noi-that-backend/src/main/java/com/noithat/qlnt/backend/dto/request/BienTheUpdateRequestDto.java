package com.noithat.qlnt.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record BienTheUpdateRequestDto(
    @NotBlank(message = "SKU không được để trống")
    @Size(min = 3, max = 50, message = "SKU phải có độ dài từ 3 đến 50 ký tự")
    String sku,
    
    @DecimalMin(value = "0.0", inclusive = true, message = "Giá mua phải lớn hơn hoặc bằng 0")
    BigDecimal giaMua,
    
    @NotNull(message = "Giá bán không được để trống")
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá bán phải lớn hơn 0")
    BigDecimal giaBan,
    
    @NotNull(message = "Số lượng tồn không được để trống")
    @Min(value = 0, message = "Số lượng tồn không được âm")
    Integer soLuongTon,
    
    String trangThaiKho,
    
    List<ThuocTinhGiaTriTuDoDto> thuocTinhGiaTriTuDo
) {}