package com.noithat.qlnt.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * DTO for partial updates to SanPham via PATCH.
 * All fields are optional. Only non-null fields will be updated.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record SanPhamPatchRequestDto(
    String trangThai  // ACTIVE, INACTIVE, DISCONTINUED
) {}
