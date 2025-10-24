package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.entity.chat.ChatMessage;
import com.noithat.qlnt.backend.entity.chat.ChatSession;
import com.noithat.qlnt.backend.entity.chat.StaffSession;
import com.noithat.qlnt.backend.entity.NhanVien;
import com.noithat.qlnt.backend.service.chat.ChatService;
import com.noithat.qlnt.backend.repository.chat.ChatSessionRepository;
import com.noithat.qlnt.backend.repository.chat.ChatMessageRepository;
import com.noithat.qlnt.backend.repository.chat.StaffSessionRepository;
import com.noithat.qlnt.backend.repository.NhanVienRepository;
import com.noithat.qlnt.backend.repository.TaiKhoanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.HashMap;

/**
 * API dành cho staff quản lý live chat
 */
@RestController
@RequestMapping("/api/v1/live-chat")
public class LiveChatApiController {

    private static final Logger logger = LoggerFactory.getLogger(LiveChatApiController.class);

    @Autowired
    private ChatSessionRepository chatSessionRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private ChatService chatService;

    @Autowired
    private NhanVienRepository nhanVienRepository;

    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    @Autowired
    private StaffSessionRepository staffSessionRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    /**
     * Lấy danh sách tất cả chat sessions (cho staff)
     * GET /api/v1/live-chat
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listChats(
            @RequestParam(required = false) String status) {
        try {
            // Limit visibility: staff only sees sessions assigned to them OR waiting sessions
            NhanVien currentStaff = getCurrentStaff();
            if (currentStaff == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(List.of());
            }

            List<ChatSession> sessions;
            
            if (status != null && !status.isEmpty()) {
                // Staff can see only their active sessions; for waiting, show all waiting
                if ("waiting".equalsIgnoreCase(status)) {
                    sessions = chatSessionRepository.findByStatus("waiting");
                } else {
                    // Filter in-memory after loading by status as repository doesn't expose staff filter
                    sessions = chatSessionRepository.findByStatus(status);
                    sessions.removeIf(s -> s.getStaff() == null ||
                            !s.getStaff().getMaNhanVien().equals(currentStaff.getMaNhanVien()));
                }
            } else {
                // Default: own active sessions + all waiting sessions
                List<ChatSession> all = chatSessionRepository.findAll();
                sessions = new ArrayList<>();
                for (ChatSession s : all) {
                    if ("waiting".equalsIgnoreCase(s.getStatus())) {
                        sessions.add(s);
                    } else if (s.getStaff() != null &&
                            s.getStaff().getMaNhanVien().equals(currentStaff.getMaNhanVien())) {
                        sessions.add(s);
                    }
                }
            }

            List<Map<String, Object>> result = new ArrayList<>();
            
            for (ChatSession session : sessions) {
                try {
                    List<ChatMessage> messages = chatMessageRepository
                        .findBySession_IdOrderBySentAtAsc(session.getId());

                    Map<String, Object> sessionData = new HashMap<>();
                    sessionData.put("id", session.getId());
                    sessionData.put("sessionId", session.getId());
                    sessionData.put("status", session.getStatus() != null ? session.getStatus() : "waiting");
                    sessionData.put("createdAt", session.getCreatedAt());
                    sessionData.put("closedAt", session.getClosedAt());
                    
                    // Thông tin khách hàng - null-safe với fallback
                    if (session.getCustomer() != null) {
                        try {
                            Map<String, Object> customer = new HashMap<>();
                            customer.put("maKhachHang", session.getCustomer().getMaKhachHang());
                            customer.put("hoTen", session.getCustomer().getHoTen() != null ? 
                                session.getCustomer().getHoTen() : "Khách hàng");
                            
                            // Safely get tenDangNhap
                            try {
                                if (session.getCustomer().getTaiKhoan() != null && 
                                    session.getCustomer().getTaiKhoan().getTenDangNhap() != null) {
                                    customer.put("tenDangNhap", session.getCustomer().getTaiKhoan().getTenDangNhap());
                                } else {
                                    customer.put("tenDangNhap", null);
                                }
                            } catch (Exception e) {
                                customer.put("tenDangNhap", null);
                            }
                            
                            customer.put("email", session.getCustomer().getEmail());
                            customer.put("soDienThoai", session.getCustomer().getSoDienThoai());
                            sessionData.put("customer", customer);
                        } catch (Exception e) {
                            sessionData.put("customer", Map.of(
                                "maKhachHang", session.getCustomer().getMaKhachHang(),
                                "hoTen", "Khách hàng"
                            ));
                        }
                    } else {
                        sessionData.put("customer", null);
                    }
                    
                    // Thông tin staff - null-safe
                    if (session.getStaff() != null) {
                        try {
                            sessionData.put("staffId", session.getStaff().getMaNhanVien());
                            sessionData.put("staffName", session.getStaff().getHoTen() != null ? 
                                session.getStaff().getHoTen() : "Nhân viên");
                        } catch (Exception e) {
                            sessionData.put("staffId", null);
                            sessionData.put("staffName", null);
                        }
                    } else {
                        sessionData.put("staffId", null);
                        sessionData.put("staffName", null);
                    }

                    // Tin nhắn cuối - null-safe
                    if (!messages.isEmpty()) {
                        try {
                            ChatMessage lastMsg = messages.get(messages.size() - 1);
                            sessionData.put("lastMessage", lastMsg.getContent() != null ? lastMsg.getContent() : "");
                            sessionData.put("lastMessageTime", lastMsg.getSentAt());
                        } catch (Exception e) {
                            sessionData.put("lastMessage", null);
                            sessionData.put("lastMessageTime", null);
                        }
                    } else {
                        sessionData.put("lastMessage", null);
                        sessionData.put("lastMessageTime", null);
                    }

                    sessionData.put("messageCount", messages.size());
                    sessionData.put("unreadCount", 0); // TODO: implement read tracking

                    result.add(sessionData);
                } catch (Exception e) {
                    logger.error("Failed to process session {}: {}", session.getId(), e.getMessage());
                    // Skip this session if there's an error
                }
            }
            
            return ResponseEntity.ok(result);
        } catch (Exception ex) {
            logger.error("Failed to list chats", ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ArrayList<>());
        }
    }

    /**
     * Lấy chi tiết 1 chat session với tất cả tin nhắn
     * GET /api/v1/live-chat/session/{sessionId}
     */
    @GetMapping("/session/{sessionId}")
    public ResponseEntity<Map<String, Object>> getSessionDetail(@PathVariable Integer sessionId) {
        try {
            ChatSession session = chatSessionRepository.findById(sessionId).orElse(null);
            if (session == null) {
                return ResponseEntity.notFound().build();
            }

            // Authorization: only assigned staff may view non-waiting sessions
            NhanVien currentStaff = getCurrentStaff();
            if (currentStaff == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
            String st = session.getStatus();
            boolean isWaiting = "waiting".equalsIgnoreCase(st);
            if (!isWaiting) {
                if (session.getStaff() == null ||
                        !session.getStaff().getMaNhanVien().equals(currentStaff.getMaNhanVien())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                }
            }

            List<ChatMessage> messages = chatMessageRepository
                .findBySession_IdOrderBySentAtAsc(sessionId);

            Map<String, Object> result = new HashMap<>();
            result.put("id", session.getId());
            result.put("sessionId", session.getId());
            result.put("status", session.getStatus() != null ? session.getStatus() : "waiting");
            result.put("createdAt", session.getCreatedAt());
            result.put("closedAt", session.getClosedAt());

            // Thông tin khách hàng - null-safe với fallback values
            if (session.getCustomer() != null) {
                try {
                    Map<String, Object> customer = new HashMap<>();
                    customer.put("maKhachHang", session.getCustomer().getMaKhachHang());
                    customer.put("hoTen", session.getCustomer().getHoTen() != null ? 
                        session.getCustomer().getHoTen() : "Khách hàng");
                    
                    // Safely get tenDangNhap
                    try {
                        if (session.getCustomer().getTaiKhoan() != null && 
                            session.getCustomer().getTaiKhoan().getTenDangNhap() != null) {
                            customer.put("tenDangNhap", session.getCustomer().getTaiKhoan().getTenDangNhap());
                        } else {
                            customer.put("tenDangNhap", null);
                        }
                    } catch (Exception e) {
                        customer.put("tenDangNhap", null);
                    }
                    
                    customer.put("email", session.getCustomer().getEmail());
                    customer.put("soDienThoai", session.getCustomer().getSoDienThoai());
                    result.put("customer", customer);
                } catch (Exception e) {
                    logger.error("Failed to map customer data for session {}: {}", sessionId, e.getMessage());
                    result.put("customer", Map.of(
                        "maKhachHang", session.getCustomer().getMaKhachHang(),
                        "hoTen", "Khách hàng"
                    ));
                }
            } else {
                result.put("customer", null);
            }

            // Thông tin staff - null-safe
            if (session.getStaff() != null) {
                try {
                    Map<String, Object> staff = new HashMap<>();
                    staff.put("id", session.getStaff().getMaNhanVien());
                    staff.put("name", session.getStaff().getHoTen() != null ? 
                        session.getStaff().getHoTen() : "Nhân viên");
                    result.put("staff", staff);
                } catch (Exception e) {
                    logger.error("Failed to map staff data for session {}: {}", sessionId, e.getMessage());
                    result.put("staff", null);
                }
            } else {
                result.put("staff", null);
            }

            // Danh sách tin nhắn - null-safe
            List<Map<String, Object>> messageList = new ArrayList<>();
            try {
                for (ChatMessage msg : messages) {
                    if (msg != null) {
                        Map<String, Object> m = new HashMap<>();
                        m.put("id", msg.getId());
                        m.put("senderType", msg.getSenderType() != null ? msg.getSenderType() : "customer");
                        m.put("senderId", msg.getSenderId());
                        m.put("content", msg.getContent() != null ? msg.getContent() : "");
                        m.put("sentAt", msg.getSentAt());
                        messageList.add(m);
                    }
                }
            } catch (Exception e) {
                logger.error("Failed to map messages for session {}: {}", sessionId, e.getMessage());
            }
            result.put("messages", messageList);

            return ResponseEntity.ok(result);
        } catch (Exception ex) {
            logger.error("Failed to get session detail " + sessionId, ex);
            // Return error with message for debugging
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to load session detail: " + ex.getMessage()));
        }
    }

    /**
     * Staff claim/nhận chat session
     * POST /api/v1/live-chat/session/{sessionId}/claim
     */
    @PostMapping("/session/{sessionId}/claim")
    public ResponseEntity<Map<String, Object>> claimSession(@PathVariable Integer sessionId) {
        try {
            // Lấy thông tin staff hiện tại
            NhanVien staff = getCurrentStaff();
            if (staff == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Not authenticated as staff"));
            }

            ChatSession session = chatSessionRepository.findById(sessionId).orElse(null);
            if (session == null) {
                return ResponseEntity.notFound().build();
            }

            // Check: Nếu session đã closed thì không cho claim
            if ("closed".equals(session.getStatus())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Session already closed"));
            }

            // Check: Nếu đã có staff khác assign rồi
            if (session.getStaff() != null && 
                !session.getStaff().getMaNhanVien().equals(staff.getMaNhanVien())) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "Session already assigned to another staff",
                                "assignedTo", session.getStaff().getMaNhanVien(),
                                "assignedName", session.getStaff().getHoTen()));
            }

