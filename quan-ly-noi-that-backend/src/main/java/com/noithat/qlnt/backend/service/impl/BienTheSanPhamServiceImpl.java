package com.noithat.qlnt.backend.service.impl;

import com.noithat.qlnt.backend.dto.request.BienTheRequestDto;
import com.noithat.qlnt.backend.dto.request.BienTheUpdateRequestDto;
import com.noithat.qlnt.backend.dto.request.BienThePatchRequestDto;
import com.noithat.qlnt.backend.dto.response.BienTheSanPhamDetailResponse;
import com.noithat.qlnt.backend.entity.BienTheGiamGia;
import com.noithat.qlnt.backend.entity.BienTheSanPham;
import com.noithat.qlnt.backend.entity.SanPham;
import com.noithat.qlnt.backend.exception.ResourceNotFoundException;
import com.noithat.qlnt.backend.repository.BienTheGiamGiaRepository;
import com.noithat.qlnt.backend.repository.BienTheSanPhamRepository;
import com.noithat.qlnt.backend.repository.BienTheThuocTinhRepository;
import com.noithat.qlnt.backend.repository.SanPhamRepository;
import com.noithat.qlnt.backend.repository.ThuocTinhRepository;
import com.noithat.qlnt.backend.service.IBienTheSanPhamService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Transactional
public class BienTheSanPhamServiceImpl implements IBienTheSanPhamService {

    private final BienTheSanPhamRepository bienTheSanPhamRepository;
    private final SanPhamRepository sanPhamRepository;
    private final BienTheThuocTinhRepository bienTheThuocTinhRepository;
    private final ThuocTinhRepository thuocTinhRepository;
    private final BienTheGiamGiaRepository bienTheGiamGiaRepository;

    public BienTheSanPhamServiceImpl(BienTheSanPhamRepository bienTheSanPhamRepository,
            SanPhamRepository sanPhamRepository,
            BienTheThuocTinhRepository bienTheThuocTinhRepository,
            ThuocTinhRepository thuocTinhRepository,
            BienTheGiamGiaRepository bienTheGiamGiaRepository) {
        this.bienTheSanPhamRepository = bienTheSanPhamRepository;
        this.sanPhamRepository = sanPhamRepository;
        this.bienTheThuocTinhRepository = bienTheThuocTinhRepository;
        this.thuocTinhRepository = thuocTinhRepository;
        this.bienTheGiamGiaRepository = bienTheGiamGiaRepository;
    } // Basic CRUD from interface

