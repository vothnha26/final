package com.noithat.qlnt.backend.service;

import com.noithat.qlnt.backend.dto.request.EmailSendRequest;
import com.noithat.qlnt.backend.dto.response.EmailSendResponse;
import com.noithat.qlnt.backend.entity.KhachHang;
import com.noithat.qlnt.backend.repository.KhachHangRepository;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final KhachHangRepository khachHangRepository;

    public void sendOtpEmail(String to, String otp) throws MessagingException {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, "utf-8");

        String htmlMsg = "<h3>Mã OTP của bạn là: " + otp + "</h3>"
                + "<p>Mã này sẽ hết hạn sau 5 phút.</p>";

        helper.setText(htmlMsg, true);
        helper.setTo(to);
        helper.setSubject("Xác thực tài khoản của bạn");
        helper.setFrom("thanhlocys@gmail.com"); // Thay email của bạn vào đây

        mailSender.send(mimeMessage);
    }

    /**
     * Gửi email marketing/campaign đến nhiều khách hàng
     */
    public EmailSendResponse sendMarketingEmail(EmailSendRequest request) {
        // Validate request
        if (request.getSubject() == null || request.getSubject().trim().isEmpty()) {
            throw new IllegalArgumentException("Tiêu đề email không được để trống");
        }
        if (request.getBody() == null || request.getBody().trim().isEmpty()) {
            throw new IllegalArgumentException("Nội dung email không được để trống");
        }
        if (request.getRecipients() == null || request.getRecipients().trim().isEmpty()) {
            throw new IllegalArgumentException("Loại người nhận không được để trống");
        }
        
        // Lấy danh sách email dựa trên recipients
        List<String> emailList;
        try {
            emailList = getEmailListByRecipients(request.getRecipients(), request.getManualList());
        } catch (Exception e) {
            e.printStackTrace();
            throw new IllegalArgumentException("Không thể lấy danh sách email: " + e.getMessage());
        }
        
        if (emailList.isEmpty()) {
            return new EmailSendResponse(false, "Không tìm thấy email nào để gửi", 0, 0);
        }
        
        int totalSent = 0;
        int totalFailed = 0;
        
        // Gửi email từng cái
        for (String email : emailList) {
            if (email == null || email.trim().isEmpty()) {
                totalFailed++;
                continue;
            }
            
            try {
                sendEmail(email, request.getSubject(), request.getBody());
                totalSent++;
            } catch (Exception e) {
                totalFailed++;
                e.printStackTrace();
            }
        }
        
        boolean success = totalFailed == 0;
        String message = String.format("Đã gửi %d/%d email thành công", totalSent, emailList.size());
        
        return new EmailSendResponse(success, message, totalSent, totalFailed);
    }
    
    /**
     * Lấy danh sách email dựa trên loại người nhận
     */
    private List<String> getEmailListByRecipients(String recipients, List<String> manualList) {
        List<String> emailList = new ArrayList<>();
        
        try {
            switch (recipients.toLowerCase().trim()) {
                case "all":
                    // Tất cả khách hàng
                    emailList = khachHangRepository.findAll()
                        .stream()
                        .filter(kh -> kh != null && kh.getEmail() != null && !kh.getEmail().trim().isEmpty())
                        .map(KhachHang::getEmail)
                        .collect(Collectors.toList());
                    break;
                    
                case "customers":
                    // Khách hàng đã mua (có tổng đơn hàng > 0)
                    emailList = khachHangRepository.findAll()
                        .stream()
                        .filter(kh -> kh != null 
                            && kh.getEmail() != null 
                            && !kh.getEmail().trim().isEmpty()
                            && kh.getTongDonHang() != null 
                            && kh.getTongDonHang() > 0)
                        .map(KhachHang::getEmail)
                        .collect(Collectors.toList());
                    break;
                    
                case "vip":
                    // Khách hàng VIP (trangThaiVip = true)
                    emailList = khachHangRepository.findAll()
                        .stream()
                        .filter(kh -> kh != null 
                            && kh.getEmail() != null 
                            && !kh.getEmail().trim().isEmpty()
                            && Boolean.TRUE.equals(kh.getTrangThaiVip()))
                        .map(KhachHang::getEmail)
                        .collect(Collectors.toList());
                    break;
                    
                case "manual":
                    // Danh sách thủ công
                    if (manualList != null && !manualList.isEmpty()) {
                        emailList = manualList.stream()
                            .filter(email -> email != null && !email.trim().isEmpty())
                            .collect(Collectors.toList());
                    }
                    break;
                    
                default:
                    throw new IllegalArgumentException("Loại người nhận không hợp lệ: " + recipients);
            }
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
        
        return emailList;
    }
    
    /**
     * Gửi một email đơn
     */
    private void sendEmail(String to, String subject, String body) throws Exception {
        if (to == null || to.trim().isEmpty()) {
            throw new IllegalArgumentException("Email address is empty");
        }
        
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setFrom("thanhlocys@gmail.com");
            
            // Tạo HTML content với style đẹp
            String htmlContent = "<html><body style='font-family: Arial, sans-serif;'>"
                    + "<div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;'>"
                    + "<div style='border-bottom: 3px solid #ff6b35; padding-bottom: 10px; margin-bottom: 20px;'>"
                    + "<h2 style='color: #ff6b35; margin: 0;'>Thông báo từ Furniture Shop</h2>"
                    + "</div>"
                    + "<div style='line-height: 1.6; color: #333;'>"
                    + body.replace("\n", "<br>") // Chuyển newline thành <br>
                    + "</div>"
                    + "<div style='margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #888; font-size: 12px;'>"
                    + "<p>Email này được gửi từ hệ thống quản lý nội thất.</p>"
                    + "<p>Nếu bạn có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi.</p>"
                    + "</div>"
                    + "</div>"
                    + "</body></html>";
            
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
            
        } catch (MessagingException e) {
            e.printStackTrace();
            throw new Exception("Lỗi gửi email (MessagingException): " + e.getMessage(), e);
        } catch (Exception e) {
            e.printStackTrace();
            throw new Exception("Lỗi gửi email: " + e.getMessage(), e);
        }
    }
}