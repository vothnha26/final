package com.noithat.qlnt.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DonHangDichVuRequest {
    private Integer maDichVu;
    private Integer soLuong = 1; // Mặc định số lượng dịch vụ là 1
}
