package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.entity.chat.ChatMessage;
import com.noithat.qlnt.backend.entity.chat.ChatSession;
import com.noithat.qlnt.backend.entity.KhachHang;
import com.noithat.qlnt.backend.entity.HangThanhVien;
import com.noithat.qlnt.backend.repository.KhachHangRepository;
import com.noithat.qlnt.backend.repository.HangThanhVienRepository;
import com.noithat.qlnt.backend.repository.chat.ChatSessionRepository;
import com.noithat.qlnt.backend.repository.chat.ChatMessageRepository;
import com.noithat.qlnt.backend.repository.chat.StaffSessionRepository;
import com.noithat.qlnt.backend.service.chat.ChatService;
import com.noithat.qlnt.backend.service.chat.GuestChatRateLimiter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;

@RestController
public class ChatController {

    private static final Logger logger = LoggerFactory.getLogger(ChatController.class);

    @Autowired
    private ChatService chatService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private KhachHangRepository khachHangRepository;

    @Autowired
    private HangThanhVienRepository hangThanhVienRepository;

    @Autowired
    private ChatSessionRepository chatSessionRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private GuestChatRateLimiter guestChatRateLimiter;

    @Autowired
    private StaffSessionRepository staffSessionRepository;

    /**
     * Khởi tạo hoặc lấy session chat hiện có cho khách hàng
     * POST /chat/start
     * Body: { customerId: number, message?: string }
     */
    @PostMapping("/chat/start")
    public ResponseEntity<?> start(@RequestBody Map<String, Object> body) {
        try {
            // Parse customerId
            Integer customerId = null;
            Object cid = body.get("customerId");
            if (cid instanceof Number) {
                customerId = ((Number) cid).intValue();
            } else if (cid instanceof String) {
                try { customerId = Integer.valueOf((String) cid); } catch (NumberFormatException e) {}
            }

            if (customerId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "customerId is required"));
            }

            String message = null;
            Object msgObj = body.get("message");
            if (msgObj != null) message = String.valueOf(msgObj).trim();

            KhachHang kh = khachHangRepository.findById(customerId).orElse(null);
            if (kh == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Customer not found"));
            }

            // Tìm hoặc tạo session
            ChatSession session = chatService.startSession(kh, message);

            // Build response với đầy đủ thông tin
            Map<String, Object> response = new HashMap<>();
            response.put("id", session.getId());
            response.put("sessionId", session.getId());
            response.put("status", session.getStatus());
            response.put("customerId", session.getCustomer().getMaKhachHang());
            response.put("customerName", session.getCustomer().getHoTen());
            response.put("staffId", session.getStaff() != null ? session.getStaff().getMaNhanVien() : null);
            response.put("staffName", session.getStaff() != null ? session.getStaff().getHoTen() : null);
            response.put("createdAt", session.getCreatedAt());

            // Notify staff về chat mới
            notifyStaffNewChat(session, kh.getMaKhachHang(), kh.getHoTen());

