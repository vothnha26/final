package com.noithat.qlnt.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.DecimalMin;
import java.math.BigDecimal;
import java.util.List;

/**
 * DTO for partial updates to BienTheSanPham via PATCH.
 * All fields are optional. Only non-null fields will be updated.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record BienThePatchRequestDto(
    @DecimalMin(value = "0.0", inclusive = true, message = "Giá mua phải lớn hơn hoặc bằng 0")
    BigDecimal giaMua,
    
    @DecimalMin(value = "0.0", inclusive = false, message = "Giá bán phải lớn hơn 0")
    BigDecimal giaBan,
    
    String trangThaiKho,
    
    List<ThuocTinhGiaTriTuDoDto> thuocTinhGiaTriTuDo,
    
    List<Integer> giaTriThuocTinhIds
) {}
