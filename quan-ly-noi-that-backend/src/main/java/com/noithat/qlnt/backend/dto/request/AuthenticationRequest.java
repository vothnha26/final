package com.noithat.qlnt.backend.dto.request;

import com.fasterxml.jackson.annotation.JsonAlias;
import lombok.Data;

@Data
public class AuthenticationRequest {
    private String tenDangNhap;
    @JsonAlias({"matKhau", "password"})
    private String password;
}
