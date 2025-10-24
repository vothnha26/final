package com.noithat.qlnt.backend.service.impl;

import com.noithat.qlnt.backend.entity.SanPham;
import com.noithat.qlnt.backend.entity.YeuThich;
import com.noithat.qlnt.backend.repository.SanPhamRepository;
import com.noithat.qlnt.backend.repository.YeuThichRepository;
import com.noithat.qlnt.backend.service.IYeuThichService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class YeuThichServiceImpl implements IYeuThichService {

    private final YeuThichRepository yeuThichRepository;
    private final SanPhamRepository sanPhamRepository;

    public YeuThichServiceImpl(YeuThichRepository yeuThichRepository, SanPhamRepository sanPhamRepository) {
        this.yeuThichRepository = yeuThichRepository;
        this.sanPhamRepository = sanPhamRepository;
    }

    @Override
    public List<YeuThich> getFavoritesForCustomer(Integer maKhachHang) {
        return yeuThichRepository.findByKhachHang_MaKhachHang(maKhachHang);
    }

    @Override
    public YeuThich addFavorite(Integer maKhachHang, Integer maSanPham) {
        // prevent duplicate
        if (yeuThichRepository.existsByKhachHang_MaKhachHangAndSanPham_MaSanPham(maKhachHang, maSanPham)) {
            return null;
        }
        SanPham sp = sanPhamRepository.findById(maSanPham).orElseThrow(() -> new IllegalArgumentException("Product not found"));
        YeuThich y = new YeuThich();
        com.noithat.qlnt.backend.entity.KhachHang kh = new com.noithat.qlnt.backend.entity.KhachHang();
        kh.setMaKhachHang(maKhachHang);
        y.setKhachHang(kh);
        y.setSanPham(sp);
        return yeuThichRepository.save(y);
    }

    @Override
    @Transactional
    public void removeFavorite(Integer maKhachHang, Integer maSanPham) {
        yeuThichRepository.deleteByKhachHang_MaKhachHangAndSanPham_MaSanPham(maKhachHang, maSanPham);
    }

    @Override
    public boolean isFavorite(Integer maKhachHang, Integer maSanPham) {
        return yeuThichRepository.existsByKhachHang_MaKhachHangAndSanPham_MaSanPham(maKhachHang, maSanPham);
    }
}
