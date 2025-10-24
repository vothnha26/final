package com.noithat.qlnt.backend.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmailSendResponse {
    
    private boolean success;
    private String message;
    private int totalSent; // Tổng số email đã gửi
    private int totalFailed; // Tổng số email gửi thất bại
}
