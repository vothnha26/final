package com.noithat.qlnt.backend.entity.chat;

import com.noithat.qlnt.backend.entity.NhanVien;
import com.noithat.qlnt.backend.entity.KhachHang;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ChatSession")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ChatSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    // link to KhachHang entity (customer)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ma_khach_hang")
    private KhachHang customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "staff_id")
    private NhanVien staff;

    @Column(columnDefinition = "NVARCHAR(20)")
    private String status = "waiting"; // waiting (chờ nhận) / active (đang chat) / closed (đã đóng)

    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime closedAt;
}
