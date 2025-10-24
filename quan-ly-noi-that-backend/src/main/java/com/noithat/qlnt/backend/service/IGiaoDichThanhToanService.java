package com.noithat.qlnt.backend.service;

import com.noithat.qlnt.backend.dto.request.GiaoDichThanhToanRequest;
import com.noithat.qlnt.backend.dto.response.GiaoDichThanhToanResponse;
import java.util.List;

public interface IGiaoDichThanhToanService {
    List<GiaoDichThanhToanResponse> getByDonHang(Integer maDonHang);
    GiaoDichThanhToanResponse create(Integer maDonHang, GiaoDichThanhToanRequest request);
}
