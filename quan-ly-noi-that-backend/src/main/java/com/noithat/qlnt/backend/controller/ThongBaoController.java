package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.dto.request.ThongBaoRequest;
import com.noithat.qlnt.backend.dto.response.ThongBaoResponse;
import com.noithat.qlnt.backend.entity.ThongBao;
import com.noithat.qlnt.backend.entity.KhachHang;
import com.noithat.qlnt.backend.entity.NhanVien;
import com.noithat.qlnt.backend.repository.KhachHangRepository;
import com.noithat.qlnt.backend.repository.NhanVienRepository;
import com.noithat.qlnt.backend.service.IThongBaoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

/**
 * Controller quản lý Thông báo cho Admin/Nhân viên
 * Base path: /api/v1/thong-bao
 */
@RestController
@RequestMapping("/api/v1/thong-bao")
@CrossOrigin
public class ThongBaoController {

    private final IThongBaoService thongBaoService;
    private final KhachHangRepository khachHangRepository;
    private final NhanVienRepository nhanVienRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public ThongBaoController(IThongBaoService thongBaoService, 
                             KhachHangRepository khachHangRepository,
                             NhanVienRepository nhanVienRepository,
                             SimpMessagingTemplate messagingTemplate) {
        this.thongBaoService = thongBaoService;
        this.khachHangRepository = khachHangRepository;
        this.nhanVienRepository = nhanVienRepository;
        this.messagingTemplate = messagingTemplate;
    }
    // ==================== WebSocket Endpoint ====================
    // Khi có thông báo mới, gửi tới khách hàng qua WebSocket
    public void sendNotificationToCustomer(Integer maKhachHang, ThongBaoResponse thongBao) {
        if (maKhachHang != null) {
            messagingTemplate.convertAndSend("/topic/thong-bao/customer/" + maKhachHang, thongBao);
        } else {
            messagingTemplate.convertAndSend("/topic/thong-bao/all", thongBao);
        }
    }


    // ==================== GET Endpoints ====================

    /**
     * GET /api/v1/thong-bao
     * Lấy tất cả thông báo (chưa bị xóa)
     * Quyền: Admin/Nhân viên
     */
    @GetMapping
    public ResponseEntity<List<ThongBaoResponse>> getAll() {
        List<ThongBaoResponse> notifications = thongBaoService.getAllWithResponse();
        return ResponseEntity.ok(notifications);
    }

    /**
     * GET /api/v1/thong-bao/all
     * Lấy tất cả thông báo (alias endpoint)
     */
    @GetMapping("/all")
    public ResponseEntity<List<ThongBaoResponse>> getAllAlias() {
        return getAll();
    }

    /**
     * GET /api/v1/thong-bao/details
     * Lấy tất cả thông báo với Response format (snake_case cho frontend)
     */
    @GetMapping("/details")
    public ResponseEntity<List<ThongBaoResponse>> getAllWithDetails() {
        List<ThongBaoResponse> notifications = thongBaoService.getAllWithResponse();
        return ResponseEntity.ok(notifications);
    }

    /**
     * GET /api/v1/thong-bao/{id}
     * Lấy thông báo theo ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ThongBaoResponse> getById(@PathVariable Integer id) {
        ThongBaoResponse notification = thongBaoService.getByIdWithResponse(id);
        return ResponseEntity.ok(notification);
    }

    /**
     * GET /api/v1/thong-bao/{id}/details
     * Lấy thông báo theo ID với Response format
     */
    @GetMapping("/{id}/details")
    public ResponseEntity<ThongBaoResponse> getByIdWithDetails(@PathVariable Integer id) {
        ThongBaoResponse notification = thongBaoService.getByIdWithResponse(id);
        return ResponseEntity.ok(notification);
    }

    /**
     * GET /api/v1/thong-bao/me
     * Lấy thông báo của người dùng đang đăng nhập (cho giao diện khách hàng)
     */
    @GetMapping("/me")
    public ResponseEntity<List<ThongBaoResponse>> getMyNotifications(Principal principal) {
        if (principal == null) {
            List<ThongBaoResponse> notifications = thongBaoService.getNotificationsForUserWithResponse(null, "ALL");
            return ResponseEntity.ok(notifications);
        }
        String username = principal.getName();
        KhachHang kh = khachHangRepository.findByTaiKhoan_TenDangNhap(username).orElse(null);
        if (kh != null) {
            List<ThongBaoResponse> notifications = thongBaoService.getNotificationsForUserWithResponse(kh.getMaKhachHang(), "CUSTOMER");
            return ResponseEntity.ok(notifications);
        }
        List<ThongBaoResponse> notifications = thongBaoService.getNotificationsForUserWithResponse(null, "ALL");
        return ResponseEntity.ok(notifications);
    }

