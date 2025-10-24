package com.noithat.qlnt.backend.service;

import java.math.BigDecimal;

public interface CauHinhService {
    String getString(String key, String defaultValue);
    BigDecimal getDecimal(String key, BigDecimal defaultValue);
    Integer getInt(String key, Integer defaultValue);
}
