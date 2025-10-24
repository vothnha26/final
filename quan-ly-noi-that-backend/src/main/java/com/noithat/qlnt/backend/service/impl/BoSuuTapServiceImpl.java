package com.noithat.qlnt.backend.service.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.noithat.qlnt.backend.dto.common.BoSuuTapDto;
import com.noithat.qlnt.backend.entity.BoSuuTap;
import com.noithat.qlnt.backend.entity.SanPham;
import com.noithat.qlnt.backend.repository.BoSuuTapRepository;
import com.noithat.qlnt.backend.repository.SanPhamRepository;
import com.noithat.qlnt.backend.service.IBoSuuTapService;

import jakarta.persistence.EntityNotFoundException;

@Service
public class BoSuuTapServiceImpl implements IBoSuuTapService {
    @Autowired
    private BoSuuTapRepository boSuuTapRepository;
    @Autowired
    private SanPhamRepository sanPhamRepository;

    public List<BoSuuTap> getAll() {
        return boSuuTapRepository.findAll();
    }

    public BoSuuTap create(BoSuuTapDto dto) {
        BoSuuTap bst = new BoSuuTap();
        bst.setTenBoSuuTap(dto.tenBoSuuTap());
        bst.setMoTa(dto.moTa());
        return boSuuTapRepository.save(bst);
    }

    public BoSuuTap update(Integer id, BoSuuTapDto dto) {
        BoSuuTap bst = boSuuTapRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bộ sưu tập với id: " + id));

        bst.setTenBoSuuTap(dto.tenBoSuuTap());
        bst.setMoTa(dto.moTa());
        return boSuuTapRepository.save(bst);
    }

    @Transactional
    public void delete(Integer id) {
        if (!boSuuTapRepository.existsById(id)) {
            throw new EntityNotFoundException("Không tìm thấy bộ sưu tập với id: " + id);
        }
        // Nullify FK from products before deleting the collection
        List<SanPham> products = sanPhamRepository.findByBoSuuTap_MaBoSuuTap(id);
        if (!products.isEmpty()) {
            for (SanPham sp : products) {
                sp.setBoSuuTap(null);
            }
            sanPhamRepository.saveAll(products);
        }
        boSuuTapRepository.deleteById(id);
    }

    public void addProductToCollection(Integer collectionId, Integer productId) {
        BoSuuTap bst = boSuuTapRepository.findById(collectionId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bộ sưu tập: " + collectionId));
        SanPham sp = sanPhamRepository.findById(productId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy sản phẩm: " + productId));

        // Set bộ sưu tập cho sản phẩm (quan hệ 1-N)
        sp.setBoSuuTap(bst);
        sanPhamRepository.save(sp);
    }

    public void removeProductFromCollection(Integer collectionId, Integer productId) {
        SanPham sp = sanPhamRepository.findById(productId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy sản phẩm: " + productId));

        // Kiểm tra sản phẩm có thuộc bộ sưu tập này không
        if (sp.getBoSuuTap() == null || !sp.getBoSuuTap().getMaBoSuuTap().equals(collectionId)) {
            throw new IllegalArgumentException("Sản phẩm không thuộc bộ sưu tập này");
        }

        // Xóa bộ sưu tập khỏi sản phẩm
        sp.setBoSuuTap(null);
        sanPhamRepository.save(sp);
    }

    public List<SanPham> getProductsInCollection(Integer collectionId) {
        // Kiểm tra bộ sưu tập có tồn tại không
        if (!boSuuTapRepository.existsById(collectionId)) {
            throw new EntityNotFoundException("Không tìm thấy bộ sưu tập: " + collectionId);
        }

        // Tìm tất cả sản phẩm thuộc bộ sưu tập này
        return sanPhamRepository.findByBoSuuTap_MaBoSuuTap(collectionId);
    }

    public BoSuuTap getById(Integer id) {
        return boSuuTapRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bộ sưu tập với id: " + id));
    }
}
