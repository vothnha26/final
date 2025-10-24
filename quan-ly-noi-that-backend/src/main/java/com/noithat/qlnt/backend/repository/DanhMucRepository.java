package com.noithat.qlnt.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.noithat.qlnt.backend.entity.DanhMuc;

@Repository
public interface DanhMucRepository extends JpaRepository<DanhMuc, Integer> {
    // Không cần các hàm tìm theo cha/con ở đây nữa
}