    /**
     * GET /api/v1/thong-bao/staff/me
     * Lấy thông báo của nhân viên/admin đang đăng nhập (ALL + STAFF)
     */
    @GetMapping("/staff/me")
    public ResponseEntity<List<ThongBaoResponse>> getStaffNotifications(Principal principal) {
        try {
            if (principal == null) {
                // Không có user, chỉ lấy ALL
                List<ThongBaoResponse> notifications = thongBaoService.getNotificationsForUserWithResponse(null, "ALL");
                return ResponseEntity.ok(notifications != null ? notifications : List.of());
            }
            
            String username = principal.getName();
            NhanVien nv = nhanVienRepository.findByTaiKhoan_TenDangNhap(username).orElse(null);
            
            if (nv != null) {
                // Nhân viên: lấy thông báo STAFF + ALL
                List<ThongBaoResponse> notifications = thongBaoService.getNotificationsForUserWithResponse(nv.getMaNhanVien(), "STAFF");
                return ResponseEntity.ok(notifications != null ? notifications : List.of());
            }
            
            // Fallback: lấy ALL
            List<ThongBaoResponse> notifications = thongBaoService.getNotificationsForUserWithResponse(null, "ALL");
            return ResponseEntity.ok(notifications != null ? notifications : List.of());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(List.of());
        }
    }

    /**
     * GET /api/v1/thong-bao/chua-doc
     * Lấy thông báo chưa đọc của khách hàng
     */
    // (đã có endpoint GET /api/v1/thong-bao/chua-doc ở bên dưới)


    /**
     * DELETE /api/v1/thong-bao/{id}
     * Xóa thông báo (cho khách hàng)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteForCustomer(@PathVariable Integer id) {
        thongBaoService.delete(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * GET /api/v1/thong-bao/loai/{loai}
     * Lấy thông báo theo loại (success, warning, error, info, order, customer,
     * inventory)
     */
    @GetMapping("/loai/{loai}")
    public ResponseEntity<List<ThongBaoResponse>> getByLoai(@PathVariable String loai) {
        List<ThongBaoResponse> notifications = thongBaoService.getByLoaiWithResponse(loai);
        return ResponseEntity.ok(notifications);
    }

    /**
     * GET /api/v1/thong-bao/chua-doc
     * Lấy thông báo chưa đọc của người dùng
     */
    @GetMapping("/chua-doc")
    public ResponseEntity<List<ThongBaoResponse>> getChuaDoc(Principal principal) {
        if (principal == null) {
            List<ThongBaoResponse> notifications = thongBaoService.getChuaDocWithResponse(null, "ALL");
            return ResponseEntity.ok(notifications);
        }
        String username = principal.getName();
        KhachHang kh = khachHangRepository.findByTaiKhoan_TenDangNhap(username).orElse(null);
        if (kh != null) {
            List<ThongBaoResponse> notifications = thongBaoService.getChuaDocWithResponse(kh.getMaKhachHang(),
                    "CUSTOMER");
            return ResponseEntity.ok(notifications);
        }
        List<ThongBaoResponse> notifications = thongBaoService.getChuaDocWithResponse(null, "ALL");
        return ResponseEntity.ok(notifications);
    }

    /**
     * GET /api/v1/thong-bao/chua-doc/count
     * Đếm số thông báo chưa đọc
     */
    @GetMapping("/chua-doc/count")
    public ResponseEntity<Map<String, Long>> countChuaDoc(Principal principal) {
        long count;
        if (principal == null) {
            count = thongBaoService.countChuaDoc(null, "ALL");
            return ResponseEntity.ok(Map.of("count", count, "unread", count));
        }
        String username = principal.getName();
        KhachHang kh = khachHangRepository.findByTaiKhoan_TenDangNhap(username).orElse(null);
        if (kh != null) {
            count = thongBaoService.countChuaDoc(kh.getMaKhachHang(), "CUSTOMER");
        } else {
            count = thongBaoService.countChuaDoc(null, "ALL");
        }
        return ResponseEntity.ok(Map.of("count", count, "unread", count));
    }

