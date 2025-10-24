package com.noithat.qlnt.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VipBenefitResponse {
    
    // Thông tin hạng VIP
    private String tenHangVip;
    private String levelCode; // bronze, silver, gold, platinum, diamond
    private String mauSac;
    private String icon;
    
    // Ưu đãi đã áp dụng
    private BigDecimal giamGiaVip;
    private Integer diemVipThuong;
    private boolean mienPhiVanChuyen;
    private boolean uuTienGiaoHang;
    
    // Danh sách ưu đãi
    private List<String> danhSachUuDai;
    
    // Thống kê tiết kiệm
    private BigDecimal tongTietKiem; // Tổng số tiền tiết kiệm từ VIP
    private String moTaTietKiem; // Mô tả những gì đã tiết kiệm
}