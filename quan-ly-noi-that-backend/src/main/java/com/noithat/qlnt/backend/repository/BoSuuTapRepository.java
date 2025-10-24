package com.noithat.qlnt.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.noithat.qlnt.backend.entity.BoSuuTap;

@Repository
public interface BoSuuTapRepository extends JpaRepository<BoSuuTap, Integer> {
}