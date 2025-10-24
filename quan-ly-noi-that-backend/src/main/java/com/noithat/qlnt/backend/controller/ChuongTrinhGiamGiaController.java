package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.dto.request.ChuongTrinhGiamGiaRequest;
import com.noithat.qlnt.backend.dto.request.ChuongTrinhGiamGiaDetailRequest;
import com.noithat.qlnt.backend.dto.response.ChuongTrinhGiamGiaResponse;
import com.noithat.qlnt.backend.entity.ChuongTrinhGiamGia;
import com.noithat.qlnt.backend.service.IChuongTrinhGiamGiaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.List;
import java.util.HashMap;
import java.util.Map;

/**
 * Controller quản lý Chương trình Giảm giá trực tiếp trên Biến thể Sản phẩm
 */
@RestController
@RequestMapping("/api/chuongtrinh-giamgia")
public class ChuongTrinhGiamGiaController {

    private final IChuongTrinhGiamGiaService service;

    public ChuongTrinhGiamGiaController(IChuongTrinhGiamGiaService service) {
        this.service = service;
    }

    /**
     * Lấy danh sách tất cả chương trình giảm giá (cơ bản)
     * Trả về DTO tóm tắt để tránh serialize toàn bộ entity graph (gây nesting sâu).
     */
    @GetMapping
    public ResponseEntity<List<ChuongTrinhGiamGiaResponse>> getAll(
            @RequestParam(value = "details", required = false, defaultValue = "false") boolean includeDetails) {
        if (includeDetails) {
            return ResponseEntity.ok(service.getAllWithDetails());
        }
        return ResponseEntity.ok(service.getAllSummaries());
    }

    /**
     * Lấy danh sách tất cả chương trình giảm giá (chi tiết)
     */
    @GetMapping("/details")
    public ResponseEntity<List<ChuongTrinhGiamGiaResponse>> getAllWithDetails() {
        return ResponseEntity.ok(service.getAllWithDetails());
    }

    /**
     * Lấy thông tin chương trình giảm giá (chi tiết gồm danh sách biến thể)
     * Trả về `ChuongTrinhGiamGiaResponse` để phù hợp với Postman tests
     */
    @GetMapping("/{id}")
    public ResponseEntity<ChuongTrinhGiamGiaResponse> getById(@PathVariable String id) {
        if (id == null || "null".equals(id) || id.trim().isEmpty()) {
            throw new IllegalArgumentException("ID chương trình giảm giá không được để trống hoặc không hợp lệ");
        }

        Integer idInteger;
        try {
            idInteger = Integer.parseInt(id);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("ID chương trình giảm giá phải là số nguyên hợp lệ");
        }

        return ResponseEntity.ok(service.getDetailById(idInteger));
    }

    /**
     * Lấy thông tin chi tiết chương trình giảm giá kèm danh sách biến thể
     */
    @GetMapping("/{id}/details")
    public ResponseEntity<ChuongTrinhGiamGiaResponse> getDetailById(@PathVariable String id) {
        if (id == null || "null".equals(id) || id.trim().isEmpty()) {
            throw new IllegalArgumentException("ID chương trình giảm giá không được để trống hoặc không hợp lệ");
        }

        Integer idInteger;
        try {
            idInteger = Integer.parseInt(id);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("ID chương trình giảm giá phải là số nguyên hợp lệ");
        }

        return ResponseEntity.ok(service.getDetailById(idInteger));
    }

    /**
     * Tạo chương trình giảm giá đơn giản (không kèm biến thể)
     */
    @PostMapping
    public ResponseEntity<ChuongTrinhGiamGia> create(@Valid @RequestBody ChuongTrinhGiamGiaRequest request) {
        return ResponseEntity.ok(service.create(request));
    }

    /**
     * Tạo chương trình giảm giá kèm danh sách biến thể
     */
    @PostMapping("/with-details")
    public ResponseEntity<ChuongTrinhGiamGiaResponse> createWithDetails(
            @Valid @RequestBody ChuongTrinhGiamGiaDetailRequest request) {
        return ResponseEntity.ok(service.createWithDetails(request));
    }

    /**
     * Cập nhật chương trình giảm giá đơn giản
     */
    @PutMapping("/{id}")
    public ResponseEntity<ChuongTrinhGiamGia> update(@PathVariable Integer id,
            @Valid @RequestBody ChuongTrinhGiamGiaRequest request) {
        return ResponseEntity
                .ok(service.update(id, request.getTenChuongTrinh(), request.getNgayBatDau(), request.getNgayKetThuc()));
    }

    /**
     * Cập nhật chương trình giảm giá kèm danh sách biến thể
     */
    @PutMapping("/{id}/with-details")
    public ResponseEntity<ChuongTrinhGiamGiaResponse> updateWithDetails(
            @PathVariable Integer id,
            @Valid @RequestBody ChuongTrinhGiamGiaDetailRequest request) {
        return ResponseEntity.ok(service.updateWithDetails(id, request));
    }

    /**
     * Cập nhật trạng thái chương trình giảm giá
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateStatus(
            @PathVariable Integer id,
            @RequestBody Map<String, String> request) {
        String newStatus = request.get("trangThai");
        if (newStatus == null || newStatus.trim().isEmpty()) {
            throw new IllegalArgumentException("Trạng thái không được để trống");
        }
        
        service.updateStatus(id, newStatus);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Cập nhật trạng thái thành công");
        return ResponseEntity.ok(response);
    }

    /**
     * Xóa chương trình giảm giá
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    // Simple exception handlers to return clearer JSON error messages during development
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleBadRequest(IllegalArgumentException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", "IllegalArgumentException");
        body.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleServerError(Exception ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("error", ex.getClass().getSimpleName());
        body.put("message", ex.getMessage());
        // include cause message if available (helpful in local dev)
        if (ex.getCause() != null) body.put("cause", ex.getCause().toString());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }

    // ========== Quản lý giá sau giảm cho từng biến thể ==========
    // Product-level discount endpoints đã bị xóa vì hệ thống chuyển sang
    // variant-level (BienTheGiamGia)
    // Sử dụng endpoints /with-details để quản lý discount áp dụng cho biến thể
}
