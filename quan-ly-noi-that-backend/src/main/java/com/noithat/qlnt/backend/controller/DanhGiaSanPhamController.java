package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.entity.DanhGiaSanPham;
import com.noithat.qlnt.backend.entity.KhachHang;
import com.noithat.qlnt.backend.repository.KhachHangRepository;
import com.noithat.qlnt.backend.service.IDanhGiaSanPhamService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/v1/reviews")
public class DanhGiaSanPhamController {

    private final IDanhGiaSanPhamService danhGiaService;
    private final KhachHangRepository khachHangRepository;

    public DanhGiaSanPhamController(IDanhGiaSanPhamService danhGiaService, KhachHangRepository khachHangRepository) {
        this.danhGiaService = danhGiaService;
        this.khachHangRepository = khachHangRepository;
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<DanhGiaSanPham>> getByProduct(@PathVariable Integer productId) {
        return ResponseEntity.ok(danhGiaService.getByProduct(productId));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody DanhGiaSanPham payload, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Vui lòng đăng nhập");
        String username = principal.getName();
        // find KhachHang by username
        KhachHang kh = khachHangRepository.findByTaiKhoan_TenDangNhap(username)
                .orElse(null);
        if (kh == null) return ResponseEntity.status(404).body("Khách hàng không tồn tại");
        payload.setKhachHang(kh);
        try {
            // enforce one review per customer per product: if exists, update instead
            Integer productId = payload.getSanPham() != null ? payload.getSanPham().getMaSanPham() : null;
            if (productId != null) {
                var existingList = danhGiaService.getByProduct(productId);
                var existing = existingList.stream()
                        .filter(d -> d.getKhachHang() != null && d.getKhachHang().getMaKhachHang().equals(kh.getMaKhachHang()))
                        .findFirst();
                if (existing.isPresent()) {
                    // update existing review
                    DanhGiaSanPham updated = danhGiaService.update(existing.get().getMaDanhGia(), payload, kh.getMaKhachHang());
                    return ResponseEntity.ok(updated);
                }
            }

            DanhGiaSanPham created = danhGiaService.create(payload);
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Integer id, @RequestBody DanhGiaSanPham payload, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Vui lòng đăng nhập");
        String username = principal.getName();
        KhachHang kh = khachHangRepository.findByTaiKhoan_TenDangNhap(username).orElse(null);
        if (kh == null) return ResponseEntity.status(404).body("Khách hàng không tồn tại");
        try {
            DanhGiaSanPham updated = danhGiaService.update(id, payload, kh.getMaKhachHang());
            return ResponseEntity.ok(updated);
        } catch (SecurityException se) {
            return ResponseEntity.status(403).body(se.getMessage());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Integer id, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).body("Vui lòng đăng nhập");
        String username = principal.getName();
        KhachHang kh = khachHangRepository.findByTaiKhoan_TenDangNhap(username).orElse(null);
        if (kh == null) return ResponseEntity.status(404).body("Khách hàng không tồn tại");
        try {
            danhGiaService.delete(id, kh.getMaKhachHang());
            return ResponseEntity.noContent().build();
        } catch (SecurityException se) {
            return ResponseEntity.status(403).body(se.getMessage());
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }
}
