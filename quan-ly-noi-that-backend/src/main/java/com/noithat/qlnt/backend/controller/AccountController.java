package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.entity.TaiKhoan;
import com.noithat.qlnt.backend.exception.AppException;
import com.noithat.qlnt.backend.repository.TaiKhoanRepository;
import com.noithat.qlnt.backend.repository.VaiTroRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private final TaiKhoanRepository taiKhoanRepository;
    private final VaiTroRepository vaiTroRepository;
    private final com.noithat.qlnt.backend.repository.NhanVienRepository nhanVienRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<List<Object>> list() {
        List<Object> out = taiKhoanRepository.findAll().stream().map(t -> {
            return mapToDto(t);
        }).collect(Collectors.toList());
        return ResponseEntity.ok(out);
    }

    @PostMapping
    public ResponseEntity<Object> create(@RequestBody java.util.Map<String, Object> req) {
        String tenDangNhap = (String) req.get("tenDangNhap");
        if (tenDangNhap == null || tenDangNhap.trim().isEmpty()) throw new AppException(400, "tenDangNhap is required");
        if (taiKhoanRepository.findByTenDangNhap(tenDangNhap).isPresent()) throw new AppException(400, "Username already exists");

        String email = (String) req.get("email");
        if (email != null && taiKhoanRepository.findByEmail(email).isPresent()) throw new AppException(400, "Email already exists");

        String rawPass = (String) req.getOrDefault("matKhau", req.getOrDefault("matKhauHash", "password"));
        String roleName = (String) req.getOrDefault("vaiTro", req.getOrDefault("role", "STAFF"));

        TaiKhoan tk = new TaiKhoan();
        tk.setTenDangNhap(tenDangNhap);
        tk.setEmail(email);
        tk.setMatKhauHash(passwordEncoder.encode(rawPass != null ? rawPass : "password"));
        tk.setEnabled(true);

        // Lookup role entity
        if (roleName != null) {
            var v = vaiTroRepository.findByTenVaiTro(roleName.toUpperCase()).orElse(null);
            if (v == null) {
                // fallback to USER role if not found
                v = vaiTroRepository.findByTenVaiTro("USER").orElse(null);
            }
            tk.setVaiTro(v);
        }

        TaiKhoan saved = taiKhoanRepository.save(tk);

        // If hoTen is provided and role is staff/employee, create a NhanVien record linked to this account
    Object hoTenObj = req.get("hoTen");
    String hoTen = hoTenObj != null ? String.valueOf(hoTenObj) : null;
        // Only create NhanVien for non-USER roles (e.g., STAFF, MANAGER, ADMIN)
        String roleUpper = roleName != null ? roleName.toUpperCase() : "STAFF";
        if (!"USER".equals(roleUpper) && hoTen != null && !hoTen.isBlank()) {
            com.noithat.qlnt.backend.entity.NhanVien nv = new com.noithat.qlnt.backend.entity.NhanVien();
            nv.setTaiKhoan(saved);
            nv.setHoTen(hoTen);
            nv.setChucVu((String) req.getOrDefault("chucVu", null));
            nhanVienRepository.save(nv);
        }
        return ResponseEntity.ok(mapToDto(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Object> update(@PathVariable Integer id, @RequestBody java.util.Map<String, Object> req) {
        TaiKhoan tk = taiKhoanRepository.findById(id).orElseThrow(() -> new AppException(404, "Account not found"));
        String email = (String) req.get("email");
        if (email != null) tk.setEmail(email);
        Object roleObj = req.get("vaiTro");
        if (roleObj == null) roleObj = req.get("role");
        if (roleObj != null) {
            String roleName = String.valueOf(roleObj);
            var v = vaiTroRepository.findByTenVaiTro(roleName.toUpperCase()).orElse(null);
            if (v != null) tk.setVaiTro(v);
        }
        Object trangThai = req.get("trangThai");
        if (trangThai != null) {
            boolean enabled = Boolean.TRUE.equals(trangThai) || "active".equalsIgnoreCase(String.valueOf(trangThai)) || Boolean.parseBoolean(String.valueOf(trangThai));
            tk.setEnabled(enabled);
        }
        TaiKhoan saved = taiKhoanRepository.save(tk);
        return ResponseEntity.ok(mapToDto(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        TaiKhoan tk = taiKhoanRepository.findById(id).orElseThrow(() -> new AppException(404, "Account not found"));
        taiKhoanRepository.delete(tk);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/password")
    public ResponseEntity<Void> changePassword(@PathVariable Integer id, @RequestBody java.util.Map<String, String> body) {
        TaiKhoan tk = taiKhoanRepository.findById(id).orElseThrow(() -> new AppException(404, "Account not found"));
        String newPass = body.get("matKhau");
        if (newPass == null || newPass.trim().isEmpty()) throw new AppException(400, "Password required");
        tk.setMatKhauHash(passwordEncoder.encode(newPass));
        taiKhoanRepository.save(tk);
        return ResponseEntity.ok().build();
    }

    private java.util.Map<String, Object> mapToDto(TaiKhoan t) {
        java.util.Map<String, Object> m = new java.util.HashMap<>();
        m.put("maTaiKhoan", t.getMaTaiKhoan());
        m.put("tenDangNhap", t.getTenDangNhap());
        // try to include hoTen from linked NhanVien if present
        String hoTen = null;
        try {
            var optNv = nhanVienRepository.findByTaiKhoan(t);
            if (optNv.isPresent()) hoTen = optNv.get().getHoTen();
        } catch (Exception ignored) {}
        m.put("hoTen", hoTen);
        m.put("email", t.getEmail());
        m.put("soDienThoai", null);
        m.put("vaiTro", t.getVaiTro() != null ? t.getVaiTro().getTenVaiTro() : null);
        m.put("trangThai", t.isEnabled());
        m.put("lanDangNhapCuoi", null);
        return m;
    }
}
