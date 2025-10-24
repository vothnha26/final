package com.noithat.qlnt.backend.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class GiaoDichThanhToanResponse {
    private Integer maGiaoDich;
    private String phuongThuc;
    private BigDecimal soTien;
    private String trangThai;
    private LocalDateTime ngayThanhToan;
    
}
