package com.noithat.qlnt.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductCompareResponse {
    private Integer productId;
    private String productName;
    private Integer totalNhap;
    private Integer totalXuat;
}
