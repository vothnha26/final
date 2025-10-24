package com.noithat.qlnt.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.noithat.qlnt.backend.dto.common.ThuocTinhDto;
import com.noithat.qlnt.backend.entity.ThuocTinh;
import com.noithat.qlnt.backend.service.IAttributeService;
import com.noithat.qlnt.backend.repository.BienTheThuocTinhRepository;
import com.noithat.qlnt.backend.repository.ThuocTinhRepository;

@RestController
@RequestMapping("/api/attributes")
public class AttributeController {
    @Autowired
    private IAttributeService attributeService;

    @Autowired private ThuocTinhRepository thuocTinhRepository;
    @Autowired private BienTheThuocTinhRepository bienTheThuocTinhRepository;

    // ===== Thuộc tính (Attribute) =====
    @PostMapping
    public ResponseEntity<ThuocTinh> createThuocTinh(@Valid @RequestBody ThuocTinhDto dto) {
        return new ResponseEntity<>(attributeService.createThuocTinh(dto), HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<ThuocTinh>> getAllThuocTinh() {
        return ResponseEntity.ok(attributeService.getAllThuocTinh());
    }

    // Return attributes with distinct existing values from variant-attribute mappings
    @GetMapping("/distinct-values")
    public ResponseEntity<List<Map<String, Object>>> getAttributesWithDistinctValues(
            @org.springframework.web.bind.annotation.RequestParam(name = "productId", required = false) Integer productId) {
        List<ThuocTinh> attrs = thuocTinhRepository.findAll();
        List<Map<String, Object>> result = new java.util.ArrayList<>();
        for (ThuocTinh a : attrs) {
            List<com.noithat.qlnt.backend.entity.BienTheThuocTinh> mappings =
                    productId == null
                            ? bienTheThuocTinhRepository.findByThuocTinh_MaThuocTinh(a.getMaThuocTinh())
                            : bienTheThuocTinhRepository.findByThuocTinh_MaThuocTinhAndBienTheSanPham_SanPham_MaSanPham(a.getMaThuocTinh(), productId);

            java.util.Set<String> distinct = new java.util.LinkedHashSet<>();
            for (com.noithat.qlnt.backend.entity.BienTheThuocTinh m : mappings) {
                String v = m.getGiaTri();
                if (v != null && !v.isBlank()) distinct.add(v);
            }

            List<Map<String, Object>> values = new java.util.ArrayList<>();
            for (String v : distinct) {
                java.util.Map<String, Object> val = new java.util.HashMap<>();
                val.put("tenGiaTri", v);
                values.add(val);
            }

            java.util.Map<String, Object> item = new java.util.HashMap<>();
            item.put("id", a.getMaThuocTinh());
            item.put("maThuocTinh", a.getMaThuocTinh());
            item.put("tenThuocTinh", a.getTenThuocTinh());
            item.put("values", values);
            result.add(item);
        }
        return ResponseEntity.ok(result);
    }

    // ----- ENDPOINT MỚI -----
    @PutMapping("/{id}")
    public ResponseEntity<ThuocTinh> updateThuocTinh(@PathVariable Integer id, @RequestBody ThuocTinhDto dto) {
        return ResponseEntity.ok(attributeService.updateThuocTinh(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteThuocTinh(@PathVariable Integer id) {
        attributeService.deleteThuocTinh(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/values/{id}")
    public ResponseEntity<Void> deleteGiaTri(@PathVariable Integer id) {
        attributeService.deleteGiaTriThuocTinh(id);
        return ResponseEntity.noContent().build();
    }
}