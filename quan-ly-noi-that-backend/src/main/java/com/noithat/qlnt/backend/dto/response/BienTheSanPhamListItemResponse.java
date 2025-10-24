package com.noithat.qlnt.backend.dto.response;

import com.noithat.qlnt.backend.dto.request.ThuocTinhGiaTriTuDoDto;
import java.math.BigDecimal;
import java.util.List;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record BienTheSanPhamListItemResponse(
        Integer maBienThe,
        String sku,
        String tenBienThe,
        BigDecimal giaMua,
        BigDecimal giaBan,
        Integer soLuongTon,
        List<Integer> bienTheThuocTinhIds,
        List<ThuocTinhGiaTriTuDoDto> thuocTinhGiaTriTuDo
) {}
