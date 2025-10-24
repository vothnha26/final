package com.noithat.qlnt.backend.service.impl;

import com.noithat.qlnt.backend.entity.CauHinhHeThong;
import com.noithat.qlnt.backend.repository.CauHinhRepository;
import com.noithat.qlnt.backend.service.CauHinhService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class CauHinhServiceImpl implements CauHinhService {

    private final CauHinhRepository cauHinhRepository;

    @Override
    public String getString(String key, String defaultValue) {
        return cauHinhRepository.findByConfigKey(key).map(CauHinhHeThong::getConfigValue).orElse(defaultValue);
    }

    @Override
    public BigDecimal getDecimal(String key, BigDecimal defaultValue) {
        String v = getString(key, null);
        if (v == null) return defaultValue;
        try {
            return new BigDecimal(v);
        } catch (Exception ex) {
            return defaultValue;
        }
    }

    @Override
    public Integer getInt(String key, Integer defaultValue) {
        String v = getString(key, null);
        if (v == null) return defaultValue;
        try {
            return Integer.parseInt(v);
        } catch (Exception ex) {
            try {
                return new BigDecimal(v).intValue();
            } catch (Exception e) {
                return defaultValue;
            }
        }
    }
}