    /**
     * GET /api/v1/thong-bao/staff/chua-doc/count
     * Đếm số thông báo chưa đọc của nhân viên (STAFF + ALL)
     */
    @GetMapping("/staff/chua-doc/count")
    public ResponseEntity<Map<String, Long>> countStaffChuaDoc(Principal principal) {
        long count;
        if (principal == null) {
            count = thongBaoService.countChuaDoc(null, "ALL");
            return ResponseEntity.ok(Map.of("count", count, "unread", count));
        }
        
        String username = principal.getName();
        NhanVien nv = nhanVienRepository.findByTaiKhoan_TenDangNhap(username).orElse(null);
        
        if (nv != null) {
            count = thongBaoService.countChuaDoc(nv.getMaNhanVien(), "STAFF");
        } else {
            count = thongBaoService.countChuaDoc(null, "ALL");
        }
        
        return ResponseEntity.ok(Map.of("count", count, "unread", count));
    }

    /**
     * GET /api/v1/thong-bao/uu-tien-cao
     * Lấy thông báo ưu tiên cao chưa đọc
     */
    @GetMapping("/uu-tien-cao")
    public ResponseEntity<List<ThongBaoResponse>> getHighPriorityUnread(Principal principal) {
        if (principal == null) {
            List<ThongBaoResponse> notifications = thongBaoService.getHighPriorityUnreadWithResponse(null, "ALL");
            return ResponseEntity.ok(notifications);
        }
        String username = principal.getName();
        KhachHang kh = khachHangRepository.findByTaiKhoan_TenDangNhap(username).orElse(null);
        if (kh != null) {
            List<ThongBaoResponse> notifications = thongBaoService
                    .getHighPriorityUnreadWithResponse(kh.getMaKhachHang(), "CUSTOMER");
            return ResponseEntity.ok(notifications);
        }
        List<ThongBaoResponse> notifications = thongBaoService.getHighPriorityUnreadWithResponse(null, "ALL");
        return ResponseEntity.ok(notifications);
    }

    // ==================== POST Endpoints ====================

    /**
     * POST /api/v1/thong-bao
     * Tạo thông báo mới
     * Quyền: Admin/Nhân viên
     * Khi tạo xong sẽ gửi realtime qua WebSocket cho khách hàng
     */
    @PostMapping
    public ResponseEntity<ThongBaoResponse> create(@Valid @RequestBody ThongBaoRequest request) {
        ThongBao thongBaoEntity = thongBaoService.create(request);
        ThongBaoResponse created = thongBaoService.getByIdWithResponse(thongBaoEntity.getMaThongBao());
        // Lấy mã khách hàng từ entity nếu có
        Integer maKhachHang = null;
        if (thongBaoEntity.getKhachHang() != null) {
            maKhachHang = thongBaoEntity.getKhachHang().getMaKhachHang();
        }
        if (maKhachHang != null) {
            sendNotificationToCustomer(maKhachHang, created);
        } else {
            sendNotificationToCustomer(null, created);
        }
        return ResponseEntity.ok(created);
    }

    /**
     * POST /api/v1/thong-bao/create
     * Tạo thông báo mới và trả về Response format
     */
    @PostMapping("/create")
    public ResponseEntity<ThongBaoResponse> createWithResponse(@Valid @RequestBody ThongBaoRequest request) {
        ThongBaoResponse created = thongBaoService.createWithResponse(request);
        return ResponseEntity.ok(created);
    }

