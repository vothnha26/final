package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.dto.request.KhachHangCreationRequest;
import com.noithat.qlnt.backend.entity.KhachHang;
import com.noithat.qlnt.backend.entity.DonHang;
import com.noithat.qlnt.backend.service.IKhachHangService;
import com.noithat.qlnt.backend.service.IDonHangService;
import com.noithat.qlnt.backend.service.IQuanLyTrangThaiDonHangService;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import com.noithat.qlnt.backend.repository.KhachHangRepository;
import com.noithat.qlnt.backend.repository.DonHangRepository;
import java.util.List;
import java.util.Map;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/khach-hang")
@Validated
public class KhachHangController {

    private final IKhachHangService khachHangService;
    private final IDonHangService donHangService;
    private final KhachHangRepository khachHangRepository;
    private final DonHangRepository donHangRepository;
    private final IQuanLyTrangThaiDonHangService quanLyTrangThaiService;

    public KhachHangController(IKhachHangService khachHangService, IDonHangService donHangService,
            KhachHangRepository khachHangRepository, DonHangRepository donHangRepository,
            IQuanLyTrangThaiDonHangService quanLyTrangThaiService) {
        this.khachHangService = khachHangService;
        this.donHangService = donHangService;
        this.khachHangRepository = khachHangRepository;
        this.donHangRepository = donHangRepository;
        this.quanLyTrangThaiService = quanLyTrangThaiService;
    }

    // [Quyền: Admin/Nhân viên] - Danh sách khách hàng
    @GetMapping
    public ResponseEntity<List<KhachHang>> getAll() {
        return ResponseEntity.ok(khachHangService.getAll());
    }

    // [Quyền: Admin/Nhân viên] - Tạo khách hàng
    @PostMapping
    public ResponseEntity<KhachHang> create(@Valid @RequestBody KhachHangCreationRequest request) {
        return ResponseEntity.ok(khachHangService.create(request));
    }

    // [Quyền: Admin/Nhân viên] - Cập nhật khách hàng
    @PutMapping("/{maKhachHang}")
    public ResponseEntity<KhachHang> update(@PathVariable Integer maKhachHang, @Valid @RequestBody KhachHang request) {
        return ResponseEntity.ok(khachHangService.update(maKhachHang, request));
    }

    // [Quyền: Admin/Nhân viên] - Xóa khách hàng
    @DeleteMapping("/{maKhachHang}")
    public ResponseEntity<Void> delete(@PathVariable Integer maKhachHang) {
        khachHangService.delete(maKhachHang);
        return ResponseEntity.noContent().build();
    }

    // [Quyền: Khách hàng (Auth), Nhân viên/Admin]
    @GetMapping("/{maKhachHang}")
    public ResponseEntity<KhachHang> getKhachHangProfile(@PathVariable Integer maKhachHang) {
        KhachHang khachHang = khachHangService.getKhachHangProfile(maKhachHang);
        return ResponseEntity.ok(khachHang);
    }

    // [Quyền: Khách hàng (Auth)] - Lấy profile của chính mình (dựa trên
    // session/token)
    @GetMapping("/me")
    public ResponseEntity<KhachHang> getMyProfile(java.security.Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        
        String username = principal.getName();
        
        // First try to find customer by linked account username (TaiKhoan.tenDangNhap)
        try {
            java.util.Optional<KhachHang> maybe = khachHangRepository
                    .findByTaiKhoan_TenDangNhap(username);
            if (maybe != null && maybe.isPresent()) {
                return ResponseEntity.ok(maybe.get());
            }
        } catch (Exception ex) {
            // log and continue to phone fallback
            ex.printStackTrace();
        }

        // Fallback: maybe the principal is a phone number (legacy behavior)
        try {
            KhachHang byPhone = khachHangService.findBySoDienThoai(username);
            if (byPhone != null) {
                return ResponseEntity.ok(byPhone);
            }
        } catch (Exception ex) {
        }

        return ResponseEntity.status(404).build();
    }

