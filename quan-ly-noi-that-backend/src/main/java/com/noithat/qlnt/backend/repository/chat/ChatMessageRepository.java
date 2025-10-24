package com.noithat.qlnt.backend.repository.chat;

import com.noithat.qlnt.backend.entity.chat.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Integer> {
    List<ChatMessage> findBySession_IdOrderBySentAtAsc(Integer sessionId);
}
