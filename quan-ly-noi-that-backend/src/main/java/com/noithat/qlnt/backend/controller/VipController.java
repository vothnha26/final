package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.dto.common.HangThanhVienDto;
import com.noithat.qlnt.backend.dto.common.VipKhachHangDto;
import com.noithat.qlnt.backend.dto.response.VipBenefitResponse;
import com.noithat.qlnt.backend.service.IHangThanhVienService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/vip")
@CrossOrigin(origins = "${app.cors.allowed-origins}", allowCredentials = "true")
public class VipController {

    @Autowired
    private IHangThanhVienService hangThanhVienService;

    @GetMapping("/levels")
    public ResponseEntity<List<HangThanhVienDto>> getAllVipLevels() {
        List<HangThanhVienDto> vipLevels = hangThanhVienService.getAllVipLevels();
        return ResponseEntity.ok(vipLevels);
    }

    @PostMapping("/levels")
    public ResponseEntity<HangThanhVienDto> saveVipLevel(@Valid @RequestBody HangThanhVienDto dto) {
        HangThanhVienDto savedLevel = hangThanhVienService.saveVipLevel(dto);
        return ResponseEntity.ok(savedLevel);
    }

    @PutMapping("/levels/{id}")
    public ResponseEntity<HangThanhVienDto> updateVipLevel(@PathVariable Integer id, @Valid @RequestBody HangThanhVienDto dto) {
        dto.setMaHangThanhVien(id);
        HangThanhVienDto updatedLevel = hangThanhVienService.saveVipLevel(dto);
        return ResponseEntity.ok(updatedLevel);
    }

    @DeleteMapping("/levels/{id}")
    public ResponseEntity<Void> deleteVipLevel(@PathVariable Integer id) {
        hangThanhVienService.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/levels/{id}")
    public ResponseEntity<HangThanhVienDto> getVipLevelById(@PathVariable Integer id) {
        HangThanhVienDto vipLevel = hangThanhVienService.getVipLevelById(id);
        return ResponseEntity.ok(vipLevel);
    }

    @GetMapping("/customers")
    public ResponseEntity<List<VipKhachHangDto>> getVipCustomers(
            @RequestParam(required = false) String level,
            @RequestParam(required = false) String search) {
        List<VipKhachHangDto> customers = hangThanhVienService.getVipCustomers(level, search);
        return ResponseEntity.ok(customers);
    }

    @GetMapping("/benefits/preview/{customerId}")
    public ResponseEntity<VipBenefitResponse> previewVipBenefits(
            @PathVariable Integer customerId,
            @RequestParam BigDecimal orderAmount) {
        VipBenefitResponse benefits = hangThanhVienService.previewVipBenefits(customerId, orderAmount);
        return ResponseEntity.ok(benefits);
    }
}
