package com.noithat.qlnt.backend.dto.response;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class DichVuResponseDTO {
    private int maDichVu;
    private String tenDichVu;
    private String moTa;
    private BigDecimal chiPhi;
}