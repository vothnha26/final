package com.noithat.qlnt.backend.dto.common;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record NhaCungCapDto(String tenNhaCungCap) {}
