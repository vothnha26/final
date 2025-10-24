package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.dto.response.ThongBaoResponse;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class ThongBaoWebSocketController {
    // Client gửi tới /app/thong-bao, server broadcast tới /topic/thong-bao/all
    @MessageMapping("/thong-bao")
    @SendTo("/topic/thong-bao/all")
    public ThongBaoResponse broadcastThongBao(ThongBaoResponse thongBao) {
        // Có thể kiểm tra/thao tác thêm ở đây
        return thongBao;
    }
    // Nếu muốn gửi riêng cho khách hàng, có thể dùng SimpMessagingTemplate ở ThongBaoController
}
