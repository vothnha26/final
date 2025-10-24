package com.noithat.qlnt.backend.dto.request;

import jakarta.validation.constraints.*;
import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;
import java.util.List;

/**
 * DTO này được sử dụng khi TẠO MỚI một biến thể sản phẩm.
 * Nó yêu cầu danh sách các ID của giá trị thuộc tính để xác định biến thể.
 * 
 * Note: maSanPham là optional nếu gọi qua /api/products/{productId}/variants
 * nhưng là required nếu gọi trực tiếp qua /api/variants
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record BienTheRequestDto(
        @JsonAlias( {
                "productId", "maSanPham" }) @Positive(message = "Mã sản phẩm phải là số dương") Integer maSanPham,

        @NotBlank(message = "SKU không được để trống") @Size(min = 3, max = 50, message = "SKU phải có độ dài từ 3 đến 50 ký tự") String sku,

        @DecimalMin(value = "0.0", inclusive = true, message = "Giá mua phải lớn hơn hoặc bằng 0") BigDecimal giaMua,

        @NotNull(message = "Giá bán không được để trống") @DecimalMin(value = "0.0", inclusive = false, message = "Giá bán phải lớn hơn 0") BigDecimal giaBan,

        @Min(value = 0, message = "Số lượng tồn không được âm") Integer soLuongTon,

        // Thêm các trường quản lý kho nâng cao (optional)

        @Min(value = 0, message = "Mức tồn tối thiểu không được âm") Integer mucTonToiThieu,

        @Size(max = 20, message = "Trạng thái kho không được quá 20 ký tự") String trangThaiKho
                ,
                // Optional free-text attribute->value mappings. Server will create BienTheThuocTinh entries for these.
                List<ThuocTinhGiaTriTuDoDto> thuocTinhGiaTriTuDo

    ){
}