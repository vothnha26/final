package com.noithat.qlnt.backend.service.chat;

import com.noithat.qlnt.backend.entity.KhachHang;
import com.noithat.qlnt.backend.entity.chat.ChatMessage;
import com.noithat.qlnt.backend.entity.chat.ChatSession;

public interface ChatService {
    ChatSession startSession(KhachHang customer, String firstMessage);
    ChatMessage saveMessage(Integer sessionId, String senderType, Integer senderId, String content);
    void endSession(Integer sessionId);
}
