package com.noithat.qlnt.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.noithat.qlnt.backend.entity.ThuocTinh;

@Repository
public interface ThuocTinhRepository extends JpaRepository<ThuocTinh, Integer> {
    Optional<ThuocTinh> findByTenThuocTinh(String tenThuocTinh);
    boolean existsByTenThuocTinh(String tenThuocTinh);
}