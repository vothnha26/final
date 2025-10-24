package com.noithat.qlnt.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmailSendRequest {
    
    @NotBlank(message = "Tiêu đề không được để trống")
    private String subject;
    
    @NotBlank(message = "Nội dung không được để trống")
    private String body;
    
    @NotBlank(message = "Loại người nhận không được để trống")
    private String recipients; // all | customers | vip | manual
    
    private List<String> manualList; // Danh sách email thủ công (khi recipients = "manual")
}