    // [Quyền: Khách hàng (Auth)] - Cập nhật thông tin cá nhân của chính mình
    @PutMapping("/me")
    public ResponseEntity<KhachHang> updateMyProfile(
            @Valid @RequestBody KhachHang request,
            java.security.Principal principal) {
        
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        
        String username = principal.getName();
        
        // Find customer by linked account username
        try {
            java.util.Optional<KhachHang> maybe = khachHangRepository
                    .findByTaiKhoan_TenDangNhap(username);
            
            if (maybe != null && maybe.isPresent()) {
                KhachHang existingKhachHang = maybe.get();
                Integer maKhachHang = existingKhachHang.getMaKhachHang();
                
                // Update only allowed fields for customer self-update
                existingKhachHang.setHoTen(request.getHoTen());
                existingKhachHang.setEmail(request.getEmail());
                existingKhachHang.setSoDienThoai(request.getSoDienThoai());
                existingKhachHang.setDiaChi(request.getDiaChi());
                existingKhachHang.setNgaySinh(request.getNgaySinh());
                existingKhachHang.setGioiTinh(request.getGioiTinh());
                
                // Save updated customer
                KhachHang updated = khachHangService.update(maKhachHang, existingKhachHang);
                return ResponseEntity.ok(updated);
            }
        } catch (Exception ex) {
            ex.printStackTrace();
        }
        
        // Fallback: try to find by phone number (legacy)
        try {
            KhachHang byPhone = khachHangService.findBySoDienThoai(username);
            if (byPhone != null) {
                Integer maKhachHang = byPhone.getMaKhachHang();
                
                // Update only allowed fields
                byPhone.setHoTen(request.getHoTen());
                byPhone.setEmail(request.getEmail());
                byPhone.setSoDienThoai(request.getSoDienThoai());
                byPhone.setDiaChi(request.getDiaChi());
                byPhone.setNgaySinh(request.getNgaySinh());
                byPhone.setGioiTinh(request.getGioiTinh());
                
                KhachHang updated = khachHangService.update(maKhachHang, byPhone);
                return ResponseEntity.ok(updated);
            }
        } catch (Exception ex) {
        }
        
        return ResponseEntity.status(404).build();
    }

    // [Quyền: Khách hàng (Auth), Nhân viên/Admin] - Lấy danh sách đơn hàng của
    // khách hàng
    @GetMapping("/{maKhachHang}/don-hang")
    public ResponseEntity<java.util.List<com.noithat.qlnt.backend.dto.response.DonHangResponse>> getDonHangByKhachHang(
            @PathVariable Integer maKhachHang) {
        java.util.List<com.noithat.qlnt.backend.dto.response.DonHangResponse> ds = donHangService
                .getDonHangByKhachHang(maKhachHang);
        return ResponseEntity.ok(ds);
    }

    // [Quyền: Admin/Nhân viên] - Dùng để tích điểm sau khi đơn hàng hoàn tất
    @PutMapping("/{maKhachHang}/tich-diem")
    public ResponseEntity<KhachHang> tichDiem(
            @PathVariable Integer maKhachHang,
            @RequestParam(name = "diem") Integer diem) {
        if (diem == null || diem <= 0) {
            return ResponseEntity.badRequest().build();
        }
        KhachHang khachHangCapNhat = khachHangService.tichDiemVaCapNhatHang(maKhachHang, diem);
        return ResponseEntity.ok(khachHangCapNhat);
    }

    // [Quyền: Admin/Nhân viên] - Thêm điểm cho khách hàng (cho Postman test)
    @PostMapping("/add-points")
    public ResponseEntity<KhachHang> addPoints(@RequestBody java.util.Map<String, Object> request) {
        Integer maKhachHang = (Integer) request.get("maKhachHang");
        Integer diemThem = (Integer) request.get("diemThem");

        if (maKhachHang == null || diemThem == null || diemThem <= 0) {
            return ResponseEntity.badRequest().build();
        }

        KhachHang khachHangCapNhat = khachHangService.tichDiemVaCapNhatHang(maKhachHang, diemThem);
        return ResponseEntity.ok(khachHangCapNhat);
    }