    /**
     * POST /api/v1/thong-bao/tong-quat
     * Tạo thông báo tổng quát nhanh
     */
    @PostMapping("/tong-quat")
    public ResponseEntity<ThongBaoResponse> taoThongBaoTongQuat(@RequestBody Map<String, String> request) {
        String loai = request.getOrDefault("loai", "info");
        String tieuDe = request.get("tieuDe");
        String noiDung = request.get("noiDung");
        String loaiNguoiNhan = request.getOrDefault("loaiNguoiNhan", "ALL");
        String doUuTien = request.getOrDefault("doUuTien", "normal");

        if (tieuDe == null || noiDung == null) {
            return ResponseEntity.badRequest().build();
        }

        ThongBao created = thongBaoService.taoThongBaoTongQuat(loai, tieuDe, noiDung, loaiNguoiNhan, doUuTien);
        if (created == null)
            return ResponseEntity.internalServerError().build();
        ThongBaoResponse resp = thongBaoService.getByIdWithResponse(created.getMaThongBao());
        return ResponseEntity.ok(resp);
    }

    // ==================== PUT Endpoints ====================

    /**
     * PUT /api/v1/thong-bao/{id}
     * Cập nhật thông báo
     */
    @PutMapping("/{id}")
    public ResponseEntity<ThongBaoResponse> update(
            @PathVariable Integer id,
            @Valid @RequestBody ThongBaoRequest request) {
    thongBaoService.update(id, request);
    ThongBaoResponse resp = thongBaoService.getByIdWithResponse(id);
    return ResponseEntity.ok(resp);
    }

    /**
     * PUT /api/v1/thong-bao/{id}/danh-dau-da-doc
     * Đánh dấu một thông báo là đã đọc
     */
    @PutMapping("/{id}/danh-dau-da-doc")
    public ResponseEntity<Map<String, String>> danhDauDaDoc(@PathVariable Integer id) {
        try {
            thongBaoService.danhDauDaDoc(id);
            return ResponseEntity.ok(Map.of(
                    "success", "true",
                    "message", "Đã đánh dấu thông báo là đã đọc"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", "false",
                    "message", "Lỗi: " + e.getMessage()));
        }
    }

    /**
     * PUT /api/v1/thong-bao/danh-dau-tat-ca-da-doc
     * Đánh dấu tất cả thông báo của người dùng là đã đọc
     */
    @PutMapping("/danh-dau-tat-ca-da-doc")
    public ResponseEntity<Map<String, String>> danhDauTatCaDaDoc(Principal principal) {
        try {
            if (principal == null) {
                thongBaoService.danhDauTatCaDaDoc(null, "ALL");
                return ResponseEntity.ok(Map.of(
                        "success", "true",
                        "message", "Đã đánh dấu tất cả thông báo là đã đọc"));
            }
            
            String username = principal.getName();
            KhachHang kh = khachHangRepository.findByTaiKhoan_TenDangNhap(username).orElse(null);
            
            if (kh != null) {
                // Đánh dấu thông báo của khách hàng cụ thể
                thongBaoService.danhDauTatCaDaDoc(kh.getMaKhachHang(), "CUSTOMER");
                return ResponseEntity.ok(Map.of(
                        "success", "true",
                        "message", "Đã đánh dấu tất cả thông báo của bạn là đã đọc"));
            } else {
                // Nếu không tìm thấy khách hàng, đánh dấu thông báo chung
                thongBaoService.danhDauTatCaDaDoc(null, "ALL");
                return ResponseEntity.ok(Map.of(
                        "success", "true",
                        "message", "Đã đánh dấu tất cả thông báo là đã đọc"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", "false",
                    "message", "Lỗi: " + e.getMessage()));
        }
    }

    /**
     * PUT /api/v1/thong-bao/staff/danh-dau-tat-ca-da-doc
     * Đánh dấu tất cả thông báo của nhân viên là đã đọc (STAFF + ALL)
     */
    @PutMapping("/staff/danh-dau-tat-ca-da-doc")
    public ResponseEntity<Map<String, String>> danhDauTatCaDaDocStaff(Principal principal) {
        try {
            if (principal == null) {
                thongBaoService.danhDauTatCaDaDoc(null, "ALL");
                return ResponseEntity.ok(Map.of(
                        "success", "true",
                        "message", "Đã đánh dấu tất cả thông báo là đã đọc"));
            }
            
            String username = principal.getName();
            NhanVien nv = nhanVienRepository.findByTaiKhoan_TenDangNhap(username).orElse(null);
            
            if (nv != null) {
                // Đánh dấu thông báo của nhân viên cụ thể
                thongBaoService.danhDauTatCaDaDoc(nv.getMaNhanVien(), "STAFF");
                return ResponseEntity.ok(Map.of(
                        "success", "true",
                        "message", "Đã đánh dấu tất cả thông báo của bạn là đã đọc"));
            } else {
                // Nếu không tìm thấy nhân viên, đánh dấu thông báo chung
                thongBaoService.danhDauTatCaDaDoc(null, "ALL");
                return ResponseEntity.ok(Map.of(
                        "success", "true",
                        "message", "Đã đánh dấu tất cả thông báo là đã đọc"));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", "false",
                    "message", "Lỗi: " + e.getMessage()));
        }
    }

