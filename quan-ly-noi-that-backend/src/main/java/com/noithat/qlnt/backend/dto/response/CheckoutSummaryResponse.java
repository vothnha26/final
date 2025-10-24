package com.noithat.qlnt.backend.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class CheckoutSummaryResponse {
    @JsonProperty("TamTinh")
    private BigDecimal tamTinh;
    
    @JsonProperty("GiamGiaVip")
    private BigDecimal giamGiaVip;
    
    @JsonProperty("GiamGiaVoucher")
    private BigDecimal giamGiaVoucher;
    
    @JsonProperty("GiamGiaDiem")
    private BigDecimal giamGiaDiem;
    
    @JsonProperty("PhiGiaoHang")
    private String phiGiaoHang;
    
    @JsonProperty("TongCong")
    private BigDecimal tongCong;
    
    @JsonProperty("DiemThuongNhanDuoc")
    private BigDecimal diemThuongNhanDuoc;
    
    // Tổng tất cả các khoản giảm giá (VIP + Voucher + Điểm thưởng) - backend computed
    @JsonProperty("TongGiamGia")
    private BigDecimal tongGiamGia;

    // Thông tin cấu hình quy đổi điểm thưởng
    private Integer rewardMoneyPerPoint; // Số tiền để được 1 lần quy đổi điểm
    private Integer rewardPointPerMoney; // Số điểm nhận được mỗi lần quy đổi
    
    // Thêm các trường cho việc tạo đơn hàng (khi gọi từ tao-don-hang)
    private Integer maDonHang;
    private String maDonHangStr; // Format: DH001, DH002...
}