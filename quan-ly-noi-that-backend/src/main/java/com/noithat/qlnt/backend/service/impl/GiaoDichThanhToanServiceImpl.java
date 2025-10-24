package com.noithat.qlnt.backend.service.impl;

import com.noithat.qlnt.backend.dto.request.GiaoDichThanhToanRequest;
import com.noithat.qlnt.backend.dto.response.GiaoDichThanhToanResponse;
import com.noithat.qlnt.backend.entity.DonHang;
import com.noithat.qlnt.backend.entity.GiaoDichThanhToan;
import com.noithat.qlnt.backend.repository.DonHangRepository;
import com.noithat.qlnt.backend.repository.GiaoDichThanhToanRepository;
import com.noithat.qlnt.backend.service.IGiaoDichThanhToanService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class GiaoDichThanhToanServiceImpl implements IGiaoDichThanhToanService {

    private final GiaoDichThanhToanRepository giaoDichRepo;
    private final DonHangRepository donHangRepo;

    @Override
    public List<GiaoDichThanhToanResponse> getByDonHang(Integer maDonHang) {
        return giaoDichRepo.findByDonHang_MaDonHang(maDonHang)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public GiaoDichThanhToanResponse create(Integer maDonHang, GiaoDichThanhToanRequest request) {
        DonHang donHang = donHangRepo.findById(maDonHang)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng!"));

        GiaoDichThanhToan giaoDich = new GiaoDichThanhToan();
        giaoDich.setDonHang(donHang);
        giaoDich.setPhuongThuc(request.getPhuongThuc());
        giaoDich.setSoTien(request.getSoTien());
        giaoDich.setTrangThai(request.getTrangThai());

        giaoDichRepo.save(giaoDich);
        return toResponse(giaoDich);
    }

    private GiaoDichThanhToanResponse toResponse(GiaoDichThanhToan g) {
        GiaoDichThanhToanResponse res = new GiaoDichThanhToanResponse();
        res.setMaGiaoDich(g.getMaGiaoDich());
        res.setPhuongThuc(g.getPhuongThuc());
        res.setSoTien(g.getSoTien());
        res.setTrangThai(g.getTrangThai());
        return res;
    }
}
