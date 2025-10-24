package com.noithat.qlnt.backend.entity.chat;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ChatMessage")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ChatMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private ChatSession session;

    @Column(columnDefinition = "NVARCHAR(10)")
    private String senderType; // 'customer' or 'staff'

    private Integer senderId;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String content;

    private LocalDateTime sentAt = LocalDateTime.now();
}
