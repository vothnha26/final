package com.noithat.qlnt.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.noithat.qlnt.backend.dto.common.NhaCungCapDto;
import com.noithat.qlnt.backend.entity.NhaCungCap;
import com.noithat.qlnt.backend.service.INhaCungCapService;

@RestController
@RequestMapping("/api/suppliers")
public class NhaCungCapController {

    @Autowired
    private INhaCungCapService nhaCungCapService;

    @GetMapping
    public ResponseEntity<List<NhaCungCap>> getAll() {
        return ResponseEntity.ok(nhaCungCapService.getAllNhaCungCaps());
    }

    @PostMapping
    public ResponseEntity<NhaCungCap> create(@RequestBody NhaCungCapDto dto) {
        return new ResponseEntity<>(nhaCungCapService.createNhaCungCap(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<NhaCungCap> update(@PathVariable Integer id, @RequestBody NhaCungCapDto dto) {
        return ResponseEntity.ok(nhaCungCapService.updateNhaCungCap(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        nhaCungCapService.deleteNhaCungCap(id);
        return ResponseEntity.noContent().build();
    }
}