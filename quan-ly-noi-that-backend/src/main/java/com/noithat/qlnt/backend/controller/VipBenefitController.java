package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.dto.common.VipBenefitDto;
import com.noithat.qlnt.backend.service.IVipBenefitService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vip/benefits")
@RequiredArgsConstructor
public class VipBenefitController {

    private final IVipBenefitService vipBenefitService;

    @GetMapping("/level/{maHang}")
    public ResponseEntity<List<VipBenefitDto>> getByLevel(@PathVariable Integer maHang) {
        return ResponseEntity.ok(vipBenefitService.findByHangThanhVien(maHang));
    }

    @GetMapping
    public ResponseEntity<List<VipBenefitDto>> getAll() {
        return ResponseEntity.ok(vipBenefitService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<VipBenefitDto> getById(@PathVariable Integer id) {
        VipBenefitDto dto = vipBenefitService.findById(id);
        if (dto == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(dto);
    }

    @PostMapping
    public ResponseEntity<VipBenefitDto> create(@RequestBody VipBenefitDto dto) {
        return ResponseEntity.ok(vipBenefitService.save(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VipBenefitDto> update(@PathVariable Integer id, @RequestBody VipBenefitDto dto) {
        dto.setMaVipBenefit(id);
        VipBenefitDto updated = vipBenefitService.save(dto);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        vipBenefitService.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
