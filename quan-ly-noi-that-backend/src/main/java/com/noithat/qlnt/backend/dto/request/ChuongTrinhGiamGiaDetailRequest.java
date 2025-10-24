package com.noithat.qlnt.backend.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Request để tạo hoặc cập nhật chương trình giảm giá kèm danh sách sản phẩm áp
 * dụng
 */
@Data
public class ChuongTrinhGiamGiaDetailRequest {

    @NotBlank(message = "Tên chương trình không được để trống")
    private String tenChuongTrinh;

    private String moTa;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    private LocalDateTime ngayBatDau;

    @NotNull(message = "Ngày kết thúc không được để trống")
    private LocalDateTime ngayKetThuc;

    /**
     * Program status string. Expected values: "đang hoạt động", "sắp diễn ra", "đã
     * kết thúc", "tạm dừng"
     */
    private String trangThai = "đang hoạt động";

    @NotBlank(message = "Loại giảm giá không được để trống")
    private String loaiGiamGia; // "PERCENT" hoặc "FIXED"

    @NotNull(message = "Giá trị giảm không được để trống")
    private java.math.BigDecimal giaTriGiam;

    /**
     * Danh sách biến thể sản phẩm áp dụng giảm giá
     */
    @Valid
    private List<BienTheGiamGiaRequest> danhSachBienThe;
}
