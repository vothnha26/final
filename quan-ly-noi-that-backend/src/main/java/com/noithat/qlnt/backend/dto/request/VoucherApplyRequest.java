package com.noithat.qlnt.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class VoucherApplyRequest {
    @NotBlank(message = "Mã Voucher không được để trống")
    private String maCode;

    @NotNull(message = "Mã Khách hàng không được để trống")
    @Positive(message = "Mã Khách hàng không hợp lệ")
    private Integer maKhachHang;

    @NotEmpty(message = "Danh sách sản phẩm không được để trống")
    private List<Item> items;

    /**
     * Backwards-compatible optional field. Some clients still send tongTienDonHang.
     * Server prefers explicit items list but will fall back to this value if provided.
     */
    @JsonProperty("tongTienDonHang")
    private BigDecimal tongTienDonHang;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Item {
        @NotNull(message = "Mã biến thể không được để trống")
        @Positive(message = "Mã biến thể không hợp lệ")
        @JsonProperty("maBienThe")
        private Integer bienTheId;

        @NotNull(message = "Số lượng không được để trống")
        @Positive(message = "Số lượng phải là số dương")
        @JsonProperty("soLuong")
        private Integer quantity;
        
        // Optional field - client có thể gửi nhưng server sẽ tính lại từ database
        private java.math.BigDecimal donGia;
    }
}