            // Notify customer
            Map<String, Object> customerPayload = new HashMap<>();
            customerPayload.put("type", "session_ready");
            customerPayload.put("sessionId", session.getId());
            customerPayload.put("status", session.getStatus());
            messagingTemplate.convertAndSend("/topic/customer/" + customerId, customerPayload);

            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            logger.error("Failed to start chat session", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to start chat", "message", ex.getMessage()));
        }
    }

    /**
     * Khởi tạo session chat cho khách vãng lai (guest) với thông tin tối thiểu
     * POST /chat/guest/start
     * Body: { name: string, phone?: string, email?: string, message?: string }
     */
    @PostMapping("/chat/guest/start")
    public ResponseEntity<?> startGuest(@RequestBody Map<String, Object> body,
                                        jakarta.servlet.http.HttpServletRequest request) {
        try {
            String name = body.get("name") != null ? String.valueOf(body.get("name")).trim() : null;
            String phone = body.get("phone") != null ? String.valueOf(body.get("phone")).trim() : null;
            String email = body.get("email") != null ? String.valueOf(body.get("email")).trim() : null;
            String message = body.get("message") != null ? String.valueOf(body.get("message")).trim() : null;

            if (name == null || name.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "name is required"));
            }
            if ((phone == null || phone.isBlank()) && (email == null || email.isBlank())) {
                return ResponseEntity.badRequest().body(Map.of("error", "phone or email is required"));
            }

            // Rate limit by IP
            String ip = request.getHeader("X-Forwarded-For");
            if (ip == null || ip.isBlank()) ip = request.getRemoteAddr();
            if (!guestChatRateLimiter.checkAndRecord("ip:" + ip)) {
                return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                        .body(Map.of("error", "Bạn thao tác quá nhanh, vui lòng thử lại sau."));
            }

            // Reuse existing customer by phone/email if present, else create lightweight guest
            KhachHang kh = null;
            if (phone != null && !phone.isBlank()) {
                kh = khachHangRepository.findBySoDienThoai(phone).orElse(null);
            }
            if (kh == null && email != null && !email.isBlank()) {
                kh = khachHangRepository.findByEmail(email).orElse(null);
            }

            if (kh == null) {
                kh = new KhachHang();
                kh.setHoTen(name);
                kh.setEmail(email != null ? email : ("guest-" + System.currentTimeMillis() + "@example.invalid"));
                kh.setSoDienThoai(phone != null ? phone : "guest");
                // Assign lowest active membership tier if available
                HangThanhVien tier = hangThanhVienRepository
                        .findFirstByTrangThaiTrueOrderByDiemToiThieuAsc()
                        .orElseGet(() -> hangThanhVienRepository.findFirstByOrderByDiemToiThieuAsc().orElse(null));
                if (tier == null) {
                    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                            .body(Map.of("error", "No membership tier configured. Please seed HangThanhVien."));
                }
                kh.setHangThanhVien(tier);
                // Persist guest
                kh = khachHangRepository.save(kh);
            }

            ChatSession session = chatService.startSession(kh, message);

            // Notify staff về chat mới (kể cả khi chưa được assign, sẽ bắn cho tất cả staff online)
            notifyStaffNewChat(session, kh.getMaKhachHang(), kh.getHoTen());

            Map<String, Object> resp = new HashMap<>();
            resp.put("sessionId", session.getId());
            resp.put("status", session.getStatus());
            resp.put("customerId", kh.getMaKhachHang());
            resp.put("customerName", kh.getHoTen());
            return ResponseEntity.ok(resp);
        } catch (Exception ex) {
            logger.error("Failed to start guest chat", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to start guest chat"));
        }
    }

    /**
     * Helper: Gửi thông báo new_chat tới staff
     * - Nếu session đã được assign staff: chỉ gửi cho staff đó
     * - Nếu chưa assign (waiting): gửi tới tất cả staff online để sidebar tự refresh
     */
    private void notifyStaffNewChat(ChatSession session, Integer customerId, String customerName) {
        try {
            Map<String, Object> staffPayload = new HashMap<>();
            staffPayload.put("type", "new_chat");
            staffPayload.put("sessionId", session.getId());
            staffPayload.put("customerId", customerId);
            staffPayload.put("customerName", customerName);
            staffPayload.put("status", session.getStatus());

            if (session.getStaff() != null) {
                Integer staffId = session.getStaff().getMaNhanVien();
                messagingTemplate.convertAndSend("/topic/staff/" + staffId, staffPayload);
            } else {
                // Broadcast tới tất cả staff online
                var online = staffSessionRepository.findByIsOnlineTrueOrderByActiveChatsAscLastPingDesc();
                if (online != null) {
                    for (var ss : online) {
                        messagingTemplate.convertAndSend("/topic/staff/" + ss.getStaffId(), staffPayload);
                    }
                }
            }
        } catch (Exception ex) {
            logger.error("Failed to notify staff for new chat {}", session.getId(), ex);
        }
    }

    /**
     * Lấy danh sách tin nhắn của 1 session
     * GET /chat/session/{sessionId}/messages
     */
    @GetMapping("/chat/session/{sessionId}/messages")
    public ResponseEntity<?> getMessages(@PathVariable Integer sessionId) {
        try {
            ChatSession session = chatSessionRepository.findById(sessionId).orElse(null);
            if (session == null) {
                return ResponseEntity.notFound().build();
            }

            // Authorization: If current user is staff, allow only if session is waiting or owned by them
            try {
                var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
                if (auth != null && auth.isAuthenticated()) {
                    // Resolve current staff from principal if possible
                    Integer staffId = null;
                    Object principalObj = auth.getPrincipal();
                    if (!(principalObj instanceof org.springframework.security.core.userdetails.UserDetails)) {
                        try {
                            var getClaims = principalObj.getClass().getMethod("getClaims");
                            Object claims = getClaims.invoke(principalObj);
                            if (claims instanceof java.util.Map) {
                                @SuppressWarnings("unchecked")
                                var map = (java.util.Map<String, Object>) claims;
                                Object maybe = map.get("maNhanVien");
                                if (maybe == null) maybe = map.get("staffId");
                                if (maybe != null) staffId = Integer.valueOf(String.valueOf(maybe));
                            }
                        } catch (Exception ignored) {}
                    }

                    String st = session.getStatus();
                    boolean isWaiting = "waiting".equalsIgnoreCase(st);
                    if (!isWaiting && staffId != null) {
                        if (session.getStaff() == null || !session.getStaff().getMaNhanVien().equals(staffId)) {
                            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Forbidden"));
                        }
                    }
                }
            } catch (Exception ignored) {}

            List<ChatMessage> messages = chatMessageRepository.findBySession_IdOrderBySentAtAsc(sessionId);
            List<Map<String, Object>> result = new ArrayList<>();
            
            for (ChatMessage msg : messages) {
                Map<String, Object> m = new HashMap<>();
                m.put("id", msg.getId());
                m.put("sessionId", sessionId);
                m.put("senderType", msg.getSenderType());
                m.put("senderId", msg.getSenderId());
                m.put("content", msg.getContent());
                m.put("sentAt", msg.getSentAt());
                result.add(m);
            }

            return ResponseEntity.ok(result);
        } catch (Exception ex) {
            logger.error("Failed to get messages for session " + sessionId, ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to get messages"));
        }
    }

    /**
     * Đóng session chat
     * POST /chat/session/{sessionId}/close
     */
    @PostMapping("/chat/session/{sessionId}/close")
    public ResponseEntity<?> closeSession(@PathVariable Integer sessionId) {
        try {
            ChatSession session = chatSessionRepository.findById(sessionId).orElse(null);
            if (session == null) {
                return ResponseEntity.notFound().build();
            }

            // Lưu customer và staff info trước khi close
            Integer customerId = session.getCustomer() != null ? session.getCustomer().getMaKhachHang() : null;
            Integer staffId = session.getStaff() != null ? session.getStaff().getMaNhanVien() : null;

            // Close session (chatService.endSession đã tự động giảm activeChats)
            chatService.endSession(sessionId);

            // Notify cả staff và customer
            Map<String, Object> payload = new HashMap<>();
            payload.put("type", "session_closed");
            payload.put("sessionId", sessionId);

            messagingTemplate.convertAndSend("/topic/chat/session-" + sessionId, payload);

            if (customerId != null) {
                messagingTemplate.convertAndSend("/topic/customer/" + customerId, payload);
            }
            if (staffId != null) {
                messagingTemplate.convertAndSend("/topic/staff/" + staffId, payload);
            }

            return ResponseEntity.ok(Map.of("status", "closed", "sessionId", sessionId));
        } catch (org.springframework.orm.ObjectOptimisticLockingFailureException | org.hibernate.StaleObjectStateException ex) {
            logger.error("Optimistic locking error when closing session {}: {}", sessionId, ex.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Session was modified by another transaction. Please reload.", "message", ex.getMessage()));
        } catch (Exception ex) {
            logger.error("Failed to close session " + sessionId, ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to close session", "message", ex.getMessage()));
        }
    }

    /**
     * Gửi tin nhắn qua STOMP
     * STOMP destination: /app/chat.send/{sessionId}
     * Payload: { senderType: "customer"|"staff", senderId: number, content: string }
     */
    @MessageMapping("/chat.send/{sessionId}")
    public void sendMessage(@DestinationVariable Integer sessionId, Map<String, Object> payload) {
        try {
            String senderType = (String) payload.get("senderType");
            Integer senderId = payload.get("senderId") instanceof Number 
                ? ((Number) payload.get("senderId")).intValue() 
                : null;
            String content = (String) payload.get("content");

            if (content == null || content.trim().isEmpty()) {
                return;
            }

            // Authorization: if staff is sending, derive staffId from security and ensure ownership
            if ("staff".equalsIgnoreCase(senderType)) {
                ChatSession s = chatSessionRepository.findById(sessionId).orElse(null);
                if (s == null || s.getStaff() == null) {
                    return;
                }

                // Derive staffId from authenticated principal claims
                Integer authStaffId = null;
                try {
                    var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
                    if (auth != null && auth.isAuthenticated()) {
                        Object principalObj = auth.getPrincipal();
                        if (!(principalObj instanceof org.springframework.security.core.userdetails.UserDetails)) {
                            try {
                                var getClaims = principalObj.getClass().getMethod("getClaims");
                                Object claims = getClaims.invoke(principalObj);
                                if (claims instanceof java.util.Map) {
                                    @SuppressWarnings("unchecked")
                                    var map = (java.util.Map<String, Object>) claims;
                                    Object maybe = map.get("maNhanVien");
                                    if (maybe == null) maybe = map.get("staffId");
                                    if (maybe != null) authStaffId = Integer.valueOf(String.valueOf(maybe));
                                }
                            } catch (Exception ignored) {}
                        }
                    }
                } catch (Exception e) {
                }

                // Prefer authenticated staffId; fallback to payload only if matches assigned
                Integer effectiveStaffId = authStaffId != null ? authStaffId : senderId;
                if (effectiveStaffId == null || !s.getStaff().getMaNhanVien().equals(effectiveStaffId)) {
                    return;
                }

                // Ensure we save with the verified staff id
                senderId = effectiveStaffId;
            }

            // Lưu tin nhắn vào database
            ChatMessage saved = chatService.saveMessage(sessionId, senderType, senderId, content);

            // Broadcast tin nhắn đã lưu tới tất cả subscribers của session
            Map<String, Object> broadcast = new HashMap<>();
            broadcast.put("id", saved.getId());
            broadcast.put("sessionId", sessionId);
            broadcast.put("senderType", saved.getSenderType());
            broadcast.put("senderId", saved.getSenderId());
            broadcast.put("content", saved.getContent());
            broadcast.put("sentAt", saved.getSentAt());

            messagingTemplate.convertAndSend("/topic/chat/session-" + sessionId, broadcast);
        } catch (Exception ex) {
            logger.error("Failed to send message for session " + sessionId, ex);
        }
    }

    /**
     * REST API fallback để gửi tin nhắn khi WebSocket không khả dụng
     * POST /chat/session/{sessionId}/message
     * Body: { senderType: "customer"|"staff", senderId: number, content: string }
     */
    @PostMapping("/chat/session/{sessionId}/message")
    public ResponseEntity<?> sendMessageViaRest(@PathVariable Integer sessionId, @RequestBody Map<String, Object> payload) {
        try {
            String senderType = (String) payload.get("senderType");
            Integer senderId = payload.get("senderId") instanceof Number 
                ? ((Number) payload.get("senderId")).intValue() 
                : null;
            String content = (String) payload.get("content");

            if (content == null || content.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Message content is required"));
            }

            ChatSession session = chatSessionRepository.findById(sessionId).orElse(null);
            if (session == null) {
                return ResponseEntity.notFound().build();
            }

            // Authorization: if staff is sending, derive staffId from security and ensure ownership
            if ("staff".equalsIgnoreCase(senderType)) {
                if (session.getStaff() == null) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("error", "No staff assigned to this session"));
                }

                // Derive staffId from authenticated principal claims
                Integer authStaffId = null;
                try {
                    var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
                    if (auth != null && auth.isAuthenticated()) {
                        Object principalObj = auth.getPrincipal();
                        if (!(principalObj instanceof org.springframework.security.core.userdetails.UserDetails)) {
                            try {
                                var getClaims = principalObj.getClass().getMethod("getClaims");
                                Object claims = getClaims.invoke(principalObj);
                                if (claims instanceof java.util.Map) {
                                    @SuppressWarnings("unchecked")
                                    var map = (java.util.Map<String, Object>) claims;
                                    Object maybe = map.get("maNhanVien");
                                    if (maybe == null) maybe = map.get("staffId");
                                    if (maybe != null) authStaffId = Integer.valueOf(String.valueOf(maybe));
                                }
                            } catch (Exception ignored) {}
                        }
                    }
                } catch (Exception e) {
                }

                // Prefer authenticated staffId; fallback to payload only if matches assigned
                Integer effectiveStaffId = authStaffId != null ? authStaffId : senderId;
                if (effectiveStaffId == null || !session.getStaff().getMaNhanVien().equals(effectiveStaffId)) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body(Map.of("error", "You are not assigned to this session"));
                }

                // Ensure we save with the verified staff id
                senderId = effectiveStaffId;
            }

            // Lưu tin nhắn vào database
            ChatMessage saved = chatService.saveMessage(sessionId, senderType, senderId, content);

            // Broadcast tin nhắn qua WebSocket để các client khác nhận
            Map<String, Object> broadcast = new HashMap<>();
            broadcast.put("id", saved.getId());
            broadcast.put("sessionId", sessionId);
            broadcast.put("senderType", saved.getSenderType());
            broadcast.put("senderId", saved.getSenderId());
            broadcast.put("content", saved.getContent());
            broadcast.put("sentAt", saved.getSentAt());
            messagingTemplate.convertAndSend("/topic/chat/session-" + sessionId, broadcast);

            // Return saved message
            Map<String, Object> response = new HashMap<>();
            response.put("id", saved.getId());
            response.put("content", saved.getContent());
            response.put("senderType", saved.getSenderType());
            response.put("senderId", saved.getSenderId());
            response.put("sentAt", saved.getSentAt());

            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            logger.error("Failed to send message via REST for session " + sessionId, ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to send message", "message", ex.getMessage()));
        }
    }

    /**
     * Xóa tin nhắn (chỉ staff có thể xóa tin nhắn của mình)
     * DELETE /chat/message/{messageId}
     */
    @DeleteMapping("/chat/message/{messageId}")
    public ResponseEntity<?> deleteMessage(@PathVariable Integer messageId) {
        try {
            ChatMessage message = chatMessageRepository.findById(messageId).orElse(null);
            if (message == null) {
                return ResponseEntity.notFound().build();
            }

            // Chỉ cho phép xóa tin nhắn của staff
            if (!"staff".equalsIgnoreCase(message.getSenderType())) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(Map.of("error", "Chỉ có thể xóa tin nhắn của nhân viên"));
            }

            chatMessageRepository.delete(message);

            return ResponseEntity.ok(Map.of("success", true, "message", "Đã xóa tin nhắn"));
        } catch (Exception ex) {
            logger.error("Failed to delete message " + messageId, ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Không thể xóa tin nhắn", "message", ex.getMessage()));
        }
    }

    /**
     * Xóa phiên chat (xóa cả session và tất cả tin nhắn)
     * DELETE /chat/session/{sessionId}
     */
    @DeleteMapping("/chat/session/{sessionId}")
    public ResponseEntity<?> deleteSession(@PathVariable Integer sessionId) {
        try {
            ChatSession session = chatSessionRepository.findById(sessionId).orElse(null);
            if (session == null) {
                return ResponseEntity.notFound().build();
            }

            // Xóa tất cả tin nhắn của session trước
            List<ChatMessage> messages = chatMessageRepository.findBySession_IdOrderBySentAtAsc(sessionId);
            chatMessageRepository.deleteAll(messages);

            // Xóa session
            chatSessionRepository.delete(session);

            return ResponseEntity.ok(Map.of("success", true, "message", "Đã xóa phiên chat"));
        } catch (Exception ex) {
            logger.error("Failed to delete session " + sessionId, ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Không thể xóa phiên chat", "message", ex.getMessage()));
        }
    }
}
