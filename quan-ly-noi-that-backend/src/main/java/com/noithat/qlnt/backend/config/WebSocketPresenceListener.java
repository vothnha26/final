package com.noithat.qlnt.backend.config;

import com.noithat.qlnt.backend.entity.NhanVien;
import com.noithat.qlnt.backend.entity.chat.StaffSession;
import com.noithat.qlnt.backend.repository.NhanVienRepository;
import com.noithat.qlnt.backend.repository.TaiKhoanRepository;
import com.noithat.qlnt.backend.repository.chat.StaffSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.time.LocalDateTime;

@Component
public class WebSocketPresenceListener {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketPresenceListener.class);

    private final TaiKhoanRepository taiKhoanRepository;
    private final NhanVienRepository nhanVienRepository;
    private final StaffSessionRepository staffSessionRepository;

    public WebSocketPresenceListener(TaiKhoanRepository taiKhoanRepository,
            NhanVienRepository nhanVienRepository,
            StaffSessionRepository staffSessionRepository) {
        this.taiKhoanRepository = taiKhoanRepository;
        this.nhanVienRepository = nhanVienRepository;
        this.staffSessionRepository = staffSessionRepository;
    }

    @EventListener
    public void handleSessionConnected(SessionConnectEvent event) {
        try {
            StompHeaderAccessor sha = StompHeaderAccessor.wrap(event.getMessage());
            var principal = sha.getUser();
            if (principal == null) {
                // logger.debug("WebSocket connect: no principal present (anonymous)");
                return;
            }

            String principalName = principal.getName();
            Integer principalNumeric = null;

            // Try to extract numeric staff id from principal if present (some auth tokens
            // expose claims)
            try {
                var pObj = principal;
                var clazz = pObj.getClass();
                try {
                    var m = clazz.getMethod("getClaims");
                    Object claims = m.invoke(pObj);
                    if (claims instanceof java.util.Map) {
                        @SuppressWarnings("unchecked")
                        var map = (java.util.Map<String, Object>) claims;
                        Object maybe = map.get("maNhanVien");
                        if (maybe == null)
                            maybe = map.get("staffId");
                        if (maybe != null) {
                            try {
                                principalNumeric = Integer.valueOf(String.valueOf(maybe));
                            } catch (Exception ex) {
                            }
                        }
                    }
                } catch (NoSuchMethodException ignore) {
                    // not a JWT-like principal
                }
            } catch (Exception ex) {
                // logger.debug("Failed to introspect principal for numeric id: {}",
                // ex.getMessage());
            }

            NhanVien staff = null;
            if (principalNumeric != null) {
                staff = nhanVienRepository.findById(principalNumeric).orElse(null);
            }
            if (staff == null && principalName != null) {
                try {
                    var tkOpt = taiKhoanRepository.findByTenDangNhap(principalName);
                    if (tkOpt.isPresent()) {
                        staff = nhanVienRepository.findByTaiKhoan(tkOpt.get()).orElse(null);
                    }
                } catch (Exception e) {
                    // logger.debug("presence: error resolving TaiKhoan for principalName={}: {}",
                    // principalName, e.getMessage());
                }
            }

            if (staff == null) {
                // logger.debug("WebSocket connect: authenticated principal is not a staff or
                // cannot be resolved: {}", principalName);
                return;
            }

            // Create or update StaffSession
            StaffSession ss = staffSessionRepository.findById(staff.getMaNhanVien()).orElse(null);
            if (ss == null) {
                ss = new StaffSession();
                ss.setStaffId(staff.getMaNhanVien());
                ss.setStaff(staff);
                ss.setActiveChats(0);
            }
            ss.setIsOnline(true);
            ss.setLastPing(LocalDateTime.now());
            staffSessionRepository.save(ss);
        } catch (Exception e) {
            logger.error("WebSocketPresence: error handling connect event: {}", e.getMessage(), e);
        }
    }

    @EventListener
    public void handleSessionDisconnected(SessionDisconnectEvent event) {
        try {
            StompHeaderAccessor sha = StompHeaderAccessor.wrap(event.getMessage());
            var principal = sha.getUser();
            if (principal == null) {
                // logger.debug("WebSocket disconnect: no principal present");
                return;
            }
            String principalName = principal.getName();
            Integer principalNumeric = null;

            try {
                var pObj = principal;
                var clazz = pObj.getClass();
                try {
                    var m = clazz.getMethod("getClaims");
                    Object claims = m.invoke(pObj);
                    if (claims instanceof java.util.Map) {
                        @SuppressWarnings("unchecked")
                        var map = (java.util.Map<String, Object>) claims;
                        Object maybe = map.get("maNhanVien");
                        if (maybe == null)
                            maybe = map.get("staffId");
                        if (maybe != null) {
                            try {
                                principalNumeric = Integer.valueOf(String.valueOf(maybe));
                            } catch (Exception ex) {
                            }
                        }
                    }
                } catch (NoSuchMethodException ignore) {
                }
            } catch (Exception ex) {
                // logger.debug("Failed to introspect principal for numeric id on disconnect:
                // {}", ex.getMessage());
            }

            NhanVien staff = null;
            if (principalNumeric != null) {
                staff = nhanVienRepository.findById(principalNumeric).orElse(null);
            }
            if (staff == null && principalName != null) {
                try {
                    var tkOpt = taiKhoanRepository.findByTenDangNhap(principalName);
                    if (tkOpt.isPresent()) {
                        staff = nhanVienRepository.findByTaiKhoan(tkOpt.get()).orElse(null);
                    }
                } catch (Exception e) {
                    // logger.debug("presence disconnect: error resolving TaiKhoan for
                    // principalName={}: {}", principalName, e.getMessage());
                }
            }

            if (staff == null) {
                // logger.debug("WebSocket disconnect: authenticated principal is not a staff or
                // cannot be resolved: {}", principalName);
                return;
            }

            StaffSession ss = staffSessionRepository.findById(staff.getMaNhanVien()).orElse(null);
            if (ss != null) {
                ss.setIsOnline(false);
                ss.setLastPing(LocalDateTime.now());
                staffSessionRepository.save(ss);
            }
        } catch (Exception e) {
            logger.error("WebSocketPresence: error handling disconnect event: {}", e.getMessage(), e);
        }
    }
}
