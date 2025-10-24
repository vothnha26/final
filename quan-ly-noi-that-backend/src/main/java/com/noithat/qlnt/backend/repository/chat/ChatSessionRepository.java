package com.noithat.qlnt.backend.repository.chat;

import com.noithat.qlnt.backend.entity.chat.ChatSession;
import com.noithat.qlnt.backend.entity.KhachHang;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Integer> {
    // Find all sessions for a given customer and status
    List<ChatSession> findAllByCustomerAndStatus(KhachHang customer, String status);
    
    // Find all sessions by status
    List<ChatSession> findByStatus(String status);
}
