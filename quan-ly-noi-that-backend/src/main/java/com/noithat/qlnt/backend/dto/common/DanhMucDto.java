package com.noithat.qlnt.backend.dto.common;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record DanhMucDto(String tenDanhMuc, String moTa) {}
