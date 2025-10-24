package com.noithat.qlnt.backend.service.impl;

import com.noithat.qlnt.backend.dto.common.VipBenefitDto;
import com.noithat.qlnt.backend.entity.HangThanhVien;
import com.noithat.qlnt.backend.entity.VipBenefit;
import com.noithat.qlnt.backend.repository.HangThanhVienRepository;
import com.noithat.qlnt.backend.repository.VipBenefitRepository;
import com.noithat.qlnt.backend.service.IVipBenefitService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class VipBenefitServiceImpl implements IVipBenefitService {

    private final VipBenefitRepository vipBenefitRepository;
    private final HangThanhVienRepository hangThanhVienRepository;

    @Override
    public List<VipBenefitDto> findByHangThanhVien(Integer maHangThanhVien) {
        HangThanhVien hang = hangThanhVienRepository.findById(maHangThanhVien).orElse(null);
        if (hang == null) return List.of();
        List<VipBenefit> list = vipBenefitRepository.findByHangThanhVien(hang);
        return list.stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public VipBenefitDto save(VipBenefitDto dto) {
        HangThanhVien hang = hangThanhVienRepository.findById(dto.getMaHangThanhVien()).orElse(null);
        VipBenefit entity = VipBenefit.builder()
                .maVipBenefit(dto.getMaVipBenefit())
                .hangThanhVien(hang)
                .benefitType(dto.getBenefitType())
                .params(dto.getParams())
                .description(dto.getDescription())
                .active(dto.getActive() == null ? true : dto.getActive())
                .build();
        VipBenefit saved = vipBenefitRepository.save(entity);
        return toDto(saved);
    }

    @Override
    public void deleteById(Integer id) {
        vipBenefitRepository.deleteById(id);
    }

    @Override
    public List<VipBenefitDto> findAll() {
        return vipBenefitRepository.findAll().stream().map(this::toDto).collect(Collectors.toList());
    }

    @Override
    public VipBenefitDto findById(Integer id) {
        return vipBenefitRepository.findById(id).map(this::toDto).orElse(null);
    }

    private VipBenefitDto toDto(VipBenefit e) {
        if (e == null) return null;
        return VipBenefitDto.builder()
                .maVipBenefit(e.getMaVipBenefit())
                .maHangThanhVien(e.getHangThanhVien() != null ? e.getHangThanhVien().getMaHangThanhVien() : null)
                .benefitType(e.getBenefitType())
                .params(e.getParams())
                .description(e.getDescription())
                .active(e.getActive())
                .build();
    }
}
