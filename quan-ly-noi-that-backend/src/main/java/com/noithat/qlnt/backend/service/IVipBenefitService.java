package com.noithat.qlnt.backend.service;

import com.noithat.qlnt.backend.dto.common.VipBenefitDto;
import java.util.List;

public interface IVipBenefitService {
    List<VipBenefitDto> findByHangThanhVien(Integer maHangThanhVien);
    VipBenefitDto save(VipBenefitDto dto);
    void deleteById(Integer id);
    List<VipBenefitDto> findAll();
    VipBenefitDto findById(Integer id);
}
