package com.noithat.qlnt.backend.repository;

import com.noithat.qlnt.backend.entity.CauHinhHeThong;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CauHinhRepository extends JpaRepository<CauHinhHeThong, String> {
    Optional<CauHinhHeThong> findByConfigKey(String configKey);
}
