package com.noithat.qlnt.backend.dto.response;

import java.math.BigDecimal;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import java.util.List;

@Getter @Setter @AllArgsConstructor
public class GioHangResponse {
    private List<Item> items;
    private BigDecimal tongTien;
    @Getter @Setter @AllArgsConstructor
    public static class Item {
        private String tenSanPham;
        private String sku;
        private BigDecimal donGia;
        private Integer soLuong;
        private BigDecimal thanhTien;
    }
}