    // [Quyền: Admin/Nhân viên] - Thêm điểm cho khách hàng (POST /tich-diem) -
    // supports POST with JSON body
    @PostMapping("/tich-diem")
    public ResponseEntity<KhachHang> addPointsPost(
            @RequestBody com.noithat.qlnt.backend.dto.request.TichDiemRequest request) {
        Integer maKhachHang = request.getMaKhachHang();
        // Use compatibility getter that prefers 'diem' but falls back to 'diemThem'
        Integer diemThem = request.getEffectiveDiem();

        if (maKhachHang == null || diemThem == null || diemThem <= 0) {
            return ResponseEntity.badRequest().build();
        }

        KhachHang khachHangCapNhat = khachHangService.tichDiemVaCapNhatHang(maKhachHang, diemThem);
        return ResponseEntity.ok(khachHangCapNhat);
    }

    // [Quyền: Admin/Nhân viên] - Tìm kiếm khách hàng
    @GetMapping("/search")
    public ResponseEntity<List<KhachHang>> search(@RequestParam("keyword") String keyword) {
        // Simple search by name for now
        List<KhachHang> allCustomers = khachHangService.getAll();
        List<KhachHang> result = allCustomers.stream()
                .filter(kh -> kh.getHoTen().toLowerCase().contains(keyword.toLowerCase()) ||
                        kh.getEmail().toLowerCase().contains(keyword.toLowerCase()) ||
                        kh.getSoDienThoai().contains(keyword))
                .toList();
        return ResponseEntity.ok(result);
    }

    // [Quyền: Admin/Nhân viên] - Tìm khách hàng theo số điện thoại (exact match)
    @GetMapping("/by-phone/{phone}")
    public ResponseEntity<KhachHang> getByPhone(@PathVariable("phone") String phone) {
        KhachHang kh = khachHangService.findBySoDienThoai(phone);
        if (kh == null)
            return ResponseEntity.notFound().build();
        return ResponseEntity.ok(kh);
    }

    // [Quyền: Khách hàng] - Xác nhận đã nhận hàng (DA_GIAO_HANG -> HOAN_THANH)
    @PostMapping("/{maKhachHang}/don-hang/{maDonHang}/xac-nhan-nhan-hang")
    public ResponseEntity<?> xacNhanNhanHang(
            @PathVariable Integer maKhachHang,
            @PathVariable Integer maDonHang,
            java.security.Principal principal) {
        
        if (principal == null) {
            return ResponseEntity.status(401).body("Vui lòng đăng nhập");
        }

        try {
            // Verify customer owns this order
            DonHang donHang = donHangRepository.findById(maDonHang)
                    .orElse(null);
            
            if (donHang == null) {
                return ResponseEntity.status(404).body("Không tìm thấy đơn hàng");
            }
            
            if (!donHang.getKhachHang().getMaKhachHang().equals(maKhachHang)) {
                return ResponseEntity.status(403).body("Bạn không có quyền xác nhận đơn hàng này");
            }

            // Check if transition to HOAN_THANH is allowed from current state
            if (!quanLyTrangThaiService.canChangeStatus(maDonHang, IQuanLyTrangThaiDonHangService.HOAN_THANH)) {
                return ResponseEntity.status(400).body("Trạng thái hiện tại của đơn không cho phép xác nhận hoàn thành");
            }

            // Update status to HOAN_THANH with customer confirmation
            quanLyTrangThaiService.capNhatTrangThai(
                maDonHang, 
                "HOAN_THANH", 
                "Khách hàng (ID: " + maKhachHang + ")", 
                "Khách hàng xác nhận đã nhận hàng"
            );
            
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã xác nhận nhận hàng thành công"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Lỗi: " + e.getMessage());
        }
    }
}