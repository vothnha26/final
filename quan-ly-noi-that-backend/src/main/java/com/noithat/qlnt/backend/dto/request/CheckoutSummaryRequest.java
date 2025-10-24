package com.noithat.qlnt.backend.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class CheckoutSummaryRequest {
    private List<ThanhToanRequest> chiTietDonHang;
    private Integer maKhachHang;
    private int diemSuDung;
    private String maVoucherCode;
    private String configKeyShip;
}