    // ==================== DELETE Endpoints ====================

    /**
     * DELETE /api/v1/thong-bao/{id}
     * Xóa thông báo (soft delete)
    // (đã có endpoint DELETE /api/v1/thong-bao/{id} ở phần DELETE Endpoints)
    }

    /**
     * DELETE /api/v1/thong-bao/{id}/vinh-vien
     * Xóa vĩnh viễn thông báo (hard delete)
     * Quyền: Chỉ Admin
     */
    @DeleteMapping("/{id}/vinh-vien")
    public ResponseEntity<Void> permanentDelete(@PathVariable Integer id) {
        thongBaoService.permanentDelete(id);
        return ResponseEntity.noContent().build();
    }

    // ==================== Maintenance Endpoints ====================

    /**
     * POST /api/v1/thong-bao/maintenance/xoa-cu
     * Xóa thông báo cũ (>30 ngày) - soft delete
     * Quyền: Admin
     */
    @PostMapping("/maintenance/xoa-cu")
    public ResponseEntity<Map<String, Object>> xoaThongBaoCu() {
        int deleted = thongBaoService.xoaThongBaoCu();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "deleted", deleted,
                "message", "Đã soft delete " + deleted + " thông báo cũ (>30 ngày)"));
    }

    /**
     * POST /api/v1/thong-bao/maintenance/xoa-vinh-vien
     * Xóa vĩnh viễn thông báo đã soft delete >90 ngày
     * Quyền: Admin
     */
    @PostMapping("/maintenance/xoa-vinh-vien")
    public ResponseEntity<Map<String, Object>> xoaVinhVienThongBaoCu() {
        int deleted = thongBaoService.xoaVinhVienThongBaoCu();
        return ResponseEntity.ok(Map.of(
                "success", true,
                "deleted", deleted,
                "message", "Đã xóa vĩnh viễn " + deleted + " thông báo (đã soft delete >90 ngày)"));
    }

    // ==================== Test/Debug Endpoints ====================

    /**
     * POST /api/v1/thong-bao/test/don-hang-moi
     * Test tạo thông báo đơn hàng mới
     */
    @PostMapping("/test/don-hang-moi")
    public ResponseEntity<Map<String, String>> testDonHangMoi(@RequestBody Map<String, Integer> request) {
        Integer maDonHang = request.get("maDonHang");
        if (maDonHang == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", "false",
                    "message", "Thiếu maDonHang"));
        }

        try {
            thongBaoService.taoThongBaoDonHangMoi(maDonHang);
            return ResponseEntity.ok(Map.of(
                    "success", "true",
                    "message", "Đã tạo thông báo đơn hàng mới"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", "false",
                    "message", "Lỗi: " + e.getMessage()));
        }
    }

    /**
     * POST /api/v1/thong-bao/test/canh-bao-ton-kho
     * Test tạo cảnh báo tồn kho
     */
    @PostMapping("/test/canh-bao-ton-kho")
    public ResponseEntity<Map<String, String>> testCanhBaoTonKho(@RequestBody Map<String, Object> request) {
        Integer maSanPham = (Integer) request.get("maSanPham");
        String tenSanPham = (String) request.get("tenSanPham");
        Integer soLuongTon = (Integer) request.get("soLuongTon");

        if (maSanPham == null || tenSanPham == null || soLuongTon == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", "false",
                    "message", "Thiếu thông tin"));
        }

        try {
            thongBaoService.taoThongBaoCanhBaoTonKho(maSanPham, tenSanPham, soLuongTon);
            return ResponseEntity.ok(Map.of(
                    "success", "true",
                    "message", "Đã tạo cảnh báo tồn kho"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", "false",
                    "message", "Lỗi: " + e.getMessage()));
        }
    }
}
