package com.noithat.qlnt.backend.service;

import com.noithat.qlnt.backend.dto.request.KhachHangCreationRequest;
import com.noithat.qlnt.backend.entity.KhachHang;
import java.util.List;

public interface IKhachHangService {
    List<KhachHang> getAll();
    KhachHang create(KhachHangCreationRequest request);
    KhachHang update(Integer maKhachHang, KhachHang request);
    void delete(Integer maKhachHang);
    KhachHang getKhachHangProfile(Integer maKhachHang);
    KhachHang tichDiemVaCapNhatHang(Integer maKhachHang, Integer diemThayDoi);
    // Find customer by phone number
    KhachHang findBySoDienThoai(String soDienThoai);
}