            // Check: Staff có quá nhiều chat active không (giới hạn 5 chat/staff)
            StaffSession staffSession = staffSessionRepository.findById(staff.getMaNhanVien()).orElse(null);
            if (staffSession != null && staffSession.getActiveChats() >= 5) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(Map.of("error", "You already have maximum number of active chats (5)",
                                "currentChats", staffSession.getActiveChats()));
            }

            // Assign session cho staff này
            session.setStaff(staff);
            session.setStatus("active");
            chatSessionRepository.save(session);

            // Cập nhật staff session (tăng activeChats)
            updateStaffChatCount(staff.getMaNhanVien(), 1);

            // Notify customer qua WebSocket
            if (session.getCustomer() != null) {
                Map<String, Object> notification = new HashMap<>();
                notification.put("type", "staff_joined");
                notification.put("sessionId", sessionId);
                notification.put("staffId", staff.getMaNhanVien());
                notification.put("staffName", staff.getHoTen());
                messagingTemplate.convertAndSend(
                    "/topic/customer/" + session.getCustomer().getMaKhachHang(), 
                    notification);
            }

            // Broadcast status update to all staff
            Map<String, Object> statusUpdate = new HashMap<>();
            statusUpdate.put("type", "session_claimed");
            statusUpdate.put("sessionId", sessionId);
            statusUpdate.put("staffId", staff.getMaNhanVien());
            statusUpdate.put("staffName", staff.getHoTen());
            messagingTemplate.convertAndSend("/topic/live-chat/sessions", statusUpdate);

            return ResponseEntity.ok(Map.of(
                "status", "success",
                "sessionId", sessionId,
                "staffId", staff.getMaNhanVien(),
                "staffName", staff.getHoTen()
            ));
        } catch (Exception ex) {
            logger.error("Failed to claim session " + sessionId, ex);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to claim session: " + ex.getMessage()));
        }
    }

    /**
     * Đánh dấu đã đọc tin nhắn
     * PUT /api/v1/live-chat/session/{sessionId}/mark-read
     */
    @PutMapping("/session/{sessionId}/mark-read")
    public ResponseEntity<Map<String, Object>> markRead(@PathVariable Integer sessionId) {
        // TODO: Implement read tracking
        return ResponseEntity.ok(Map.of("status", "ok"));
    }

    // ===== Helper Methods =====

    /**
     * Lấy thông tin staff hiện tại từ security context
     */
    private NhanVien getCurrentStaff() {
        try {
            var auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
            
            if (auth == null || !auth.isAuthenticated()) {
                return null;
            }

            Object principalObj = auth.getPrincipal();
            String principalName = null;
            Integer principalNumeric = null;

            // Extract principal info
            if (principalObj instanceof UserDetails) {
                principalName = ((UserDetails) principalObj).getUsername();
            } else if (principalObj instanceof java.security.Principal) {
                principalName = ((java.security.Principal) principalObj).getName();
            } else {
                // Try JWT reflection
                try {
                    var getClaims = principalObj.getClass().getMethod("getClaims");
                    Object claims = getClaims.invoke(principalObj);
                    if (claims instanceof Map) {
                        @SuppressWarnings("unchecked")
                        Map<String, Object> claimMap = (Map<String, Object>) claims;
                        Object maybe = claimMap.get("maNhanVien");
                        if (maybe == null) maybe = claimMap.get("staffId");
                        if (maybe != null) {
                            principalNumeric = Integer.valueOf(String.valueOf(maybe));
                        }
                    }
                } catch (Exception ignored) {}
                
                if (principalName == null) {
                    principalName = auth.getName();
                }
            }

            // Resolve NhanVien
            NhanVien staff = null;
            if (principalNumeric != null) {
                staff = nhanVienRepository.findById(principalNumeric).orElse(null);
            }
            if (staff == null && principalName != null) {
                var tkOpt = taiKhoanRepository.findByTenDangNhap(principalName);
                if (tkOpt.isPresent()) {
                    staff = nhanVienRepository.findByTaiKhoan(tkOpt.get()).orElse(null);
                }
            }

            return staff;
        } catch (Exception ex) {
            logger.error("Failed to get current staff", ex);
            return null;
        }
    }

    /**
     * Cập nhật số lượng chat của staff
     */
    private void updateStaffChatCount(Integer staffId, int delta) {
        try {
            StaffSession ss = staffSessionRepository.findById(staffId).orElse(null);
            if (ss == null) {
                // Tạo mới nếu chưa có
                NhanVien staff = nhanVienRepository.findById(staffId).orElse(null);
                if (staff != null) {
                    ss = new StaffSession();
                    ss.setStaffId(staffId);
                    ss.setStaff(staff);
                    ss.setIsOnline(true);
                    ss.setActiveChats(Math.max(0, delta));
                    ss.setLastPing(java.time.LocalDateTime.now());
                }
            } else {
                ss.setActiveChats(Math.max(0, ss.getActiveChats() + delta));
                ss.setLastPing(java.time.LocalDateTime.now());
            }
            
            if (ss != null) {
                staffSessionRepository.save(ss);
            }
        } catch (Exception ex) {
            logger.error("Failed to update staff chat count for " + staffId, ex);
        }
    }
}
