package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.entity.YeuThich;
import com.noithat.qlnt.backend.repository.KhachHangRepository;
import com.noithat.qlnt.backend.service.IYeuThichService;
import com.noithat.qlnt.backend.dto.response.SanPhamWithImagesResponseDto;
import com.noithat.qlnt.backend.service.impl.ProductServiceImpl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/yeu-thich")
public class YeuThichController {

    private final IYeuThichService yeuThichService;
    private final KhachHangRepository khachHangRepository;
    private final ProductServiceImpl productService;

    public YeuThichController(IYeuThichService yeuThichService, KhachHangRepository khachHangRepository, ProductServiceImpl productService) {
        this.yeuThichService = yeuThichService;
        this.khachHangRepository = khachHangRepository;
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<?> listFavorites(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        String username = principal.getName();
        var optKh = khachHangRepository.findByTaiKhoan_TenDangNhap(username);
        if (optKh.isEmpty()) {
            // Return 404 with empty list body so generic types align for callers
            return ResponseEntity.status(404).body(java.util.Collections.<SanPhamWithImagesResponseDto>emptyList());
        }
        var k = optKh.get();
        List<YeuThich> list = yeuThichService.getFavoritesForCustomer(k.getMaKhachHang());
        List<SanPhamWithImagesResponseDto> products = list.stream()
                .map(y -> productService.getProductWithImagesById(y.getSanPham().getMaSanPham()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(products);
    }

    @PostMapping
    public ResponseEntity<?> addFavorite(@RequestBody java.util.Map<String, Integer> body, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        Integer productId = body.get("productId");
        if (productId == null) return ResponseEntity.badRequest().body("productId is required");
        String username = principal.getName();
        return khachHangRepository.findByTaiKhoan_TenDangNhap(username)
                .map(k -> {
                    YeuThich created = yeuThichService.addFavorite(k.getMaKhachHang(), productId);
                    if (created == null) return ResponseEntity.status(409).body("Already favorited");
                    return ResponseEntity.ok().body(created);
                }).orElseGet(() -> ResponseEntity.status(404).body("Khách hàng không tồn tại"));
    }

    @DeleteMapping("/{productId}")
    public ResponseEntity<?> removeFavorite(@PathVariable Integer productId, Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        String username = principal.getName();
        return khachHangRepository.findByTaiKhoan_TenDangNhap(username)
                .map(k -> {
                    yeuThichService.removeFavorite(k.getMaKhachHang(), productId);
                    return ResponseEntity.ok().build();
                }).orElseGet(() -> ResponseEntity.status(404).body("Khách hàng không tồn tại"));
    }
}
