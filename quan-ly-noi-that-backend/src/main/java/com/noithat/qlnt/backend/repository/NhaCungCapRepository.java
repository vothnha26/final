package com.noithat.qlnt.backend.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.noithat.qlnt.backend.entity.NhaCungCap;
@Repository
public interface NhaCungCapRepository extends JpaRepository<NhaCungCap, Integer> {
}
