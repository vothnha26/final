package com.noithat.qlnt.backend.entity.chat;

import com.noithat.qlnt.backend.entity.NhanVien;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "StaffSession")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class StaffSession {
    @Id
    private Integer staffId; // same as NhanVien.maNhanVien

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "staff_id")
    private NhanVien staff;

    @Version
    private Long version;

    @Column(nullable = false)
    private Boolean isOnline = false;

    @Column(nullable = false)
    private Integer activeChats = 0;

    private LocalDateTime lastPing;
}
