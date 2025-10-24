package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.dto.request.BienTheRequestDto;
import com.noithat.qlnt.backend.dto.request.BienTheUpdateRequestDto;
import com.noithat.qlnt.backend.dto.request.BienThePatchRequestDto;
import com.noithat.qlnt.backend.entity.BienTheSanPham;
import com.noithat.qlnt.backend.service.IBienTheSanPhamService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bien-the-san-pham")
public class BienTheSanPhamController {

    private final IBienTheSanPhamService bienTheSanPhamService;

    public BienTheSanPhamController(IBienTheSanPhamService bienTheSanPhamService) {
        this.bienTheSanPhamService = bienTheSanPhamService;
    }

    @GetMapping
    public ResponseEntity<List<BienTheSanPham>> getAll() {
        return ResponseEntity.ok(bienTheSanPhamService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<BienTheSanPham> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(bienTheSanPhamService.getById(id));
    }

    @GetMapping("/san-pham/{maSanPham}")
    public ResponseEntity<List<com.noithat.qlnt.backend.dto.response.BienTheSanPhamListItemResponse>> getBySanPhamId(@PathVariable Integer maSanPham) {
        List<com.noithat.qlnt.backend.entity.BienTheSanPham> list = bienTheSanPhamService.getBySanPhamId(maSanPham);
        List<com.noithat.qlnt.backend.dto.response.BienTheSanPhamListItemResponse> resp = list.stream().map(bt -> {
            // map simple fields
            List<Integer> ids = bt.getBienTheThuocTinhs() == null ? java.util.Collections.emptyList() : bt.getBienTheThuocTinhs().stream().map(btt -> btt.getId()).toList();
            List<com.noithat.qlnt.backend.dto.request.ThuocTinhGiaTriTuDoDto> mappings = bt.getBienTheThuocTinhs() == null ? java.util.Collections.emptyList() : bt.getBienTheThuocTinhs().stream().map(btt -> new com.noithat.qlnt.backend.dto.request.ThuocTinhGiaTriTuDoDto(btt.getThuocTinh().getMaThuocTinh(), btt.getGiaTri())).toList();
            return new com.noithat.qlnt.backend.dto.response.BienTheSanPhamListItemResponse(
                    bt.getMaBienThe(), bt.getSku(), null, bt.getGiaMua(), bt.getGiaBan(), bt.getSoLuongTon(), ids, mappings
            );
        }).toList();
        return ResponseEntity.ok(resp);
    }

    @PostMapping
    public ResponseEntity<BienTheSanPham> create(@RequestBody BienTheSanPham bienThe) {
        return ResponseEntity.ok(bienTheSanPhamService.create(bienThe));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BienTheSanPham> update(@PathVariable Integer id, @RequestBody BienTheSanPham bienThe) {
        return ResponseEntity.ok(bienTheSanPhamService.update(id, bienThe));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        bienTheSanPhamService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}")
    public ResponseEntity<BienTheSanPham> patchBienTheSanPham(
            @PathVariable Integer id,
            @Valid @RequestBody BienThePatchRequestDto request) {

        BienTheSanPham updatedBienThe = ((com.noithat.qlnt.backend.service.impl.BienTheSanPhamServiceImpl) bienTheSanPhamService)
                .patchBienTheSanPham(id, request);
        return ResponseEntity.ok(updatedBienThe);
    }

    // Extended endpoints used by frontends (implementation lives in the service
    // impl)
    @PostMapping("/san-pham/{maSanPham}")
    public ResponseEntity<BienTheSanPham> createBienTheSanPham(
            @PathVariable Integer maSanPham,
            @Valid @RequestBody BienTheRequestDto request) {

        BienTheSanPham newBienThe = ((com.noithat.qlnt.backend.service.impl.BienTheSanPhamServiceImpl) bienTheSanPhamService)
                .createBienTheSanPham(maSanPham, request);
        return new ResponseEntity<>(newBienThe, HttpStatus.CREATED);
    }

    @PostMapping("/create")
    public ResponseEntity<BienTheSanPham> createBienTheSanPhamNoPath(@Valid @RequestBody BienTheRequestDto request) {
        Integer maSanPham = request.maSanPham();
        BienTheSanPham newBienThe = ((com.noithat.qlnt.backend.service.impl.BienTheSanPhamServiceImpl) bienTheSanPhamService)
                .createBienTheSanPham(maSanPham, request);
        return new ResponseEntity<>(newBienThe, HttpStatus.CREATED);
    }

    @GetMapping("/product/{productId}")
    public ResponseEntity<List<BienTheSanPham>> getBienTheByProductAlias(@PathVariable Integer productId) {
        List<BienTheSanPham> bienTheList = ((com.noithat.qlnt.backend.service.impl.BienTheSanPhamServiceImpl) bienTheSanPhamService)
                .getBienTheBySanPhamId(productId);
        return ResponseEntity.ok(bienTheList);
    }

    @PutMapping("/{id}/variant")
    public ResponseEntity<BienTheSanPham> updateBienTheSanPham(
            @PathVariable Integer id,
            @Valid @RequestBody BienTheUpdateRequestDto request) {

        BienTheSanPham updatedBienThe = ((com.noithat.qlnt.backend.service.impl.BienTheSanPhamServiceImpl) bienTheSanPhamService)
                .updateBienTheSanPham(id, request);
        return ResponseEntity.ok(updatedBienThe);
    }

    @DeleteMapping("/{id}/variant")
    public ResponseEntity<Void> deleteBienTheSanPham(@PathVariable Integer id) {
        ((com.noithat.qlnt.backend.service.impl.BienTheSanPhamServiceImpl) bienTheSanPhamService)
                .deleteBienTheSanPham(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/so-luong-ton")
    public ResponseEntity<BienTheSanPham> updateSoLuongTon(
            @PathVariable Integer id,
            @RequestParam Integer soLuong) {

        BienTheSanPham updatedBienThe = ((com.noithat.qlnt.backend.service.impl.BienTheSanPhamServiceImpl) bienTheSanPhamService)
                .updateSoLuongTon(id, soLuong);
        return ResponseEntity.ok(updatedBienThe);
    }

    @GetMapping("/{id}/kiem-tra-ton-kho")
    public ResponseEntity<Boolean> checkTonKho(
            @PathVariable Integer id,
            @RequestParam Integer soLuong) {

        boolean coTonKho = ((com.noithat.qlnt.backend.service.impl.BienTheSanPhamServiceImpl) bienTheSanPhamService)
                .checkTonKho(id, soLuong);
        return ResponseEntity.ok(coTonKho);
    }

    @GetMapping("/sku/{sku}")
    public ResponseEntity<BienTheSanPham> getBienTheBySku(@PathVariable String sku) {
        BienTheSanPham bienThe = ((com.noithat.qlnt.backend.service.impl.BienTheSanPhamServiceImpl) bienTheSanPhamService)
                .findBySku(sku);
        return ResponseEntity.ok(bienThe);
    }

    @GetMapping("/{id}/chi-tiet")
    public ResponseEntity<com.noithat.qlnt.backend.dto.response.BienTheSanPhamDetailResponse> getBienTheSanPhamDetail(
            @PathVariable Integer id) {
        com.noithat.qlnt.backend.dto.response.BienTheSanPhamDetailResponse detail = ((com.noithat.qlnt.backend.service.impl.BienTheSanPhamServiceImpl) bienTheSanPhamService)
                .getBienTheSanPhamDetail(id);
        return ResponseEntity.ok(detail);
    }

    /**
     * Delete a single BienTheThuocTinh mapping by its id.
     * Frontend can call this when the admin removes an attribute from a variant.
     */
    @DeleteMapping("/thuoc-tinh/{id}")
    public ResponseEntity<Void> deleteBienTheThuocTinhMapping(@PathVariable Integer id) {
        ((com.noithat.qlnt.backend.service.impl.BienTheSanPhamServiceImpl) bienTheSanPhamService)
                .deleteBienTheThuocTinhById(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Add a single attribute mapping to a variant.
     * POST /api/bien-the-san-pham/{variantId}/thuoc-tinh
     * Body: { "maThuocTinh": 1, "giaTri": "Đỏ" }
     */
    @PostMapping("/{variantId}/thuoc-tinh")
    public ResponseEntity<com.noithat.qlnt.backend.entity.BienTheThuocTinh> addAttributeToVariant(
            @PathVariable Integer variantId,
            @Valid @RequestBody com.noithat.qlnt.backend.dto.request.ThuocTinhGiaTriTuDoDto request) {
        
        com.noithat.qlnt.backend.entity.BienTheThuocTinh created = ((com.noithat.qlnt.backend.service.impl.BienTheSanPhamServiceImpl) bienTheSanPhamService)
                .addAttributeToVariant(variantId, request);
        return new ResponseEntity<>(created, HttpStatus.CREATED);
    }

    /**
     * Update a single attribute mapping's value.
     * PUT /api/bien-the-san-pham/thuoc-tinh/{mappingId}
     * Body: { "giaTri": "Xanh" }
     */
    @PutMapping("/thuoc-tinh/{mappingId}")
    public ResponseEntity<com.noithat.qlnt.backend.entity.BienTheThuocTinh> updateAttributeValue(
            @PathVariable Integer mappingId,
            @RequestBody java.util.Map<String, String> body) {
        
        String newValue = body.get("giaTri");
        if (newValue == null || newValue.trim().isEmpty()) {
            throw new IllegalArgumentException("Giá trị thuộc tính không được để trống");
        }
        
        com.noithat.qlnt.backend.entity.BienTheThuocTinh updated = ((com.noithat.qlnt.backend.service.impl.BienTheSanPhamServiceImpl) bienTheSanPhamService)
                .updateAttributeValue(mappingId, newValue);
        return ResponseEntity.ok(updated);
    }
}