package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.dto.request.*;
import com.noithat.qlnt.backend.dto.response.*;
import com.noithat.qlnt.backend.service.AuthenticationService;
import com.noithat.qlnt.backend.repository.NhanVienRepository;
import com.noithat.qlnt.backend.entity.NhanVien;
import jakarta.mail.MessagingException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthenticationController {

    private final AuthenticationService service;
    private final NhanVienRepository nhanVienRepository;

    // Đăng ký tài khoản mới
    @PostMapping("/register")
    public ResponseEntity<String> register(
            @Valid @RequestBody RegisterRequest request) {
        try {
            service.register(request);
            return ResponseEntity.ok("Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP kích hoạt tài khoản.");
        } catch (IllegalStateException | MessagingException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Xác thực tài khoản bằng mã OTP
    @PostMapping("/verify-account")
    public ResponseEntity<String> verifyAccount(@Valid @RequestBody OtpRequest request) {
        String result = service.verifyAccount(request.getEmail(), request.getOtp());
        if (result.startsWith("Tài khoản")) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }

    // Đăng nhập và nhận JWT
    @PostMapping("/authenticate")
    public ResponseEntity<AuthenticationResponse> authenticate(
            @RequestBody AuthenticationRequest request) {
        return ResponseEntity.ok(service.authenticate(request));
    }

    // Return current authenticated account (session or token)
    @GetMapping("/me")
    public ResponseEntity<java.util.Map<String, Object>> me(java.security.Principal principal) {
        if (principal == null)
            return ResponseEntity.status(401).build();
        String username = principal.getName();
        java.util.Optional<com.noithat.qlnt.backend.entity.TaiKhoan> opt = service.findByTenDangNhap(username);
        if (opt.isEmpty())
            return ResponseEntity.status(404).build();
        com.noithat.qlnt.backend.entity.TaiKhoan t = opt.get();
        java.util.Map<String, Object> out = new java.util.HashMap<>();
        out.put("maTaiKhoan", t.getMaTaiKhoan());
        out.put("tenDangNhap", t.getTenDangNhap());
        out.put("email", t.getEmail());
        out.put("vaiTro", t.getVaiTro() != null ? t.getVaiTro().getTenVaiTro() : null);
        out.put("trangThai", t.isEnabled());
        
        // If user is staff, fetch and add staff ID
        String role = t.getVaiTro() != null ? t.getVaiTro().getTenVaiTro() : null;
        if (role != null && (role.equalsIgnoreCase("STAFF") || role.equalsIgnoreCase("ADMIN"))) {
            java.util.Optional<NhanVien> staffOpt = nhanVienRepository.findByTaiKhoan(t);
            if (staffOpt.isPresent()) {
                NhanVien nv = staffOpt.get();
                out.put("maNhanVien", nv.getMaNhanVien());
                out.put("hoTen", nv.getHoTen());
                out.put("chucVu", nv.getChucVu());
            }
        }
        
        return ResponseEntity.ok(out);
    }

    // Quên mật khẩu - gửi mã OTP đến email
    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestParam("email") String email) {
        try {
            return ResponseEntity.ok(service.forgotPassword(email));
        } catch (RuntimeException | MessagingException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // Đặt lại mật khẩu bằng mã OTP
    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        String result = service.resetPassword(request.getEmail(), request.getOtp(), request.getNewPassword());
        if (result.startsWith("Mật khẩu")) {
            return ResponseEntity.ok(result);
        } else {
            return ResponseEntity.badRequest().body(result);
        }
    }
}