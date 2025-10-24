package com.noithat.qlnt.backend.service;

import com.noithat.qlnt.backend.dto.request.AuthenticationRequest;
import com.noithat.qlnt.backend.dto.response.AuthenticationResponse;
import com.noithat.qlnt.backend.dto.request.RegisterRequest;
import com.noithat.qlnt.backend.entity.HangThanhVien;
import com.noithat.qlnt.backend.entity.KhachHang;
import com.noithat.qlnt.backend.entity.TaiKhoan;
import com.noithat.qlnt.backend.entity.VaiTro;
import com.noithat.qlnt.backend.repository.HangThanhVienRepository;
import com.noithat.qlnt.backend.repository.KhachHangRepository;
import com.noithat.qlnt.backend.repository.TaiKhoanRepository;
import com.noithat.qlnt.backend.repository.VaiTroRepository;
import jakarta.mail.MessagingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.MailException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthenticationService {

    private static final Logger logger = LoggerFactory.getLogger(AuthenticationService.class);

    private final TaiKhoanRepository taiKhoanRepository;
    private final KhachHangRepository khachHangRepository;
    private final VaiTroRepository vaiTroRepository;
    private final HangThanhVienRepository hangThanhVienRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    public AuthenticationService(TaiKhoanRepository taiKhoanRepository,
            KhachHangRepository khachHangRepository,
            VaiTroRepository vaiTroRepository,
            HangThanhVienRepository hangThanhVienRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            AuthenticationManager authenticationManager,
            EmailService emailService) {
        this.taiKhoanRepository = taiKhoanRepository;
        this.khachHangRepository = khachHangRepository;
        this.vaiTroRepository = vaiTroRepository;
        this.hangThanhVienRepository = hangThanhVienRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.emailService = emailService;
    }

    @Transactional
    public void register(RegisterRequest request) throws MessagingException {
        try {
            if (taiKhoanRepository.findByTenDangNhap(request.getTenDangNhap()).isPresent()) {
                throw new IllegalStateException("Tên đăng nhập đã tồn tại.");
            }
            if (taiKhoanRepository.findByEmail(request.getEmail()).isPresent()) {
                throw new IllegalStateException("Email đã tồn tại.");
            }

            // Determine role: prefer requested role if provided, otherwise default to USER
            String requestedRole = request.getVaiTro();
            VaiTro roleEntity = null;
            if (requestedRole != null && !requestedRole.isBlank()) {
                roleEntity = vaiTroRepository.findByTenVaiTro(requestedRole.toUpperCase()).orElse(null);
            }
            if (roleEntity == null) {
                roleEntity = vaiTroRepository.findByTenVaiTro("USER")
                        .orElseThrow(() -> new IllegalStateException("Vai trò USER không tồn tại."));
            }

            TaiKhoan taiKhoan = new TaiKhoan();
            taiKhoan.setTenDangNhap(request.getTenDangNhap());
            taiKhoan.setEmail(request.getEmail());
            taiKhoan.setMatKhauHash(passwordEncoder.encode(request.getPassword()));
            taiKhoan.setVaiTro(roleEntity);

            boolean isUserRole = "USER".equalsIgnoreCase(roleEntity.getTenVaiTro());
            if (isUserRole) {
                taiKhoan.setEnabled(false); // Chưa kích hoạt - requires OTP
                String otp = generateOtp();
                taiKhoan.setOtp(otp);
                taiKhoan.setOtpGeneratedTime(LocalDateTime.now());
                taiKhoanRepository.save(taiKhoan);

                // Check for existing guest customer by email or phone
                KhachHang existingGuest = null;
                if (request.getEmail() != null && !request.getEmail().isBlank()) {
                    existingGuest = khachHangRepository.findByEmail(request.getEmail()).orElse(null);
                }
                if (existingGuest == null && request.getSoDienThoai() != null && !request.getSoDienThoai().isBlank()) {
                    existingGuest = khachHangRepository.findBySoDienThoai(request.getSoDienThoai()).orElse(null);
                }

                if (existingGuest != null && existingGuest.getTaiKhoan() == null) {
                    // Link new account to existing guest customer
                    existingGuest.setTaiKhoan(taiKhoan);
                    // Set other fields to default
                    existingGuest.setHoTen(request.getHoTen());
                    existingGuest.setEmail(request.getEmail());
                    existingGuest.setSoDienThoai(request.getSoDienThoai());
                    HangThanhVien defaultTier = hangThanhVienRepository.findByTenHang("Ð?ng")
                            .orElseThrow(() -> new IllegalStateException("Hạng thành viên mặc định không tồn tại."));
                    existingGuest.setHangThanhVien(defaultTier);
                    existingGuest.setDiemThuong(0);
                    existingGuest.setTongChiTieu(java.math.BigDecimal.ZERO);
                    existingGuest.setTongDonHang(0);
                    existingGuest.setNgayThamGia(java.time.LocalDate.now());
                    khachHangRepository.save(existingGuest);
                } else {
                    // Create new customer as before
                    KhachHang khachHang = new KhachHang();
                    khachHang.setTaiKhoan(taiKhoan);
                    khachHang.setHoTen(request.getHoTen());
                    khachHang.setEmail(request.getEmail());
                    khachHang.setSoDienThoai(request.getSoDienThoai());
                    HangThanhVien defaultTier = hangThanhVienRepository.findByTenHang("Ð?ng")
                            .orElseThrow(() -> new IllegalStateException("Hạng thành viên mặc định không tồn tại."));
                    khachHang.setHangThanhVien(defaultTier);
                    khachHang.setDiemThuong(0);
                    khachHang.setTongChiTieu(java.math.BigDecimal.ZERO);
                    khachHang.setTongDonHang(0);
                    khachHang.setNgayThamGia(java.time.LocalDate.now());
                    khachHangRepository.save(khachHang);
                }

                try {
                    emailService.sendOtpEmail(request.getEmail(), taiKhoan.getOtp());
                } catch (org.springframework.mail.MailException | MessagingException e) {
                    // Do not expose internal mail errors to client; return a controlled error
                    throw new IllegalStateException("Không thể gửi email xác thực. Vui lòng thử lại sau.");
                }
            } else {
                // For staff/employee or other roles, enable account immediately and do not send OTP
                taiKhoan.setEnabled(true);
                taiKhoanRepository.save(taiKhoan);
                // If admin/staff created via register request provided hoTen, create NhanVien
                try {
                    if (request.getHoTen() != null && !request.getHoTen().isBlank()) {
                        com.noithat.qlnt.backend.entity.NhanVien nv = new com.noithat.qlnt.backend.entity.NhanVien();
                        nv.setTaiKhoan(taiKhoan);
                        nv.setHoTen(request.getHoTen());
                        nv.setChucVu(null);
                        // Persist NhanVien using repository
                        try {
                            var repo = org.springframework.web.context.ContextLoader.getCurrentWebApplicationContext()
                                    .getBean(com.noithat.qlnt.backend.repository.NhanVienRepository.class);
                            repo.save(nv);
                        } catch (Exception ex) {
                        }
                    }
                } catch (Exception ignored) {
                }
            }
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            logger.error("Unexpected error during registration for {}: {}", request.getTenDangNhap(), e.getMessage(),
                    e);
            throw new IllegalStateException("Đăng ký thất bại do lỗi hệ thống. Vui lòng thử lại sau.");
        }
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getTenDangNhap(),
                        request.getPassword()));
        var user = taiKhoanRepository.findByTenDangNhap(request.getTenDangNhap())
                .orElseThrow();
        java.util.Map<String, Object> extraClaims = new java.util.HashMap<>();
        String roleName = user.getVaiTro() != null ? user.getVaiTro().getTenVaiTro() : null;
        if (roleName != null)
            extraClaims.put("role", roleName);
        extraClaims.put("maTaiKhoan", user.getMaTaiKhoan());
        var jwtToken = jwtService.generateToken(extraClaims, user);
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .vaiTro(roleName)
                .maTaiKhoan(user.getMaTaiKhoan())
                .build();
    }

    public String verifyAccount(String email, String otp) {
        TaiKhoan user = taiKhoanRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với email này."));

        if (user.getOtp().equals(otp)
                && Duration.between(user.getOtpGeneratedTime(), LocalDateTime.now()).getSeconds() < (5 * 60)) {
            user.setEnabled(true);
            user.setOtp(null); // Clear OTP
            user.setOtpGeneratedTime(null);
            taiKhoanRepository.save(user);
            return "Tài khoản đã được kích hoạt thành công.";
        }
        return "OTP không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.";
    }

    public String forgotPassword(String email) throws MessagingException {
        TaiKhoan user = taiKhoanRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với email này."));

        String otp = generateOtp();
        user.setOtp(otp);
        user.setOtpGeneratedTime(LocalDateTime.now());
        taiKhoanRepository.save(user);

        try {
            emailService.sendOtpEmail(email, otp);
        } catch (org.springframework.mail.MailException | MessagingException e) {
            throw new IllegalStateException("Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại sau.");
        }

        return "Mã OTP để đặt lại mật khẩu đã được gửi đến email của bạn.";
    }

    public String resetPassword(String email, String otp, String newPassword) {
        TaiKhoan user = taiKhoanRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng với email này."));

        if (user.getOtp().equals(otp)
                && Duration.between(user.getOtpGeneratedTime(), LocalDateTime.now()).getSeconds() < (5 * 60)) {
            user.setMatKhauHash(passwordEncoder.encode(newPassword));
            user.setOtp(null);
            user.setOtpGeneratedTime(null);
            taiKhoanRepository.save(user);
            return "Mật khẩu đã được đặt lại thành công.";
        }
        return "OTP không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.";
    }

    // Helper to lookup account by username
    public java.util.Optional<TaiKhoan> findByTenDangNhap(String tenDangNhap) {
        return taiKhoanRepository.findByTenDangNhap(tenDangNhap);
    }

    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }
}