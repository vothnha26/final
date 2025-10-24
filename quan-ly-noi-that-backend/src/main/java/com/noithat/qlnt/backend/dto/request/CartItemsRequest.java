package com.noithat.qlnt.backend.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class CartItemsRequest {
    private List<ThanhToanRequest> chiTietDonHang; // Tận dụng lại ThanhToanRequest cho đơn giản
}