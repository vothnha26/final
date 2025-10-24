package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.entity.KhachHang;
import com.noithat.qlnt.backend.entity.chat.ChatSession;
import com.noithat.qlnt.backend.repository.KhachHangRepository;
import com.noithat.qlnt.backend.repository.chat.ChatSessionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;

@RestController
public class CustomerChatHistoryController {
    @Autowired
    private ChatSessionRepository chatSessionRepository;
    @Autowired
    private KhachHangRepository khachHangRepository;

    /**
     * Lấy danh sách session chat (active/waiting/closed) của 1 customer
     * GET /chat/sessions/customer/{customerId}
     * Optional: ?status=active|waiting|closed|all (default: active+waiting)
     */
    @GetMapping("/chat/sessions/customer/{customerId}")
    public ResponseEntity<?> getCustomerSessions(@PathVariable Integer customerId,
                                                @RequestParam(value = "status", required = false) String status) {
        Optional<KhachHang> khOpt = khachHangRepository.findById(customerId);
        if (khOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        KhachHang kh = khOpt.get();
        List<ChatSession> sessions = new ArrayList<>();
        if (status == null || status.isBlank() || "active+waiting".equalsIgnoreCase(status)) {
            sessions.addAll(chatSessionRepository.findAllByCustomerAndStatus(kh, "active"));
            sessions.addAll(chatSessionRepository.findAllByCustomerAndStatus(kh, "waiting"));
        } else if ("all".equalsIgnoreCase(status)) {
            sessions.addAll(chatSessionRepository.findAllByCustomerAndStatus(kh, "active"));
            sessions.addAll(chatSessionRepository.findAllByCustomerAndStatus(kh, "waiting"));
            sessions.addAll(chatSessionRepository.findAllByCustomerAndStatus(kh, "closed"));
        } else {
            sessions.addAll(chatSessionRepository.findAllByCustomerAndStatus(kh, status));
        }
        // Sort by createdAt desc
        sessions.sort(Comparator.comparing(ChatSession::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())));
        List<Map<String, Object>> result = new ArrayList<>();
        for (ChatSession s : sessions) {
            Map<String, Object> m = new HashMap<>();
            m.put("sessionId", s.getId());
            m.put("status", s.getStatus());
            m.put("createdAt", s.getCreatedAt());
            m.put("closedAt", s.getClosedAt());
            m.put("staffId", s.getStaff() != null ? s.getStaff().getMaNhanVien() : null);
            m.put("staffName", s.getStaff() != null ? s.getStaff().getHoTen() : null);
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }
}
