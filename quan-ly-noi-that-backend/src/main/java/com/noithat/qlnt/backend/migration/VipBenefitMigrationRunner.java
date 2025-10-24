package com.noithat.qlnt.backend.migration;

import com.noithat.qlnt.backend.entity.HangThanhVien;
import com.noithat.qlnt.backend.entity.VipBenefit;
import com.noithat.qlnt.backend.repository.HangThanhVienRepository;
import com.noithat.qlnt.backend.repository.VipBenefitRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class VipBenefitMigrationRunner implements ApplicationRunner {

    private final HangThanhVienRepository hangThanhVienRepository;
    private final VipBenefitRepository vipBenefitRepository;
    private final Logger logger = LoggerFactory.getLogger(VipBenefitMigrationRunner.class);

    @Override
    public void run(ApplicationArguments args) throws Exception {
        List<HangThanhVien> all = hangThanhVienRepository.findAll();
        for (HangThanhVien hang : all) {
            try {
                // Skip if already have benefits
                List<VipBenefit> exists = vipBenefitRepository.findByHangThanhVien(hang);
                if (exists != null && !exists.isEmpty())
                    continue;

            } catch (Exception e) {
                logger.error("Migration error for hang {}: {}", hang.getMaHangThanhVien(), e.getMessage());
            }
        }
    }
}
