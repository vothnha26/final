package com.noithat.qlnt.backend.service.impl;

import com.noithat.qlnt.backend.dto.request.HinhAnhSanPhamRequestDto;
import com.noithat.qlnt.backend.entity.HinhAnhSanPham;
import com.noithat.qlnt.backend.entity.SanPham;
import com.noithat.qlnt.backend.repository.HinhAnhSanPhamRepository;
import com.noithat.qlnt.backend.repository.SanPhamRepository;
import com.noithat.qlnt.backend.service.IHinhAnhSanPhamService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class HinhAnhSanPhamServiceImpl implements IHinhAnhSanPhamService {

    private final HinhAnhSanPhamRepository hinhAnhRepository;
    private final SanPhamRepository sanPhamRepository;

    @Override
    public Page<HinhAnhSanPham> getAllHinhAnh(Pageable pageable) {
        return hinhAnhRepository.findAll(pageable);
    }

    @Override
    public HinhAnhSanPham getHinhAnhById(Integer id) {
        return hinhAnhRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy hình ảnh với ID: " + id));
    }

    @Override
    public List<HinhAnhSanPham> getHinhAnhBySanPham(Integer maSanPham) {
        return hinhAnhRepository.findBySanPhamMaSanPhamOrderByThuTuAsc(maSanPham);
    }

    @Override
    public HinhAnhSanPham getHinhAnhChinh(Integer maSanPham) {
        return hinhAnhRepository.findBySanPhamMaSanPhamAndLaAnhChinhTrue(maSanPham)
            .orElse(null);
    }

    @Override
    @Transactional
    public HinhAnhSanPham createHinhAnh(Integer maSanPham, HinhAnhSanPhamRequestDto request) {
        SanPham sanPham = sanPhamRepository.findById(maSanPham)
            .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với ID: " + maSanPham));

        // Nếu đây là ảnh chính, bỏ đánh dấu các ảnh chính khác
        if (Boolean.TRUE.equals(request.laAnhChinh())) {
            List<HinhAnhSanPham> existingImages = hinhAnhRepository.findBySanPhamMaSanPham(maSanPham);
            existingImages.forEach(img -> img.setLaAnhChinh(false));
            hinhAnhRepository.saveAll(existingImages);
        }

        HinhAnhSanPham hinhAnh = HinhAnhSanPham.builder()
            .sanPham(sanPham)
            .duongDanHinhAnh(request.duongDanHinhAnh())
            .thuTu(request.thuTu())
            .laAnhChinh(request.laAnhChinh())
            .moTa(request.moTa())
            .trangThai(request.trangThai())
            .build();

        return hinhAnhRepository.save(hinhAnh);
    }

    @Override
    @Transactional
    public HinhAnhSanPham updateHinhAnh(Integer id, HinhAnhSanPhamRequestDto request) {
        HinhAnhSanPham hinhAnh = getHinhAnhById(id);

        // Nếu đặt làm ảnh chính, bỏ đánh dấu các ảnh chính khác
        if (Boolean.TRUE.equals(request.laAnhChinh()) && !hinhAnh.getLaAnhChinh()) {
            List<HinhAnhSanPham> existingImages = hinhAnhRepository
                .findBySanPhamMaSanPham(hinhAnh.getSanPham().getMaSanPham());
            existingImages.forEach(img -> {
                if (!img.getMaHinhAnh().equals(id)) {
                    img.setLaAnhChinh(false);
                }
            });
            hinhAnhRepository.saveAll(existingImages);
        }

        hinhAnh.setDuongDanHinhAnh(request.duongDanHinhAnh());
        hinhAnh.setThuTu(request.thuTu());
        hinhAnh.setLaAnhChinh(request.laAnhChinh());
        hinhAnh.setMoTa(request.moTa());
        hinhAnh.setTrangThai(request.trangThai());

        return hinhAnhRepository.save(hinhAnh);
    }

    @Override
    @Transactional
    public void deleteHinhAnh(Integer id) {
        if (!hinhAnhRepository.existsById(id)) {
            throw new RuntimeException("Không tìm thấy hình ảnh với ID: " + id);
        }
        hinhAnhRepository.deleteById(id);
    }

    @Override
    @Transactional
    public HinhAnhSanPham setAsMainImage(Integer id) {
        HinhAnhSanPham hinhAnh = getHinhAnhById(id);
        
        // Bỏ đánh dấu các ảnh chính khác của cùng sản phẩm
        List<HinhAnhSanPham> existingImages = hinhAnhRepository
            .findBySanPhamMaSanPham(hinhAnh.getSanPham().getMaSanPham());
        existingImages.forEach(img -> img.setLaAnhChinh(false));
        hinhAnhRepository.saveAll(existingImages);
        
        // Đánh dấu ảnh này là ảnh chính
        hinhAnh.setLaAnhChinh(true);
        return hinhAnhRepository.save(hinhAnh);
    }

    @Override
    @Transactional
    public HinhAnhSanPham updateThuTu(Integer id, Integer thuTu) {
        HinhAnhSanPham hinhAnh = getHinhAnhById(id);
        hinhAnh.setThuTu(thuTu);
        return hinhAnhRepository.save(hinhAnh);
    }

    @Override
    @Transactional
    public void deleteAllBySanPham(Integer maSanPham) {
        hinhAnhRepository.deleteBySanPhamMaSanPham(maSanPham);
    }
}
