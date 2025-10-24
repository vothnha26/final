package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.dto.response.DichVuResponseDTO;
import com.noithat.qlnt.backend.service.CauHinhService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/dichvu")
@RequiredArgsConstructor
public class DichVuController {

    private final CauHinhService cauHinhService;

    @GetMapping
    public List<DichVuResponseDTO> getDichVu(@RequestParam(value = "type", required = false) String type) {
        if (type != null && "shipping".equalsIgnoreCase(type)) {
            BigDecimal standardFee = cauHinhService.getDecimal("SHIPPING_FEE_STANDARD", new BigDecimal("50000"));
            BigDecimal expressFee = cauHinhService.getDecimal("SHIPPING_FEE_EXPRESS", new BigDecimal("150000"));

            DichVuResponseDTO standard = new DichVuResponseDTO();
            standard.setMaDichVu(1);
            standard.setTenDichVu("Giao hàng tiêu chuẩn");
            standard.setMoTa("3-5 ngày làm việc");
            standard.setChiPhi(standardFee);

            DichVuResponseDTO express = new DichVuResponseDTO();
            express.setMaDichVu(2);
            express.setTenDichVu("Giao hàng nhanh");
            express.setMoTa("1-2 ngày làm việc");
            express.setChiPhi(expressFee);

            return Arrays.asList(standard, express);
        }
        return Collections.emptyList();
    }
}
