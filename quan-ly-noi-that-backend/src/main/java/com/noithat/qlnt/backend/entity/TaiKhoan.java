package com.noithat.qlnt.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "TaiKhoan")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class TaiKhoan implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer maTaiKhoan;

    @Column(name = "TenDangNhap", nullable = false, unique = true, columnDefinition = "NVARCHAR(100)")
    private String tenDangNhap;

    @Column(name = "MatKhauHash", nullable = false, columnDefinition = "NVARCHAR(255)")
    private String matKhauHash;

    @Column(name = "Email", nullable = false, unique = true, columnDefinition = "NVARCHAR(255)")
    private String email;

    @ManyToOne(fetch = FetchType.EAGER) // Eager fetch for roles
    @JoinColumn(name = "MaVaiTro", nullable = false)
    private VaiTro vaiTro;

    // Fields for OTP and account status
    @Column(columnDefinition = "NVARCHAR(10)")
    private String otp;
    private LocalDateTime otpGeneratedTime;
    private boolean enabled = false; // Tài khoản chưa được kích hoạt ban đầu

    // UserDetails implementation
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority(vaiTro.getTenVaiTro()));
    }

    @Override
    public String getPassword() {
        return matKhauHash;
    }

    @Override
    public String getUsername() {
        return tenDangNhap;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}