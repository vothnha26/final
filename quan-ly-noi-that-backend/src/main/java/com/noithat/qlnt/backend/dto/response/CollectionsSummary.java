package com.noithat.qlnt.backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CollectionsSummary {
    private long totalCollections;
    private long totalProducts;
    private long averagePerCollection;
    private long emptyCollections;
}
