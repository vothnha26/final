// File: com/noithat/qlnt/backend/dto/VoucherCreationRequest.java
package com.noithat.qlnt.backend.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class VoucherCreationRequest {

    @NotBlank(message = "Mã code không được để trống.")
    @Size(max = 50, message = "Mã code không được vượt quá 50 ký tự.")
    private String maCode;

    @NotBlank(message = "Tên voucher không được để trống.")
    private String tenVoucher;

    private String moTa;

    @NotBlank(message = "Loại giảm giá không được để trống.")
    @Pattern(regexp = "PERCENTAGE|FIXED", message = "Loại giảm giá phải là 'PERCENTAGE' hoặc 'FIXED'.")
    private String loaiGiamGia;

    @NotNull(message = "Giá trị giảm không được để trống.")
    @PositiveOrZero(message = "Giá trị giảm phải là số dương.")
    private BigDecimal giaTriGiam;

    private BigDecimal giaTriDonHangToiThieu;

    private BigDecimal giaTriGiamToiDa;

    @NotNull(message = "Ngày bắt đầu không được để trống.")
    private LocalDateTime ngayBatDau;

    @NotNull(message = "Ngày kết thúc không được để trống.")
    private LocalDateTime ngayKetThuc;

    private Integer soLuongToiDa;

    private Boolean apDungChoMoiNguoi = true; // Mặc định áp dụng cho mọi người

    // Admin-controlled desired status (string): "CHUA_BAT_DAU", "DANG_HOAT_DONG", "DA_HET_HAN".
    // Optional in PATCH. Server will map to boolean active flag.
    private String trangThai;

    // Danh sách MaHangThanhVien được áp dụng (Chỉ dùng nếu apDungChoMoiNguoi =
    // false)
    private List<Integer> maHangThanhVienIds;
}