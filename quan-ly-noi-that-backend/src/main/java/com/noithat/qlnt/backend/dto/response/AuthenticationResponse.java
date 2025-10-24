package com.noithat.qlnt.backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthenticationResponse {
    private String token;
    private String refreshToken;
    // The role name of the authenticated account (e.g., USER, ADMIN)
    private String vaiTro;
    // The primary key id of TaiKhoan
    private Integer maTaiKhoan;
}