package com.noithat.qlnt.backend.service.impl;

import com.noithat.qlnt.backend.entity.DanhGiaSanPham;
import com.noithat.qlnt.backend.entity.KhachHang;
import com.noithat.qlnt.backend.repository.DanhGiaSanPhamRepository;
import com.noithat.qlnt.backend.repository.KhachHangRepository;
import com.noithat.qlnt.backend.repository.SanPhamRepository;
import com.noithat.qlnt.backend.service.IDanhGiaSanPhamService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DanhGiaSanPhamServiceImpl implements IDanhGiaSanPhamService {

    private final DanhGiaSanPhamRepository danhGiaRepo;
    private final KhachHangRepository khachHangRepo;
    private final SanPhamRepository sanPhamRepo;

    public DanhGiaSanPhamServiceImpl(DanhGiaSanPhamRepository danhGiaRepo,
                                     KhachHangRepository khachHangRepo,
                                     SanPhamRepository sanPhamRepo) {
        this.danhGiaRepo = danhGiaRepo;
        this.khachHangRepo = khachHangRepo;
        this.sanPhamRepo = sanPhamRepo;
    }

    @Override
    @Transactional
    public DanhGiaSanPham create(DanhGiaSanPham danhGia) {
        // validate product and customer exist
        if (danhGia.getSanPham() == null || danhGia.getKhachHang() == null) {
            throw new IllegalArgumentException("Product and customer are required");
        }
        sanPhamRepo.findById(danhGia.getSanPham().getMaSanPham())
                .orElseThrow(() -> new IllegalArgumentException("Product not found"));

        KhachHang kh = khachHangRepo.findById(danhGia.getKhachHang().getMaKhachHang())
                .orElseThrow(() -> new IllegalArgumentException("Customer not found"));

        danhGia.setKhachHang(kh);
        danhGia.setNgayTao(LocalDateTime.now());
        danhGia.setNgayCapNhat(LocalDateTime.now());
        return danhGiaRepo.save(danhGia);
    }

    @Override
    @Transactional
    public DanhGiaSanPham update(Integer maDanhGia, DanhGiaSanPham capNhat, Integer currentKhachHangId) {
        DanhGiaSanPham exist = danhGiaRepo.findById(maDanhGia)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));

        if (!exist.getKhachHang().getMaKhachHang().equals(currentKhachHangId)) {
            throw new SecurityException("Not allowed to edit this review");
        }

        if (capNhat.getDiem() != null) exist.setDiem(capNhat.getDiem());
        if (capNhat.getTieuDe() != null) exist.setTieuDe(capNhat.getTieuDe());
        if (capNhat.getNoiDung() != null) exist.setNoiDung(capNhat.getNoiDung());
        exist.setNgayCapNhat(LocalDateTime.now());
        return danhGiaRepo.save(exist);
    }

    @Override
    @Transactional
    public void delete(Integer maDanhGia, Integer currentKhachHangId) {
        DanhGiaSanPham exist = danhGiaRepo.findById(maDanhGia)
                .orElseThrow(() -> new IllegalArgumentException("Review not found"));
        if (!exist.getKhachHang().getMaKhachHang().equals(currentKhachHangId)) {
            throw new SecurityException("Not allowed to delete this review");
        }
        danhGiaRepo.delete(exist);
    }

    @Override
    public List<DanhGiaSanPham> getByProduct(Integer maSanPham) {
        return danhGiaRepo.findBySanPham_MaSanPham(maSanPham);
    }

    @Override
    public Double getAverageRating(Integer maSanPham) {
        Double avg = danhGiaRepo.findAverageByProductId(maSanPham);
        return avg == null ? 0.0 : avg;
    }

    @Override
    public Long getReviewCount(Integer maSanPham) {
        Long count = danhGiaRepo.countByProductId(maSanPham);
        return count == null ? 0L : count;
    }
}
