package com.noithat.qlnt.backend.service.chat.impl;

import com.noithat.qlnt.backend.entity.NhanVien;
import com.noithat.qlnt.backend.entity.KhachHang;
import com.noithat.qlnt.backend.entity.chat.ChatMessage;
import com.noithat.qlnt.backend.entity.chat.ChatSession;
import com.noithat.qlnt.backend.entity.chat.StaffSession;
import com.noithat.qlnt.backend.repository.chat.ChatMessageRepository;
import com.noithat.qlnt.backend.repository.chat.ChatSessionRepository;
import com.noithat.qlnt.backend.repository.chat.StaffSessionRepository;
import com.noithat.qlnt.backend.repository.NhanVienRepository;
import com.noithat.qlnt.backend.service.chat.ChatService;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class ChatServiceImpl implements ChatService {

    private static final Logger logger = LoggerFactory.getLogger(ChatServiceImpl.class);

    @Autowired
    private ChatSessionRepository chatSessionRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private StaffSessionRepository staffSessionRepository;

    @Autowired
    private NhanVienRepository nhanVienRepository;

    @Override
    @Transactional
    public ChatSession startSession(KhachHang customer, String firstMessage) {
        if (customer == null) {
            throw new IllegalArgumentException("Customer cannot be null");
        }

        // 1) Kiểm tra session đang active hoặc waiting của khách hàng này
        // Chỉ cho phép 1 session active/waiting duy nhất cho mỗi khách hàng để tránh spam
        List<ChatSession> activeOrWaitingSessions = new ArrayList<>();
        
        // Check cả active và waiting sessions
        List<ChatSession> activeSessions = chatSessionRepository.findAllByCustomerAndStatus(customer, "active");
        List<ChatSession> waitingSessions = chatSessionRepository.findAllByCustomerAndStatus(customer, "waiting");
        
        if (activeSessions != null) activeOrWaitingSessions.addAll(activeSessions);
        if (waitingSessions != null) activeOrWaitingSessions.addAll(waitingSessions);
        
        if (!activeOrWaitingSessions.isEmpty()) {
            // Tìm session mới nhất
            ChatSession latestSession = activeOrWaitingSessions.get(0);
            for (ChatSession s : activeOrWaitingSessions) {
                if (s.getCreatedAt() != null && 
                    (latestSession.getCreatedAt() == null || s.getCreatedAt().isAfter(latestSession.getCreatedAt()))) {
                    latestSession = s;
                }
            }
            
            // Lưu tin nhắn mới vào session hiện tại nếu có
            if (firstMessage != null && !firstMessage.trim().isEmpty()) {
                saveMessage(latestSession.getId(), "customer", customer.getMaKhachHang(), firstMessage);
            }
            
            return latestSession;
        }

        // 2) Tạo session mới với trạng thái waiting (chờ staff nhận)
        ChatSession session = new ChatSession();
        session.setCustomer(customer);
        session.setStatus("waiting");  // Frontend expect "waiting", not "pending"
        session.setCreatedAt(LocalDateTime.now());
        session = chatSessionRepository.save(session);

        // 3) Tự động assign cho staff online có ít chat nhất
        NhanVien assignedStaff = findAvailableStaff();
        
        if (assignedStaff != null) {
            session.setStaff(assignedStaff);
            session.setStatus("active");
            session = chatSessionRepository.save(session);
            
            // Tăng số chat đang xử lý của staff
            updateStaffChatCount(assignedStaff.getMaNhanVien(), 1);
        }

        // 4) Lưu tin nhắn đầu tiên nếu có
        if (firstMessage != null && !firstMessage.trim().isEmpty()) {
            saveMessage(session.getId(), "customer", customer.getMaKhachHang(), firstMessage);
        }

        return session;
    }

    @Override
    @Transactional
    public ChatMessage saveMessage(Integer sessionId, String senderType, Integer senderId, String content) {
        if (sessionId == null) {
            throw new IllegalArgumentException("Session ID cannot be null");
        }
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Message content cannot be empty");
        }

        ChatSession session = chatSessionRepository.findById(sessionId).orElse(null);
        if (session == null) {
            throw new IllegalArgumentException("Chat session not found: " + sessionId);
        }

        ChatMessage msg = new ChatMessage();
        msg.setSession(session);
        msg.setSenderType(senderType != null ? senderType : "customer");
        msg.setSenderId(senderId);
        msg.setContent(content.trim());
        msg.setSentAt(LocalDateTime.now());
        
        ChatMessage saved = chatMessageRepository.save(msg);
        
        return saved;
    }

    @Override
    @Transactional
    public void endSession(Integer sessionId) {
        if (sessionId == null) {
            throw new IllegalArgumentException("Session ID cannot be null");
        }

        ChatSession session = chatSessionRepository.findById(sessionId).orElse(null);
        if (session == null) {
            return;
        }

        try {
            // Đóng session
            session.setStatus("closed");
            session.setClosedAt(LocalDateTime.now());
            chatSessionRepository.save(session);

            // Giảm số chat đang xử lý của staff
            if (session.getStaff() != null) {
                updateStaffChatCount(session.getStaff().getMaNhanVien(), -1);
            }
        } catch (org.springframework.orm.ObjectOptimisticLockingFailureException | org.hibernate.StaleObjectStateException ex) {
            logger.error("Optimistic locking error when closing session {}: {}", sessionId, ex.getMessage());
            throw ex;
        }
    }

    /**
     * Tìm staff online có ít chat nhất để assign
     */
    private NhanVien findAvailableStaff() {
        try {
            List<StaffSession> available = staffSessionRepository.findByIsOnlineTrueOrderByActiveChatsAscLastPingDesc();
            
            if (available != null && !available.isEmpty()) {
                StaffSession chosen = available.get(0);
                return chosen.getStaff();
            }
            
            return null;
        } catch (Exception ex) {
            logger.error("Error finding available staff", ex);
            return null;
        }
    }

    /**
     * Cập nhật số lượng chat đang xử lý của staff
     * @param staffId ID của staff
     * @param delta Số lượng thay đổi (+1 khi assign, -1 khi close)
     */
    private void updateStaffChatCount(Integer staffId, int delta) {
        try {
            StaffSession staffSession = staffSessionRepository.findById(staffId).orElse(null);
            if (staffSession == null) {
                // Create new StaffSession if not exists
                NhanVien staff = nhanVienRepository.findById(staffId).orElse(null);
                if (staff != null) {
                    staffSession = new StaffSession();
                    staffSession.setStaffId(staffId);
                    staffSession.setStaff(staff);
                    staffSession.setIsOnline(true);
                    staffSession.setActiveChats(Math.max(0, delta));
                    staffSession.setLastPing(LocalDateTime.now());
                    staffSessionRepository.save(staffSession);
                }
            } else {
                int newCount = Math.max(0, staffSession.getActiveChats() + delta);
                staffSession.setActiveChats(newCount);
                staffSession.setLastPing(LocalDateTime.now());
                staffSessionRepository.save(staffSession);
            }
        } catch (org.springframework.orm.ObjectOptimisticLockingFailureException | org.hibernate.StaleObjectStateException ex) {
            logger.error("Optimistic locking error updating staff chat count for staff {}: {}", staffId, ex.getMessage());
            throw ex;
        } catch (Exception ex) {
            logger.error("Error updating staff chat count for staff " + staffId, ex);
            throw ex;
        }
    }
}
