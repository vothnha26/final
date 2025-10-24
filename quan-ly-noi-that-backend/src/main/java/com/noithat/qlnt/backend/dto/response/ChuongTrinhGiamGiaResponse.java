package com.noithat.qlnt.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Response chi tiết chương trình giảm giá
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChuongTrinhGiamGiaResponse {
    
    private Integer maChuongTrinhGiamGia;
    private String tenChuongTrinh;
    private String moTa;
    private LocalDateTime ngayBatDau;
    private LocalDateTime ngayKetThuc;
    /**
     * Program status as human-readable string: "đang hoạt động", "sắp diễn ra", "đã kết thúc", "tạm dừng"
     */
    private String trangThai;
    private String loaiGiamGia; // "PERCENT" hoặc "FIXED"
    private java.math.BigDecimal giaTriGiam;
    private Integer soLuongBienThe;
    
    @JsonProperty("danhSachBienThe")
    private List<BienTheGiamGiaResponse> danhSachBienThe;
    private java.math.BigDecimal tongTietKiem;
    // Group discounted variants by their parent product for UI clarity
    private java.util.List<SanPhamKhuyenMaiResponse> danhSachSanPham;
}
