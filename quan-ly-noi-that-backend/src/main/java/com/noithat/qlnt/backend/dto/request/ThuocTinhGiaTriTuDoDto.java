package com.noithat.qlnt.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotNull;

/**
 * Represents a free-text attribute value mapping sent from the frontend when creating/updating variants.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record ThuocTinhGiaTriTuDoDto(
        @NotNull Integer maThuocTinh,
        @NotNull String giaTri
) {}
