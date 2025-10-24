package com.noithat.qlnt.backend.dto.common;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ThuocTinhDto(
	@JsonAlias({"tenThuocTinh", "ten_thuoc_tinh", "name", "ten"})
	@NotBlank String tenThuocTinh,
	List<String> giaTriList
) {}
