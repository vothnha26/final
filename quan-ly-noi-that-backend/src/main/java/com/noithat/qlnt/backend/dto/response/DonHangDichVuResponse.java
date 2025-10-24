package com.noithat.qlnt.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DonHangDichVuResponse {
    private String tenDichVu;
    private Integer soLuong;
    private BigDecimal chiPhi;
    private BigDecimal thanhTien; // chiPhi * soLuong
}
