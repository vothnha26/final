package com.noithat.qlnt.backend.dto.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class CartDetailItemResponse {
    private int maBienThe;
    private String tenSanPham;
    private int soLuong;
    private BigDecimal giaGoc;
    private BigDecimal giaHienThi;
    private BigDecimal thanhTien;
    private String hinhAnhDaiDien;
}