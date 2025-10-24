package com.noithat.qlnt.backend.repository;

import com.noithat.qlnt.backend.entity.CauHinhHeThong;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CauHinhHeThongRepository extends JpaRepository<CauHinhHeThong, String> {
    @Query("SELECT c.configValue FROM CauHinhHeThong c WHERE c.configKey = :configKey")
    String findConfigValueByKey(@Param("configKey") String configKey);
}
