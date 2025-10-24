package com.noithat.qlnt.backend.repository;

import com.noithat.qlnt.backend.entity.VipBenefit;
import com.noithat.qlnt.backend.entity.HangThanhVien;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface VipBenefitRepository extends JpaRepository<VipBenefit, Integer> {
    List<VipBenefit> findByHangThanhVien(HangThanhVien hangThanhVien);
}
