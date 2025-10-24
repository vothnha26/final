package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.dto.request.EmailSendRequest;
import com.noithat.qlnt.backend.dto.response.EmailSendResponse;
import com.noithat.qlnt.backend.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller quản lý gửi email marketing/campaign
 */
@RestController
@RequestMapping("/api/admin/emails")
@RequiredArgsConstructor
public class EmailController {

    private final EmailService emailService;

    /**
     * Gửi email marketing/campaign đến khách hàng
     * POST /api/admin/emails/send
     */
    @PostMapping("/send")
    // @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')") // Disabled for development
    public ResponseEntity<EmailSendResponse> sendMarketingEmail(@Valid @RequestBody EmailSendRequest request) {
        try {
            EmailSendResponse response = emailService.sendMarketingEmail(request);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
            // Lỗi validation
            EmailSendResponse errorResponse = new EmailSendResponse(
                false, 
                e.getMessage(), 
                0, 
                0
            );
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            e.printStackTrace();
            // Lỗi hệ thống
            EmailSendResponse errorResponse = new EmailSendResponse(
                false, 
                "Lỗi hệ thống: " + e.getMessage(), 
                0, 
                0
            );
            return ResponseEntity.internalServerError().body(errorResponse);
        }
    }
}