    @Override
    @Transactional(readOnly = true)
    public List<BienTheSanPham> getAll() {
        return bienTheSanPhamRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public BienTheSanPham getById(Integer id) {
        return bienTheSanPhamRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Biến thể không tồn tại: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BienTheSanPham> getBySanPhamId(Integer maSanPham) {
        return bienTheSanPhamRepository.findBySanPham_MaSanPham(maSanPham);
    }

    @Override
    @Transactional
    public BienTheSanPham create(BienTheSanPham bienThe) {
        if (bienThe.getSku() != null && bienTheSanPhamRepository.existsBySku(bienThe.getSku())) {
            throw new IllegalArgumentException("SKU đã tồn tại: " + bienThe.getSku());
        }
        if (bienThe.getNgayCapNhatKho() == null)
            bienThe.setNgayCapNhatKho(LocalDateTime.now());
        return bienTheSanPhamRepository.save(bienThe);
    }

    @Override
    @Transactional
    public BienTheSanPham update(Integer id, BienTheSanPham bienThe) {
        BienTheSanPham existing = getById(id);
        if (bienThe.getSku() != null && !Objects.equals(existing.getSku(), bienThe.getSku())) {
            if (bienTheSanPhamRepository.existsBySku(bienThe.getSku())) {
                throw new IllegalArgumentException("SKU đã tồn tại: " + bienThe.getSku());
            }
            existing.setSku(bienThe.getSku());
        }

        if (bienThe.getGiaBan() != null)
            existing.setGiaBan(bienThe.getGiaBan());
        if (bienThe.getGiaMua() != null)
            existing.setGiaMua(bienThe.getGiaMua());
        if (bienThe.getSoLuongTon() != null)
            existing.setSoLuongTon(bienThe.getSoLuongTon());
        if (bienThe.getMucTonToiThieu() != null)
            existing.setMucTonToiThieu(bienThe.getMucTonToiThieu());
        if (bienThe.getTrangThaiKho() != null)
            existing.setTrangThaiKho(bienThe.getTrangThaiKho());

        existing.setNgayCapNhatKho(LocalDateTime.now());

        return bienTheSanPhamRepository.save(existing);
    }

    @Override
    @Transactional
    public void delete(Integer id) {
        if (!bienTheSanPhamRepository.existsById(id)) {
            throw new ResourceNotFoundException("Biến thể không tồn tại: " + id);
        }
        // remove attribute links
        bienTheThuocTinhRepository.deleteByBienTheSanPham_MaBienThe(id);
        bienTheSanPhamRepository.deleteById(id);
    }

    // Additional helper methods used by controller
    @Transactional
    public BienTheSanPham createBienTheSanPham(Integer maSanPham, BienTheRequestDto request) {
        if (request == null)
            throw new IllegalArgumentException("Request không được null");
        // validate product
        SanPham sp = sanPhamRepository.findById(maSanPham)
                .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại: " + maSanPham));

        if (bienTheSanPhamRepository.existsBySku(request.sku())) {
            throw new IllegalArgumentException("SKU đã tồn tại: " + request.sku());
        }

        BienTheSanPham bt = new BienTheSanPham();
        bt.setSanPham(sp);
        bt.setSku(request.sku());
        bt.setGiaMua(request.giaMua());
        bt.setGiaBan(request.giaBan());
        bt.setSoLuongTon(request.soLuongTon() != null ? request.soLuongTon() : 0);
        if (request.mucTonToiThieu() != null)
            bt.setMucTonToiThieu(request.mucTonToiThieu());
        if (request.trangThaiKho() != null)
            bt.setTrangThaiKho(request.trangThaiKho());
        bt.setNgayCapNhatKho(LocalDateTime.now());

        BienTheSanPham saved = bienTheSanPhamRepository.save(bt);
        // If free-text attribute mappings are provided, create BienTheThuocTinh entries
        if (request.thuocTinhGiaTriTuDo() != null && !request.thuocTinhGiaTriTuDo().isEmpty()) {
            request.thuocTinhGiaTriTuDo().forEach(mapping -> {
                // resolve attribute
                thuocTinhRepository.findById(mapping.maThuocTinh()).ifPresent(tt -> {
                    com.noithat.qlnt.backend.entity.BienTheThuocTinh btt = new com.noithat.qlnt.backend.entity.BienTheThuocTinh();
                    btt.setBienTheSanPham(saved);
                    btt.setThuocTinh(tt);
                    btt.setGiaTri(mapping.giaTri());
                    bienTheThuocTinhRepository.save(btt);
                    saved.getBienTheThuocTinhs().add(btt);
                });
            });
        }
        return saved;
    }

    @Transactional(readOnly = true)
    public List<BienTheSanPham> getBienTheBySanPhamId(Integer productId) {
        return getBySanPhamId(productId);
    }

    @Transactional
    public BienTheSanPham updateBienTheSanPham(Integer id, BienTheUpdateRequestDto request) {
        BienTheSanPham existing = getById(id);

        if (!Objects.equals(existing.getSku(), request.sku()) && bienTheSanPhamRepository.existsBySku(request.sku())) {
            throw new IllegalArgumentException("SKU đã tồn tại: " + request.sku());
        }

        existing.setSku(request.sku());
        existing.setGiaMua(request.giaMua());
        existing.setGiaBan(request.giaBan());
        existing.setSoLuongTon(request.soLuongTon());
        if (request.trangThaiKho() != null) {
            existing.setTrangThaiKho(request.trangThaiKho());
        }
        existing.setNgayCapNhatKho(LocalDateTime.now());

        // handle textual attribute mappings: delete existing attribute links and
        // recreate from request
        if (request.thuocTinhGiaTriTuDo() != null && !request.thuocTinhGiaTriTuDo().isEmpty()) {
            // remove existing
            bienTheThuocTinhRepository.deleteByBienTheSanPham_MaBienThe(existing.getMaBienThe());
            existing.getBienTheThuocTinhs().clear();
            // create new ones
            request.thuocTinhGiaTriTuDo().forEach(mapping -> {
                thuocTinhRepository.findById(mapping.maThuocTinh()).ifPresent(tt -> {
                    com.noithat.qlnt.backend.entity.BienTheThuocTinh btt = new com.noithat.qlnt.backend.entity.BienTheThuocTinh();
                    btt.setBienTheSanPham(existing);
                    btt.setThuocTinh(tt);
                    btt.setGiaTri(mapping.giaTri());
                    bienTheThuocTinhRepository.save(btt);
                    existing.getBienTheThuocTinhs().add(btt);
                });
            });
        }

        return bienTheSanPhamRepository.save(existing);
    }

    @Transactional
    public void deleteBienTheSanPham(Integer id) {
        delete(id);
    }

    @Transactional
    public BienTheSanPham patchBienTheSanPham(Integer id, BienThePatchRequestDto request) {
        BienTheSanPham existing = getById(id);

        // Only update fields that are provided (non-null)
        if (request.giaMua() != null) {
            existing.setGiaMua(request.giaMua());
        }
        
        if (request.giaBan() != null) {
            existing.setGiaBan(request.giaBan());
        }
        
        if (request.trangThaiKho() != null) {
            existing.setTrangThaiKho(request.trangThaiKho());
        }

        // Handle attribute updates if provided
        if (request.thuocTinhGiaTriTuDo() != null && !request.thuocTinhGiaTriTuDo().isEmpty()) {
            // Remove existing attribute mappings
            bienTheThuocTinhRepository.deleteByBienTheSanPham_MaBienThe(existing.getMaBienThe());
            existing.getBienTheThuocTinhs().clear();
            
            // Create new attribute mappings
            request.thuocTinhGiaTriTuDo().forEach(mapping -> {
                thuocTinhRepository.findById(mapping.maThuocTinh()).ifPresent(tt -> {
                    com.noithat.qlnt.backend.entity.BienTheThuocTinh btt = new com.noithat.qlnt.backend.entity.BienTheThuocTinh();
                    btt.setBienTheSanPham(existing);
                    btt.setThuocTinh(tt);
                    btt.setGiaTri(mapping.giaTri());
                    bienTheThuocTinhRepository.save(btt);
                    existing.getBienTheThuocTinhs().add(btt);
                });
            });
        }

        return bienTheSanPhamRepository.save(existing);
    }

    @Transactional
    public BienTheSanPham updateSoLuongTon(Integer id, Integer soLuong) {
        BienTheSanPham existing = getById(id);
        if (soLuong == null)
            throw new IllegalArgumentException("Số lượng không được null");
        existing.setSoLuongTon(soLuong);
        existing.setNgayCapNhatKho(LocalDateTime.now());
        // update trạng thái kho
        // use entity helper by updating stock with difference if needed
        bienTheSanPhamRepository.save(existing);
        return existing;
    }

    @Transactional(readOnly = true)
    public boolean checkTonKho(Integer id, Integer soLuong) {
        if (soLuong == null)
            throw new IllegalArgumentException("Số lượng không được null");
        Integer available = bienTheSanPhamRepository.getAvailableQuantity(id);
        if (available == null)
            return false;
        return available >= soLuong;
    }

    @Transactional(readOnly = true)
    public BienTheSanPham findBySku(String sku) {
        return bienTheSanPhamRepository.findBySku(sku)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy biến thể với SKU: " + sku));
    }

    @Transactional(readOnly = true)
    public BienTheSanPhamDetailResponse getBienTheSanPhamDetail(Integer id) {
        BienTheSanPham bt = getById(id);

        // Map attributes
        List<BienTheSanPhamDetailResponse.ThuocTinhBienTheResponse> thuocTinhs = bienTheThuocTinhRepository
                .findByBienTheSanPham_MaBienThe(id)
                .stream()
                .map(btt -> BienTheSanPhamDetailResponse.ThuocTinhBienTheResponse.builder()
                        .maThuocTinh(btt.getThuocTinh() != null ? btt.getThuocTinh().getMaThuocTinh() : null)
                        .tenThuocTinh(btt.getThuocTinh() != null ? btt.getThuocTinh().getTenThuocTinh() : null)
                        .maGiaTriThuocTinh(null)
                        .giaTriThuocTinh(btt.getGiaTri())
                        .build())
                .collect(Collectors.toList());

        // Map current variant-level discounts (if any)
        List<BienTheGiamGia> giamGias = bienTheGiamGiaRepository
                .findByBienTheSanPham_MaBienThe(bt.getMaBienThe());
        List<BienTheSanPhamDetailResponse.GiamGiaHienTaiResponse> giamGiaResponses = giamGias.stream()
                .map(btg -> BienTheSanPhamDetailResponse.GiamGiaHienTaiResponse.builder()
                        .maChuongTrinhGiamGia(btg.getChuongTrinhGiamGia() != null
                                ? btg.getChuongTrinhGiamGia().getMaChuongTrinhGiamGia()
                                : null)
                        .tenChuongTrinh(
                                btg.getChuongTrinhGiamGia() != null ? btg.getChuongTrinhGiamGia().getTenChuongTrinh()
                                        : null)
                        .giaSauGiam(btg.getGiaSauGiam())
                        .phanTramGiam(
                                btg.getChuongTrinhGiamGia() != null ? btg.getChuongTrinhGiamGia().getGiaTriGiam()
                                        : null)
                        .build())
                .collect(Collectors.toList());

        BigDecimal bestPrice = giamGiaResponses.stream()
                .map(BienTheSanPhamDetailResponse.GiamGiaHienTaiResponse::getGiaSauGiam)
                .filter(Objects::nonNull)
                .min(BigDecimal::compareTo)
                .orElse(bt.getGiaBan());

        return BienTheSanPhamDetailResponse.builder()
                .maBienThe(bt.getMaBienThe())
                .sku(bt.getSku())
                .giaBan(bt.getGiaBan())
                .soLuongTon(bt.getSoLuongTon())
                .maSanPham(bt.getSanPham() != null ? bt.getSanPham().getMaSanPham() : null)
                .tenSanPham(bt.getSanPham() != null ? bt.getSanPham().getTenSanPham() : null)
                .thuocTinhs(thuocTinhs)
                .giaTotNhat(bestPrice)
                .giamGias(giamGiaResponses)
                .build();
    }

    /**
     * Delete a single BienTheThuocTinh mapping by its id.
     * This is a small helper to support frontend requests that want to remove
     * an individual variant->attribute mapping without deleting the whole variant.
     */
    @Transactional
    public void deleteBienTheThuocTinhById(Integer id) {
        if (id == null)
            throw new IllegalArgumentException("Id mapping không được null");
        if (!bienTheThuocTinhRepository.existsById(id)) {
            throw new ResourceNotFoundException("Mapping BienTheThuocTinh không tồn tại: " + id);
        }
        bienTheThuocTinhRepository.deleteById(id);
    }

    /**
     * Add a single attribute mapping to a variant.
     */
    @Transactional
    public com.noithat.qlnt.backend.entity.BienTheThuocTinh addAttributeToVariant(
            Integer variantId, 
            com.noithat.qlnt.backend.dto.request.ThuocTinhGiaTriTuDoDto request) {
        
        // Get the variant
        BienTheSanPham variant = getById(variantId);
        
        // Get the attribute
        com.noithat.qlnt.backend.entity.ThuocTinh thuocTinh = thuocTinhRepository.findById(request.maThuocTinh())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy thuộc tính với ID: " + request.maThuocTinh()));
        
        // Create new mapping
        com.noithat.qlnt.backend.entity.BienTheThuocTinh mapping = new com.noithat.qlnt.backend.entity.BienTheThuocTinh();
        mapping.setBienTheSanPham(variant);
        mapping.setThuocTinh(thuocTinh);
        mapping.setGiaTri(request.giaTri());
        
        return bienTheThuocTinhRepository.save(mapping);
    }

    /**
     * Update the value of an existing attribute mapping.
     */
    @Transactional
    public com.noithat.qlnt.backend.entity.BienTheThuocTinh updateAttributeValue(
            Integer mappingId, 
            String newValue) {
        
        com.noithat.qlnt.backend.entity.BienTheThuocTinh mapping = bienTheThuocTinhRepository.findById(mappingId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy ánh xạ thuộc tính với ID: " + mappingId));
        
        mapping.setGiaTri(newValue);
        return bienTheThuocTinhRepository.save(mapping);
    }

    // helper to compute price after discount (very small utility)
    private BigDecimal calculatePriceAfterDiscount(BigDecimal basePrice, String loaiGiamGia, BigDecimal giaTri) {
        if (basePrice == null)
            return null;
        if (loaiGiamGia == null || giaTri == null)
            return basePrice;
        try {
            if ("PERCENTAGE".equalsIgnoreCase(loaiGiamGia)) {
                BigDecimal factor = BigDecimal.ONE.subtract(giaTri.divide(BigDecimal.valueOf(100)));
                return basePrice.multiply(factor);
            } else { // assume FIXED
                return basePrice.subtract(giaTri);
            }
        } catch (Exception e) {
            return basePrice;
        }
    }
}
