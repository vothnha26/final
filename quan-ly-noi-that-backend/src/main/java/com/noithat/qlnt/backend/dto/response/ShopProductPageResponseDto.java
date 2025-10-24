package com.noithat.qlnt.backend.dto.response;

import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopProductPageResponseDto {
    @Builder.Default
    private List<ShopProductResponseDto> items = new ArrayList<>();
    private int page;
    private int size;
    private long totalItems;
    private int totalPages;
}
