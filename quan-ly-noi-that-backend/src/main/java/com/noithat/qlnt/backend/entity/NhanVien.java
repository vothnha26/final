package com.noithat.qlnt.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "NhanVien")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class NhanVien {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer maNhanVien;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MaTaiKhoan", nullable = false, unique = true)
    private TaiKhoan taiKhoan;

    @Column(name = "HoTen", nullable = false, columnDefinition = "NVARCHAR(255)")
    private String hoTen;

    @Column(name = "ChucVu", columnDefinition = "NVARCHAR(100)")
    private String chucVu;

    @OneToOne(mappedBy = "staff", fetch = FetchType.LAZY)
    private com.noithat.qlnt.backend.entity.chat.StaffSession staffSession;
}