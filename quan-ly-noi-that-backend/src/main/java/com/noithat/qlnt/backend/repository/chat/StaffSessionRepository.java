package com.noithat.qlnt.backend.repository.chat;

import com.noithat.qlnt.backend.entity.chat.StaffSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Repository
public interface StaffSessionRepository extends JpaRepository<StaffSession, Integer> {
    List<StaffSession> findByIsOnlineTrueOrderByActiveChatsAscLastPingDesc();

    @Modifying
    @Transactional
    @Query("update StaffSession s set s.activeChats = s.activeChats + 1 where s.staffId = :id")
    int incrementActiveChats(@Param("id") Integer id);
}
