package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.dto.request.HangThanhVienRequest;
import com.noithat.qlnt.backend.dto.response.HangThanhVienResponse;
import com.noithat.qlnt.backend.service.IHangThanhVienService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/hang-thanh-vien")
@CrossOrigin(origins = "${app.cors.allowed-origins}", allowCredentials = "true")
public class HangThanhVienController {

    @Autowired
    private IHangThanhVienService hangThanhVienService;

    /**
     * Lấy tất cả hạng thành viên với phân trang
     */
    @GetMapping
    public ResponseEntity<Page<HangThanhVienResponse>> getAllHangThanhVien(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "diemToiThieu") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") ? 
                   Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<HangThanhVienResponse> hangPage = hangThanhVienService.getAllHangThanhVien(pageable);
        return ResponseEntity.ok(hangPage);
    }

    /**
     * Lấy tất cả hạng thành viên (không phân trang) - dùng cho dropdown
     */
    @GetMapping("/all")
    public ResponseEntity<List<HangThanhVienResponse>> getAllHangThanhVienList() {
        List<HangThanhVienResponse> hangList = hangThanhVienService.getAllHangThanhVien();
        return ResponseEntity.ok(hangList);
    }

    /**
     * Lấy hạng thành viên theo ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<HangThanhVienResponse> getHangThanhVienById(@PathVariable Integer id) {
        HangThanhVienResponse hang = hangThanhVienService.getHangThanhVienById(id);
        return ResponseEntity.ok(hang);
    }

    /**
     * Tạo mới hạng thành viên
     */
    @PostMapping
    public ResponseEntity<HangThanhVienResponse> createHangThanhVien(
            @Valid @RequestBody HangThanhVienRequest request) {
        
        HangThanhVienResponse newHang = hangThanhVienService.createHangThanhVien(request);
        return new ResponseEntity<>(newHang, HttpStatus.CREATED);
    }

    /**
     * Cập nhật hạng thành viên
     */
    @PutMapping("/{id}")
    public ResponseEntity<HangThanhVienResponse> updateHangThanhVien(
            @PathVariable Integer id,
            @Valid @RequestBody HangThanhVienRequest request) {
        
        HangThanhVienResponse updatedHang = hangThanhVienService.updateHangThanhVien(id, request);
        return ResponseEntity.ok(updatedHang);
    }

    /**
     * Xóa hạng thành viên
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteHangThanhVien(@PathVariable Integer id) {
        hangThanhVienService.deleteHangThanhVien(id);
        return ResponseEntity.ok(Map.of("message", "Xóa hạng thành viên thành công"));
    }

    /**
     * Cập nhật trạng thái hạng thành viên (kích hoạt/vô hiệu hóa)
     */
    @PatchMapping("/{id}/status")
    public ResponseEntity<HangThanhVienResponse> updateHangThanhVienStatus(
            @PathVariable Integer id,
            @RequestBody Map<String, Boolean> statusRequest) {
        
        Boolean trangThai = statusRequest.get("trangThai");
        if (trangThai == null) {
            return ResponseEntity.badRequest().build();
        }
        
        HangThanhVienResponse updatedHang = hangThanhVienService.updateHangThanhVienStatus(id, trangThai);
        return ResponseEntity.ok(updatedHang);
    }

    /**
     * Cập nhật hạng thành viên cho khách hàng
     */
    @PatchMapping("/cap-nhat-hang/{maKhachHang}")
    public ResponseEntity<Map<String, String>> capNhatHangThanhVien(@PathVariable Integer maKhachHang) {
        hangThanhVienService.capNhatHangThanhVien(maKhachHang);
        return ResponseEntity.ok(Map.of("message", "Cập nhật hạng thành viên thành công"));
    }

    /**
     * Lấy thống kê hạng thành viên
     */
    @GetMapping("/thong-ke")
    public ResponseEntity<Map<String, Object>> getThongKeHangThanhVien() {
        Map<String, Object> thongKe = hangThanhVienService.getThongKeHangThanhVien();
        return ResponseEntity.ok(thongKe);
    }

    /**
     * Lấy danh sách khách hàng theo hạng thành viên
     */
    @GetMapping("/{id}/khach-hang")
    public ResponseEntity<List<com.noithat.qlnt.backend.dto.common.VipKhachHangDto>> getKhachHangByHang(@PathVariable Integer id) {
        List<com.noithat.qlnt.backend.dto.common.VipKhachHangDto> khachHangs = hangThanhVienService.getKhachHangByHang(id);
        return ResponseEntity.ok(khachHangs);
    }
}