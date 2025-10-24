package com.noithat.qlnt.backend.service.impl;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.noithat.qlnt.backend.dto.request.BienTheRequestDto;
import com.noithat.qlnt.backend.dto.request.SanPhamRequestDto;
import com.noithat.qlnt.backend.dto.response.ProductDetailDto;
import com.noithat.qlnt.backend.entity.BienTheGiamGia;
import com.noithat.qlnt.backend.entity.BienTheSanPham;
import com.noithat.qlnt.backend.entity.BoSuuTap;
import com.noithat.qlnt.backend.entity.DanhMuc;
import com.noithat.qlnt.backend.entity.HinhAnhSanPham;
import com.noithat.qlnt.backend.entity.NhaCungCap;
import com.noithat.qlnt.backend.entity.SanPham;
import com.noithat.qlnt.backend.repository.BienTheSanPhamRepository;
import com.noithat.qlnt.backend.repository.DanhMucRepository;
import com.noithat.qlnt.backend.repository.NhaCungCapRepository;
import com.noithat.qlnt.backend.repository.SanPhamRepository;
import com.noithat.qlnt.backend.repository.HinhAnhSanPhamRepository;
import com.noithat.qlnt.backend.repository.BoSuuTapRepository;
import com.noithat.qlnt.backend.repository.DanhGiaSanPhamRepository;
import com.noithat.qlnt.backend.repository.BienTheGiamGiaRepository;
import com.noithat.qlnt.backend.service.IProductService;
import com.noithat.qlnt.backend.service.CloudinaryService;
import com.noithat.qlnt.backend.dto.response.SanPhamWithImagesResponseDto;
import com.noithat.qlnt.backend.repository.LichSuTonKhoRepository;
import com.noithat.qlnt.backend.dto.response.ProductCompareResponse;

import jakarta.persistence.EntityNotFoundException;

@Service
public class ProductServiceImpl implements IProductService {
        @Autowired
        private SanPhamRepository sanPhamRepository;
        @Autowired
        private DanhMucRepository danhMucRepository;
        @Autowired
        private NhaCungCapRepository nhaCungCapRepository;
        @Autowired
        private BienTheSanPhamRepository bienTheRepository;
        @Autowired
        private CloudinaryService cloudinaryService;
        @Autowired
        private HinhAnhSanPhamRepository hinhAnhSanPhamRepository;
        @Autowired
        private BoSuuTapRepository boSuuTapRepository;

        @Transactional
        public void removeProductFromCategory(Integer productId) {
                SanPham sp = findProductById(productId);
                sp.setDanhMuc(null);
                sanPhamRepository.save(sp);
        }

        @Autowired
        private DanhGiaSanPhamRepository danhGiaSanPhamRepository;

        private SanPham findProductById(Integer id) {
                return sanPhamRepository.findById(id)
                                .orElseThrow(() -> new EntityNotFoundException(
                                                "Không tìm thấy sản phẩm với id: " + id));
        }

        @Autowired
        private LichSuTonKhoRepository lichSuTonKhoRepository;

        @Override
        @Transactional(readOnly = true)
        public java.util.List<ProductCompareResponse> compareProductsAggregate(java.util.List<Integer> productIds) {
                if (productIds == null || productIds.isEmpty())
                        return java.util.Collections.emptyList();
                // Lấy tất cả sản phẩm cần so sánh
                List<SanPham> products = sanPhamRepository.findAllById(productIds);
                java.util.Map<Integer, ProductCompareResponse> resultMap = new java.util.HashMap<>();
                for (SanPham sp : products) {
                        resultMap.put(sp.getMaSanPham(), new ProductCompareResponse(
                                        sp.getMaSanPham(),
                                        sp.getTenSanPham(),
                                        0, // nhập
                                        0 // xuất
                        ));
                }
                // Lấy lịch sử nhập/xuất của các biến thể thuộc các sản phẩm này
                // (truy vấn tất cả lịch sử liên quan các biến thể của các sản phẩm này)
                List<BienTheSanPham> allVariants = bienTheRepository.findAllBySanPham_MaSanPhamIn(productIds);
                java.util.Set<Integer> variantIds = allVariants.stream().map(BienTheSanPham::getMaBienThe)
                                .collect(java.util.stream.Collectors.toSet());
                if (variantIds.isEmpty())
                        return new java.util.ArrayList<>(resultMap.values());
                List<com.noithat.qlnt.backend.entity.LichSuTonKho> histories = lichSuTonKhoRepository
                                .findByBienTheSanPham_MaBienTheIn(new java.util.ArrayList<>(variantIds));
                for (com.noithat.qlnt.backend.entity.LichSuTonKho ls : histories) {
                        Integer pid = ls.getBienTheSanPham().getSanPham().getMaSanPham();
                        ProductCompareResponse resp = resultMap.get(pid);
                        if (resp == null)
                                continue;
                        if (ls.getSoLuongThayDoi() > 0) {
                                resp.setTotalNhap(resp.getTotalNhap() + ls.getSoLuongThayDoi());
                        } else if (ls.getSoLuongThayDoi() < 0) {
                                resp.setTotalXuat(resp.getTotalXuat() + Math.abs(ls.getSoLuongThayDoi()));
                        }
                }
                return new java.util.ArrayList<>(resultMap.values());
        }

        @Override
        @Transactional(readOnly = true)
        public java.util.List<SanPhamWithImagesResponseDto> getAllProducts() {
                // Return products with images and timestamps to match frontend expectations
                return sanPhamRepository.findAll().stream()
                                .map(sp -> {
                                        List<HinhAnhSanPham> images = hinhAnhSanPhamRepository
                                                        .findBySanPhamMaSanPhamOrderByThuTuAsc(sp.getMaSanPham());
                                        return buildSanPhamWithImagesResponse(sp, images);
                                })
                                .collect(java.util.stream.Collectors.toList());
        }

        private ProductDetailDto mapToDto(SanPham sp) {
                ProductDetailDto.CategoryDto cat = null;
                if (sp.getDanhMuc() != null) {
                        cat = ProductDetailDto.CategoryDto.builder()
                                        .id(sp.getDanhMuc().getMaDanhMuc())
                                        .name(sp.getDanhMuc().getTenDanhMuc())
                                        .build();
                }

                ProductDetailDto.SupplierDto sup = null;
                if (sp.getNhaCungCap() != null) {
                        sup = ProductDetailDto.SupplierDto.builder()
                                        .id(sp.getNhaCungCap().getMaNhaCungCap())
                                        .name(sp.getNhaCungCap().getTenNhaCungCap())
                                        .build();
                }

                ProductDetailDto.CollectionDto col = null;
                if (sp.getBoSuuTap() != null) {
                        col = ProductDetailDto.CollectionDto.builder()
                                        .id(sp.getBoSuuTap().getMaBoSuuTap())
                                        .name(sp.getBoSuuTap().getTenBoSuuTap())
                                        .build();
                }

                java.util.List<ProductDetailDto.VariantDto> variantDtos = java.util.Optional
                                .ofNullable(sp.getBienTheList())
                                .orElseGet(java.util.Collections::emptyList)
                                .stream()
                                .map(bt -> ProductDetailDto.VariantDto.builder()
                                                .id(bt.getMaBienThe())
                                                .sku(bt.getSku())
                                                .gia(bt.getGiaBan() != null ? bt.getGiaBan().doubleValue() : null)
                                                .soLuongTon(bt.getSoLuongTon())
                                                .build())
                                .collect(java.util.stream.Collectors.toList());

                java.util.List<ProductDetailDto.ImageDto> imageDtos = java.util.Optional.ofNullable(sp.getHinhAnhList())
                                .orElseGet(java.util.Collections::emptyList)
                                .stream()
                                .map(h -> ProductDetailDto.ImageDto.builder()
                                                .id(h.getMaHinhAnh())
                                                .duongDanHinhAnh(h.getDuongDanHinhAnh())
                                                .thuTu(h.getThuTu())
                                                .laAnhChinh(h.getLaAnhChinh())
                                                .moTa(h.getMoTa())
                                                .build())
                                .collect(java.util.stream.Collectors.toList());

                ProductDetailDto.ProductDetailDtoBuilder builder = ProductDetailDto.builder()
                                .maSanPham(sp.getMaSanPham())
                                .tenSanPham(sp.getTenSanPham())
                                .moTa(sp.getMoTa())
                                .danhMuc(cat)
                                .nhaCungCap(sup)
                                .boSuuTap(col)
                                .bienTheList(variantDtos)
                                .hinhAnhList(imageDtos);

                if (sp.getBoSuuTap() != null) {
                        builder.maBoSuuTap(sp.getBoSuuTap().getMaBoSuuTap())
                                        .tenBoSuuTap(sp.getBoSuuTap().getTenBoSuuTap());
                }

                return builder.build();
        }

        @Override
        public SanPham getProductById(Integer id) {
                return findProductById(id);
        }

        @Override
        @Transactional(readOnly = true)
        public ProductDetailDto getProductDetailById(Integer id) {
                return mapToDto(findProductById(id));
        }

        @Override
        @Transactional(readOnly = true)
        public SanPhamWithImagesResponseDto getProductWithImagesById(Integer id) {
                SanPham sp = findProductById(id);

                // Load images ordered by thuTu
                List<HinhAnhSanPham> images = hinhAnhSanPhamRepository
                                .findBySanPhamMaSanPhamOrderByThuTuAsc(sp.getMaSanPham());

                List<SanPhamWithImagesResponseDto.HinhAnhDto> hinhAnhDtos = images
                                .stream()
                                .map(h -> SanPhamWithImagesResponseDto.HinhAnhDto
                                                .builder()
                                                .maHinhAnh(h.getMaHinhAnh())
                                                .duongDanHinhAnh(h.getDuongDanHinhAnh())
                                                .thuTu(h.getThuTu())
                                                .laAnhChinh(h.getLaAnhChinh())
                                                .moTa(h.getMoTa())
                                                .trangThai(h.getTrangThai())
                                                .build())
                                .collect(java.util.stream.Collectors.toList());

                SanPhamWithImagesResponseDto dto = SanPhamWithImagesResponseDto
                                .builder()
                                .maSanPham(sp.getMaSanPham())
                                .tenSanPham(sp.getTenSanPham())
                                .moTa(sp.getMoTa())
                                .danhMuc(sp.getDanhMuc() != null
                                                ? SanPhamWithImagesResponseDto.CategoryDto
                                                                .builder()
                                                                .id(sp.getDanhMuc().getMaDanhMuc())
                                                                .name(sp.getDanhMuc().getTenDanhMuc())
                                                                .build()
                                                : null)
                                .nhaCungCap(sp.getNhaCungCap() != null
                                                ? SanPhamWithImagesResponseDto.SupplierDto
                                                                .builder()
                                                                .id(sp.getNhaCungCap().getMaNhaCungCap())
                                                                .name(sp.getNhaCungCap().getTenNhaCungCap())
                                                                .build()
                                                : null)
                                .boSuuTap(sp.getBoSuuTap() != null
                                                ? SanPhamWithImagesResponseDto.CollectionDto
                                                                .builder()
                                                                .id(sp.getBoSuuTap().getMaBoSuuTap())
                                                                .name(sp.getBoSuuTap().getTenBoSuuTap())
                                                                .build()
                                                : null)
                                .trangThai(sp.getTrangThai())
                                .ngayTao(images.isEmpty() ? null : images.get(0).getNgayTao())
                                .ngayCapNhat(images.isEmpty() ? null : images.get(0).getNgayCapNhat())
                                .hinhAnhs(hinhAnhDtos)
                                .soLuongBienThe(sp.getBienTheList() != null ? sp.getBienTheList().size() : 0)
                                .build();

                return dto;
        }

        @Override
        @Transactional
        public SanPham createSanPham(SanPhamRequestDto dto) {
                // Validate maNhaCungCap
                if (dto.maNhaCungCap() == null) {
                        throw new IllegalArgumentException("Mã nhà cung cấp không được để trống");
                }

                NhaCungCap ncc = nhaCungCapRepository.findById(dto.maNhaCungCap())
                                .orElseThrow(
                                                () -> new EntityNotFoundException("Không tìm thấy nhà cung cấp với id: "
                                                                + dto.maNhaCungCap()));

                SanPham sp = new SanPham();
                sp.setTenSanPham(dto.tenSanPham());
                sp.setMoTa(dto.moTa());
                sp.setDiemThuong(dto.diemThuong() != null ? dto.diemThuong() : 0);
                sp.setTrangThai(dto.trangThai() != null ? dto.trangThai() : "ACTIVE");
                sp.setNhaCungCap(ncc);

                // Set danh mục nếu có
                if (dto.maDanhMuc() != null) {
                        DanhMuc danhMuc = danhMucRepository.findById(dto.maDanhMuc())
                                        .orElseThrow(
                                                        () -> new EntityNotFoundException(
                                                                        "Không tìm thấy danh mục với id: "
                                                                                        + dto.maDanhMuc()));
                        sp.setDanhMuc(danhMuc);
                }

                // Set bộ sưu tập nếu có
                if (dto.maBoSuuTap() != null) {
                        BoSuuTap bst = boSuuTapRepository.findById(dto.maBoSuuTap())
                                        .orElseThrow(
                                                        () -> new EntityNotFoundException(
                                                                        "Không tìm thấy bộ sưu tập với id: "
                                                                                        + dto.maBoSuuTap()));
                        sp.setBoSuuTap(bst);
                }

                // Note: chieuDai, chieuRong, chieuCao, canNang đã chuyển sang lưu ở
                // BienTheSanPham
                return sanPhamRepository.save(sp);
        }

        @Override
        @Transactional
        public SanPham updateSanPham(Integer id, SanPhamRequestDto dto) {
                SanPham sp = findProductById(id);

                // Validate maNhaCungCap
                if (dto.maNhaCungCap() == null) {
                        throw new IllegalArgumentException("Mã nhà cung cấp không được để trống");
                }

                NhaCungCap ncc = nhaCungCapRepository.findById(dto.maNhaCungCap())
                                .orElseThrow(
                                                () -> new EntityNotFoundException("Không tìm thấy nhà cung cấp với id: "
                                                                + dto.maNhaCungCap()));

                sp.setTenSanPham(dto.tenSanPham());
                sp.setMoTa(dto.moTa());
                sp.setDiemThuong(dto.diemThuong() != null ? dto.diemThuong() : sp.getDiemThuong());
                sp.setTrangThai(dto.trangThai() != null ? dto.trangThai() : sp.getTrangThai());
                sp.setNhaCungCap(ncc);

                // Set danh mục nếu có
                if (dto.maDanhMuc() != null) {
                        DanhMuc danhMuc = danhMucRepository.findById(dto.maDanhMuc())
                                        .orElseThrow(
                                                        () -> new EntityNotFoundException(
                                                                        "Không tìm thấy danh mục với id: "
                                                                                        + dto.maDanhMuc()));
                        sp.setDanhMuc(danhMuc);
                }

                // Set bộ sưu tập nếu có
                if (dto.maBoSuuTap() != null) {
                        BoSuuTap bst = boSuuTapRepository.findById(dto.maBoSuuTap())
                                        .orElseThrow(
                                                        () -> new EntityNotFoundException(
                                                                        "Không tìm thấy bộ sưu tập với id: "
                                                                                        + dto.maBoSuuTap()));
                        sp.setBoSuuTap(bst);
                }

                // Note: chieuDai, chieuRong, chieuCao, canNang đã chuyển sang lưu ở
                // BienTheSanPham
                return sanPhamRepository.save(sp);
        }

        @Override
        @Transactional
        public SanPham patchSanPham(Integer id, com.noithat.qlnt.backend.dto.request.SanPhamPatchRequestDto request) {
                SanPham existing = findProductById(id);

                // Only update fields that are provided (non-null)
                if (request.trangThai() != null) {
                        existing.setTrangThai(request.trangThai());
                }

                return sanPhamRepository.save(existing);
        }

        @Override
        @Transactional
        public void deleteSanPham(Integer id) {
                if (!sanPhamRepository.existsById(id)) {
                        throw new EntityNotFoundException("Không tìm thấy sản phẩm với id: " + id);
                }
                sanPhamRepository.deleteById(id);
        }

        @Override
        @Transactional
        public void addProductToCategory(Integer productId, Integer categoryId) {
                SanPham sp = findProductById(productId);
                DanhMuc dm = danhMucRepository.findById(categoryId)
                                .orElseThrow(() -> new EntityNotFoundException(
                                                "Không tìm thấy danh mục với id: " + categoryId));
                sp.setDanhMuc(dm);
                sanPhamRepository.save(sp);
        }

        @Override
        @Transactional
        public BienTheSanPham createBienThe(Integer sanPhamId, BienTheRequestDto dto) {
                // Validate consistency nếu dto có maSanPham
                if (dto.maSanPham() != null && !dto.maSanPham().equals(sanPhamId)) {
                        throw new IllegalArgumentException(
                                        "Mã sản phẩm trong body không khớp với mã sản phẩm trong URL");
                }

                SanPham sp = findProductById(sanPhamId);

                BienTheSanPham bt = new BienTheSanPham();
                bt.setSanPham(sp);
                bt.setSku(dto.sku());
                bt.setGiaBan(dto.giaBan());
                bt.setSoLuongTon(dto.soLuongTon());
                BienTheSanPham savedBienThe = bienTheRepository.save(bt);

                return savedBienThe;
        }

        @Override
        @Transactional
        public SanPhamWithImagesResponseDto createSanPhamWithImages(
                        SanPhamRequestDto sanPhamDto,
                        org.springframework.web.multipart.MultipartFile[] images,
                        Integer[] thuTuArray,
                        Boolean[] laAnhChinhArray,
                        String[] moTaArray) {

                // 1. Tạo sản phẩm trước
                SanPham sanPham = createSanPham(sanPhamDto);

                // 2. Xử lý upload ảnh nếu có
                List<com.noithat.qlnt.backend.entity.HinhAnhSanPham> savedImages = new java.util.ArrayList<>();
                if (images != null && images.length > 0) {
                        try {
                                for (int i = 0; i < images.length; i++) {
                                        org.springframework.web.multipart.MultipartFile file = images[i];

                                        if (file.isEmpty())
                                                continue;

                                        // Validate file type
                                        String contentType = file.getContentType();
                                        if (contentType == null || !contentType.startsWith("image/")) {
                                                continue;
                                        }

                                        // Upload to Cloudinary
                                        String imageUrl = cloudinaryService.uploadImage(file, "products/" + sanPham.getMaSanPham());

                                        // Tạo entity HinhAnhSanPham
                                        Integer thuTu = (thuTuArray != null && i < thuTuArray.length) ? thuTuArray[i]
                                                        : i;
                                        Boolean laAnhChinh = (laAnhChinhArray != null && i < laAnhChinhArray.length)
                                                        ? laAnhChinhArray[i]
                                                        : (i == 0);
                                        String moTa = (moTaArray != null && i < moTaArray.length) ? moTaArray[i] : null;

                                        com.noithat.qlnt.backend.entity.HinhAnhSanPham hinhAnh = com.noithat.qlnt.backend.entity.HinhAnhSanPham
                                                        .builder()
                                                        .sanPham(sanPham)
                                                        .duongDanHinhAnh(imageUrl)
                                                        .thuTu(thuTu)
                                                        .laAnhChinh(laAnhChinh)
                                                        .moTa(moTa)
                                                        .trangThai(true)
                                                        .build();

                                        // Lưu vào database
                                        savedImages.add(hinhAnhSanPhamRepository.save(hinhAnh));
                                }
                        } catch (Exception e) {
                                throw new RuntimeException("Lỗi khi upload ảnh: " + e.getMessage(), e);
                        }
                }

                // 3. Build response DTO
                return buildSanPhamWithImagesResponse(sanPham, savedImages);
        }

        private SanPhamWithImagesResponseDto buildSanPhamWithImagesResponse(
                        SanPham sanPham,
                        List<HinhAnhSanPham> hinhAnhs) {

                List<SanPhamWithImagesResponseDto.HinhAnhDto> hinhAnhDtos = hinhAnhs
                                .stream()
                                .map(h -> SanPhamWithImagesResponseDto.HinhAnhDto
                                                .builder()
                                                .maHinhAnh(h.getMaHinhAnh())
                                                .duongDanHinhAnh(h.getDuongDanHinhAnh())
                                                .thuTu(h.getThuTu())
                                                .laAnhChinh(h.getLaAnhChinh())
                                                .moTa(h.getMoTa())
                                                .trangThai(h.getTrangThai())
                                                .build())
                                .toList();

                return SanPhamWithImagesResponseDto.builder()
                                .maSanPham(sanPham.getMaSanPham())
                                .tenSanPham(sanPham.getTenSanPham())
                                .moTa(sanPham.getMoTa())
                                .moTaChiTiet(null) // SanPham không có field này
                                .danhMuc(sanPham.getDanhMuc() != null
                                                ? SanPhamWithImagesResponseDto.CategoryDto
                                                                .builder()
                                                                .id(sanPham.getDanhMuc().getMaDanhMuc())
                                                                .name(sanPham.getDanhMuc().getTenDanhMuc())
                                                                .build()
                                                : null)
                                .nhaCungCap(sanPham.getNhaCungCap() != null
                                                ? SanPhamWithImagesResponseDto.SupplierDto
                                                                .builder()
                                                                .id(sanPham.getNhaCungCap().getMaNhaCungCap())
                                                                .name(sanPham.getNhaCungCap().getTenNhaCungCap())
                                                                .build()
                                                : null)
                                .boSuuTap(sanPham.getBoSuuTap() != null
                                                ? SanPhamWithImagesResponseDto.CollectionDto
                                                                .builder()
                                                                .id(sanPham.getBoSuuTap().getMaBoSuuTap())
                                                                .name(sanPham.getBoSuuTap().getTenBoSuuTap())
                                                                .build()
                                                : null)
                                .trangThai(sanPham.getTrangThai())
                                .ngayTao(hinhAnhs.isEmpty() ? null : hinhAnhs.get(0).getNgayTao()) // Lấy từ ảnh đầu
                                                                                                   // tiên
                                .ngayCapNhat(hinhAnhs.isEmpty() ? null : hinhAnhs.get(0).getNgayCapNhat())
                                .hinhAnhs(hinhAnhDtos)
                                .soLuongBienThe(sanPham.getBienTheList() != null ? sanPham.getBienTheList().size() : 0)
                                .diemThuong(sanPham.getDiemThuong())
                                .averageRating(danhGiaSanPhamRepository.findAverageByProductId(sanPham.getMaSanPham()))
                                .reviewCount(danhGiaSanPhamRepository.countByProductId(sanPham.getMaSanPham())
                                                .intValue())
                                .build();
        }

        @Override
        public List<BienTheSanPham> getVariantsByProductId(Integer productId) {
                SanPham sp = findProductById(productId);
                // Use the fetch-join repository method so BienTheThuocTinhs (and their
                // ThuocTinh) are loaded
                return bienTheRepository.findBySanPham_MaSanPhamWithAttributes(sp.getMaSanPham());
        }

        @Override
        @Transactional(readOnly = true)
        public java.util.List<com.noithat.qlnt.backend.dto.response.ShopProductResponseDto> getProductsForShop() {
                return sanPhamRepository.findAll().stream().map(sp -> {
                        // gather variants
                        java.util.List<BienTheSanPham> variants = sp.getBienTheList() == null
                                        ? java.util.Collections.emptyList()
                                        : sp.getBienTheList();

                        double min = Double.MAX_VALUE;
                        double max = 0.0;
                        int totalStock = 0;
                        int availableVariantCount = 0;

                        for (BienTheSanPham bt : variants) {
                                if (bt.getGiaBan() != null) {
                                        double price = bt.getGiaBan().doubleValue();
                                        if (price < min)
                                                min = price;
                                        if (price > max)
                                                max = price;
                                }
                                int qty = bt.getSoLuongTon() == null ? 0 : bt.getSoLuongTon();
                                totalStock += qty;
                                if (qty > 0)
                                        availableVariantCount++;
                        }

                        if (min == Double.MAX_VALUE)
                                min = 0.0;

                        java.util.List<String> imageUrls = hinhAnhSanPhamRepository
                                        .findBySanPhamMaSanPhamOrderByThuTuAsc(sp.getMaSanPham())
                                        .stream()
                                        .map(h -> h.getDuongDanHinhAnh())
                                        .collect(java.util.stream.Collectors.toList());

                        // Determine per-variant final price (giaSauGiam) if there is an active
                        // BienTheGiamGia
                        Double lowestFinalPrice = null;
                        Integer lowestFinalVariantId = null;
                        String lowestFinalVariantSku = null;
                        Double lowestFinalVariantOriginalPrice = null;
                        Integer lowestFinalVariantDiscountPercent = null;
                        Double lowestFinalVariantDiscountAmount = null;

                        for (BienTheSanPham bt : variants) {
                                Double variantOriginal = bt.getGiaBan() != null ? bt.getGiaBan().doubleValue() : null;
                                Double variantFinal = variantOriginal;

                                // check discounts for this variant
                                java.util.List<BienTheGiamGia> discounts = bienTheGiamGiaRepository
                                                .findByBienTheSanPham_MaBienThe(bt.getMaBienThe());
                                if (!discounts.isEmpty()) {
                                        BienTheGiamGia disc = discounts.get(0);
                                        com.noithat.qlnt.backend.entity.ChuongTrinhGiamGia chuongTrinh = disc
                                                        .getChuongTrinhGiamGia();
                                        java.time.LocalDateTime now = java.time.LocalDateTime.now();
                                        boolean isActive = (chuongTrinh.getNgayBatDau() == null
                                                        || !now.isBefore(chuongTrinh.getNgayBatDau())) &&
                                                        (chuongTrinh.getNgayKetThuc() == null
                                                                        || !now.isAfter(chuongTrinh.getNgayKetThuc()));
                                        if (isActive && disc.getGiaSauGiam() != null) {
                                                variantFinal = disc.getGiaSauGiam().doubleValue();
                                        }
                                }

                                if (variantFinal != null) {
                                        if (variantFinal < min)
                                                min = variantFinal;
                                        if (variantFinal > max)
                                                max = variantFinal;
                                } else if (variantOriginal != null) {
                                        double price = variantOriginal;
                                        if (price < min)
                                                min = price;
                                        if (price > max)
                                                max = price;
                                }

                                int qty = bt.getSoLuongTon() == null ? 0 : bt.getSoLuongTon();
                                totalStock += qty;
                                if (qty > 0)
                                        availableVariantCount++;

                                // track lowest final price variant
                                if (variantFinal != null) {
                                        if (lowestFinalPrice == null || variantFinal < lowestFinalPrice) {
                                                lowestFinalPrice = variantFinal;
                                                lowestFinalVariantId = bt.getMaBienThe();
                                                lowestFinalVariantSku = bt.getSku();
                                                lowestFinalVariantOriginalPrice = variantOriginal;
                                                // compute percent/amount
                                                if (variantOriginal != null && variantOriginal > 0) {
                                                        double amt = variantOriginal - variantFinal;
                                                        lowestFinalVariantDiscountAmount = amt;
                                                        lowestFinalVariantDiscountPercent = (int) Math
                                                                        .round((amt / variantOriginal) * 100.0);
                                                } else {
                                                        lowestFinalVariantDiscountAmount = null;
                                                        lowestFinalVariantDiscountPercent = null;
                                                }
                                        }
                                }
                        }
                        // Determine discount percent: prefer a real variant-level discount (giaSauGiam)
                        // if present.
                        // Do NOT infer discount from max/min price range.
                        int discountPercent = 0;
                        if (lowestFinalVariantDiscountPercent != null) {
                                discountPercent = lowestFinalVariantDiscountPercent;
                        } else {
                                discountPercent = 0;
                        }

                        // Map to frontend-friendly fields: price=min, originalPrice=max,
                        // stockQuantity=totalStock
                        com.noithat.qlnt.backend.dto.response.ShopProductResponseDto.ShopProductResponseDtoBuilder builder = com.noithat.qlnt.backend.dto.response.ShopProductResponseDto
                                        .builder()
                                        .maSanPham(sp.getMaSanPham())
                                        .tenSanPham(sp.getTenSanPham())
                                        .moTa(sp.getMoTa())
                                        .id(sp.getMaSanPham())
                                        .name(sp.getTenSanPham())
                                        .category(sp.getDanhMuc() != null
                                                        ? com.noithat.qlnt.backend.dto.response.ShopProductResponseDto.CategoryDto
                                                                        .builder().id(sp.getDanhMuc().getMaDanhMuc())
                                                                        .name(sp.getDanhMuc().getTenDanhMuc()).build()
                                                        : null)
                                        .supplier(sp.getNhaCungCap() != null
                                                        ? com.noithat.qlnt.backend.dto.response.ShopProductResponseDto.SupplierDto
                                                                        .builder()
                                                                        .id(sp.getNhaCungCap().getMaNhaCungCap())
                                                                        .name(sp.getNhaCungCap().getTenNhaCungCap())
                                                                        .build()
                                                        : null)
                                        // include category and supplier details for frontend filtering
                                        .category(sp.getDanhMuc() != null
                                                        ? com.noithat.qlnt.backend.dto.response.ShopProductResponseDto.CategoryDto
                                                                        .builder().id(sp.getDanhMuc().getMaDanhMuc())
                                                                        .name(sp.getDanhMuc().getTenDanhMuc()).build()
                                                        : null)
                                        .supplier(sp.getNhaCungCap() != null
                                                        ? com.noithat.qlnt.backend.dto.response.ShopProductResponseDto.SupplierDto
                                                                        .builder()
                                                                        .id(sp.getNhaCungCap().getMaNhaCungCap())
                                                                        .name(sp.getNhaCungCap().getTenNhaCungCap())
                                                                        .build()
                                                        : null)
                                        .price(min > 0 ? min : null)
                                        .originalPrice(max > 0 ? max : null)
                                        .stockQuantity(totalStock)
                                        .minPrice(min)
                                        .maxPrice(max)
                                        .totalStock(totalStock)
                                        .availableVariantCount(availableVariantCount)
                                        .soLuongBienThe(variants.size())
                                        .images(imageUrls)
                                        .discountPercent(discountPercent)
                                        .averageRating(danhGiaSanPhamRepository
                                                        .findAverageByProductId(sp.getMaSanPham()))
                                        .reviewCount(danhGiaSanPhamRepository.countByProductId(sp.getMaSanPham())
                                                        .intValue())
                                        .diemThuong(sp.getDiemThuong());

                        // attach lowest variant info if found
                        if (lowestFinalVariantId != null) {
                                builder.lowestVariantId(lowestFinalVariantId)
                                                .lowestVariantSku(lowestFinalVariantSku)
                                                .lowestVariantPrice(lowestFinalPrice)
                                                .lowestVariantOriginalPrice(lowestFinalVariantOriginalPrice)
                                                .lowestVariantDiscountAmount(lowestFinalVariantDiscountAmount)
                                                .lowestVariantDiscountPercent(lowestFinalVariantDiscountPercent);
                        }

                        return builder.build();
                }).collect(java.util.stream.Collectors.toList());
        }

        @Override
        @Transactional(readOnly = true)
        public com.noithat.qlnt.backend.dto.response.ShopProductPageResponseDto getProductsForShop(int page, int size) {
                org.springframework.data.domain.PageRequest pr = org.springframework.data.domain.PageRequest
                                .of(Math.max(0, page), Math.max(1, size));
                org.springframework.data.domain.Page<SanPham> p = sanPhamRepository.findAll(pr);

                java.util.List<com.noithat.qlnt.backend.dto.response.ShopProductResponseDto> items = p.stream()
                                .map(sp -> {
                                        java.util.List<BienTheSanPham> variants = sp.getBienTheList() == null
                                                        ? java.util.Collections.emptyList()
                                                        : sp.getBienTheList();

                                        double min = Double.MAX_VALUE;
                                        double max = 0.0;
                                        int totalStock = 0;
                                        int availableVariantCount = 0;

                                        for (BienTheSanPham bt : variants) {
                                                if (bt.getGiaBan() != null) {
                                                        double price = bt.getGiaBan().doubleValue();
                                                        if (price < min)
                                                                min = price;
                                                        if (price > max)
                                                                max = price;
                                                }
                                                int qty = bt.getSoLuongTon() == null ? 0 : bt.getSoLuongTon();
                                                totalStock += qty;
                                                if (qty > 0)
                                                        availableVariantCount++;
                                        }

                                        if (min == Double.MAX_VALUE)
                                                min = 0.0;

                                        java.util.List<String> imageUrls = hinhAnhSanPhamRepository
                                                        .findBySanPhamMaSanPhamOrderByThuTuAsc(sp.getMaSanPham())
                                                        .stream()
                                                        .map(h -> h.getDuongDanHinhAnh())
                                                        .collect(java.util.stream.Collectors.toList());

                                        // Determine per-variant final price (giaSauGiam) if there is an active
                                        // BienTheGiamGia
                                        Double lowestFinalPrice2 = null;
                                        Integer lowestFinalVariantId2 = null;
                                        String lowestFinalVariantSku2 = null;
                                        Double lowestFinalVariantOriginalPrice2 = null;
                                        Integer lowestFinalVariantDiscountPercent2 = null;
                                        Double lowestFinalVariantDiscountAmount2 = null;

                                        for (BienTheSanPham bt : variants) {
                                                Double variantOriginal = bt.getGiaBan() != null
                                                                ? bt.getGiaBan().doubleValue()
                                                                : null;
                                                Double variantFinal = variantOriginal;

                                                java.util.List<BienTheGiamGia> discounts = bienTheGiamGiaRepository
                                                                .findByBienTheSanPham_MaBienThe(bt.getMaBienThe());
                                                if (!discounts.isEmpty()) {
                                                        BienTheGiamGia disc = discounts.get(0);
                                                        com.noithat.qlnt.backend.entity.ChuongTrinhGiamGia chuongTrinh = disc
                                                                        .getChuongTrinhGiamGia();
                                                        java.time.LocalDateTime now = java.time.LocalDateTime.now();
                                                        boolean isActive = (chuongTrinh.getNgayBatDau() == null
                                                                        || !now.isBefore(chuongTrinh.getNgayBatDau()))
                                                                        &&
                                                                        (chuongTrinh.getNgayKetThuc() == null
                                                                                        || !now.isAfter(chuongTrinh
                                                                                                        .getNgayKetThuc()));
                                                        if (isActive && disc.getGiaSauGiam() != null) {
                                                                variantFinal = disc.getGiaSauGiam().doubleValue();
                                                        }
                                                }

                                                if (variantFinal != null) {
                                                        if (variantFinal < min)
                                                                min = variantFinal;
                                                        if (variantFinal > max)
                                                                max = variantFinal;
                                                } else if (variantOriginal != null) {
                                                        double price = variantOriginal;
                                                        if (price < min)
                                                                min = price;
                                                        if (price > max)
                                                                max = price;
                                                }

                                                int qty = bt.getSoLuongTon() == null ? 0 : bt.getSoLuongTon();
                                                totalStock += qty;
                                                if (qty > 0)
                                                        availableVariantCount++;

                                                // track lowest final price variant
                                                if (variantFinal != null) {
                                                        if (lowestFinalPrice2 == null
                                                                        || variantFinal < lowestFinalPrice2) {
                                                                lowestFinalPrice2 = variantFinal;
                                                                lowestFinalVariantId2 = bt.getMaBienThe();
                                                                lowestFinalVariantSku2 = bt.getSku();
                                                                lowestFinalVariantOriginalPrice2 = variantOriginal;
                                                                if (variantOriginal != null && variantOriginal > 0) {
                                                                        double amt = variantOriginal - variantFinal;
                                                                        lowestFinalVariantDiscountAmount2 = amt;
                                                                        lowestFinalVariantDiscountPercent2 = (int) Math
                                                                                        .round((amt / variantOriginal)
                                                                                                        * 100.0);
                                                                } else {
                                                                        lowestFinalVariantDiscountAmount2 = null;
                                                                        lowestFinalVariantDiscountPercent2 = null;
                                                                }
                                                        }
                                                }
                                        }

                                        // Determine discount percent: prefer variant-level discounted percent when
                                        // available.
                                        // Avoid inferring discount from min/max price range.
                                        int discountPercent2 = 0;
                                        if (lowestFinalVariantDiscountPercent2 != null) {
                                                discountPercent2 = lowestFinalVariantDiscountPercent2;
                                        } else {
                                                discountPercent2 = 0;
                                        }

                                        com.noithat.qlnt.backend.dto.response.ShopProductResponseDto.ShopProductResponseDtoBuilder builder2 = com.noithat.qlnt.backend.dto.response.ShopProductResponseDto
                                                        .builder()
                                                        .maSanPham(sp.getMaSanPham())
                                                        .tenSanPham(sp.getTenSanPham())
                                                        .moTa(sp.getMoTa())
                                                        .id(sp.getMaSanPham())
                                                        .name(sp.getTenSanPham())
                                                        .price(min > 0 ? min : null)
                                                        .originalPrice(max > 0 ? max : null)
                                                        .stockQuantity(totalStock)
                                                        .minPrice(min)
                                                        .maxPrice(max)
                                                        .totalStock(totalStock)
                                                        .availableVariantCount(availableVariantCount)
                                                        .soLuongBienThe(variants.size())
                                                        .images(imageUrls)
                                                        .discountPercent(discountPercent2)
                                                        .averageRating(danhGiaSanPhamRepository
                                                                        .findAverageByProductId(sp.getMaSanPham()))
                                                        .reviewCount(danhGiaSanPhamRepository
                                                                        .countByProductId(sp.getMaSanPham())
                                                                        .intValue());

                                        // attach lowest variant info if found
                                        if (lowestFinalVariantId2 != null) {
                                                builder2.lowestVariantId(lowestFinalVariantId2)
                                                                .lowestVariantSku(lowestFinalVariantSku2)
                                                                .lowestVariantPrice(lowestFinalPrice2)
                                                                .lowestVariantOriginalPrice(
                                                                                lowestFinalVariantOriginalPrice2)
                                                                .lowestVariantDiscountAmount(
                                                                                lowestFinalVariantDiscountAmount2)
                                                                .lowestVariantDiscountPercent(
                                                                                lowestFinalVariantDiscountPercent2);
                                        }

                                        return builder2.build();
                                }).collect(java.util.stream.Collectors.toList());

                com.noithat.qlnt.backend.dto.response.ShopProductPageResponseDto pageDto = com.noithat.qlnt.backend.dto.response.ShopProductPageResponseDto
                                .builder()
                                .items(items)
                                .page(p.getNumber())
                                .size(p.getSize())
                                .totalItems(p.getTotalElements())
                                .totalPages(p.getTotalPages())
                                .build();

                return pageDto;
        }

        @Autowired
        private BienTheGiamGiaRepository bienTheGiamGiaRepository;

        /**
         * Lấy chi tiết sản phẩm đầy đủ với biến thể, thuộc tính và giá giảm
         */
        @Override
        @Transactional(readOnly = true)
        public com.noithat.qlnt.backend.dto.response.ProductDetailWithVariantsDto getProductDetailWithVariants(
                        Integer id) {
                SanPham sp = findProductById(id);

                // Load hình ảnh
                List<HinhAnhSanPham> images = hinhAnhSanPhamRepository
                                .findBySanPhamMaSanPhamOrderByThuTuAsc(sp.getMaSanPham());

                List<com.noithat.qlnt.backend.dto.response.ProductDetailWithVariantsDto.ImageDto> imageDtos = images
                                .stream()
                                .map(h -> com.noithat.qlnt.backend.dto.response.ProductDetailWithVariantsDto.ImageDto
                                                .builder()
                                                .maHinhAnh(h.getMaHinhAnh())
                                                .duongDanHinhAnh(h.getDuongDanHinhAnh())
                                                .thuTu(h.getThuTu())
                                                .laAnhChinh(h.getLaAnhChinh())
                                                .moTa(h.getMoTa())
                                                .build())
                                .collect(java.util.stream.Collectors.toList());

                // Load biến thể với thuộc tính
                List<BienTheSanPham> variants = sp.getBienTheList() != null ? sp.getBienTheList()
                                : new java.util.ArrayList<>();

                // Tính giá min/max và tổng số lượng
                java.math.BigDecimal giaMin = null;
                java.math.BigDecimal giaMax = null;
                java.math.BigDecimal giaGocMin = null;
                java.math.BigDecimal giaGocMax = null;
                int tongSoLuong = 0;

                List<com.noithat.qlnt.backend.dto.response.ProductDetailWithVariantsDto.VariantDetailDto> variantDtos = new java.util.ArrayList<>();

                for (BienTheSanPham bt : variants) {
                        // Cập nhật giá min/max
                        if (bt.getGiaBan() != null) {
                                if (giaMin == null || bt.getGiaBan().compareTo(giaMin) < 0) {
                                        giaMin = bt.getGiaBan();
                                }
                                if (giaMax == null || bt.getGiaBan().compareTo(giaMax) > 0) {
                                        giaMax = bt.getGiaBan();
                                }
                        }

                        // Cập nhật giá gốc (giá mua) min/max
                        if (bt.getGiaMua() != null) {
                                if (giaGocMin == null || bt.getGiaMua().compareTo(giaGocMin) < 0) {
                                        giaGocMin = bt.getGiaMua();
                                }
                                if (giaGocMax == null || bt.getGiaMua().compareTo(giaGocMax) > 0) {
                                        giaGocMax = bt.getGiaMua();
                                }
                        }

                        tongSoLuong += (bt.getSoLuongTon() != null ? bt.getSoLuongTon() : 0);

                        // Load thuộc tính của biến thể
                        List<com.noithat.qlnt.backend.dto.response.ProductDetailWithVariantsDto.AttributeDto> attributeDtos = bt
                                        .getBienTheThuocTinhs() != null
                                                        ? bt.getBienTheThuocTinhs().stream()
                                                                        .map(btt -> com.noithat.qlnt.backend.dto.response.ProductDetailWithVariantsDto.AttributeDto
                                                                                        .builder()
                                                                                        .maThuocTinh(btt.getThuocTinh()
                                                                                                        .getMaThuocTinh())
                                                                                        .tenThuocTinh(btt.getThuocTinh()
                                                                                                        .getTenThuocTinh())
                                                                                        .giaTri(btt.getGiaTri())
                                                                                        .build())
                                                                        .collect(java.util.stream.Collectors.toList())
                                                        : new java.util.ArrayList<>();

                        // Load giảm giá cho biến thể (nếu có)
                        List<BienTheGiamGia> discounts = bienTheGiamGiaRepository
                                        .findByBienTheSanPham_MaBienThe(bt.getMaBienThe());

                        com.noithat.qlnt.backend.dto.response.ProductDetailWithVariantsDto.DiscountDto discountDto = null;
                        java.math.BigDecimal giaSauGiam = bt.getGiaBan();
                        java.math.BigDecimal phanTramGiam = null;
                        java.math.BigDecimal soTienGiam = null;

                        if (!discounts.isEmpty()) {
                                // Lấy discount đầu tiên (hoặc có thể lọc theo ngày hiệu lực)
                                BienTheGiamGia discount = discounts.get(0);
                                com.noithat.qlnt.backend.entity.ChuongTrinhGiamGia chuongTrinh = discount
                                                .getChuongTrinhGiamGia();

                                // Kiểm tra chương trình có đang hiệu lực không
                                java.time.LocalDateTime now = java.time.LocalDateTime.now();
                                boolean isActive = (chuongTrinh.getNgayBatDau() == null
                                                || !now.isBefore(chuongTrinh.getNgayBatDau())) &&
                                                (chuongTrinh.getNgayKetThuc() == null
                                                                || !now.isAfter(chuongTrinh.getNgayKetThuc()));

                                if (isActive && discount.getGiaSauGiam() != null) {
                                        giaSauGiam = discount.getGiaSauGiam();

                                        // Tính phần trăm giảm hoặc số tiền giảm
                                        if (bt.getGiaBan() != null
                                                        && bt.getGiaBan().compareTo(java.math.BigDecimal.ZERO) > 0) {
                                                soTienGiam = bt.getGiaBan().subtract(giaSauGiam);
                                                phanTramGiam = soTienGiam
                                                                .divide(bt.getGiaBan(), 4,
                                                                                java.math.RoundingMode.HALF_UP)
                                                                .multiply(new java.math.BigDecimal(100));
                                        }

                                        discountDto = com.noithat.qlnt.backend.dto.response.ProductDetailWithVariantsDto.DiscountDto
                                                        .builder()
                                                        .maChuongTrinh(chuongTrinh.getMaChuongTrinhGiamGia())
                                                        .tenChuongTrinh(chuongTrinh.getTenChuongTrinh())
                                                        .loaiGiam(chuongTrinh.getLoaiGiamGia())
                                                        .giaTriGiam(chuongTrinh.getGiaTriGiam())
                                                        .ngayBatDau(chuongTrinh.getNgayBatDau() != null
                                                                        ? chuongTrinh.getNgayBatDau().toString()
                                                                        : null)
                                                        .ngayKetThuc(chuongTrinh.getNgayKetThuc() != null
                                                                        ? chuongTrinh.getNgayKetThuc().toString()
                                                                        : null)
                                                        .build();
                                }
                        }

                        // Build variant DTO
                        com.noithat.qlnt.backend.dto.response.ProductDetailWithVariantsDto.VariantDetailDto variantDto = com.noithat.qlnt.backend.dto.response.ProductDetailWithVariantsDto.VariantDetailDto
                                        .builder()
                                        .maBienThe(bt.getMaBienThe())
                                        .sku(bt.getSku())
                                        .giaBan(bt.getGiaBan())
                                        .giaGoc(bt.getGiaMua())
                                        .soLuong(bt.getSoLuongTon())
                                        .trangThaiKho(bt.getTrangThaiKho())
                                        .thuocTinh(attributeDtos)
                                        .giamGia(discountDto)
                                        .giaSauGiam(giaSauGiam)
                                        .phanTramGiam(phanTramGiam)
                                        .soTienGiam(soTienGiam)
                                        .build();

                        variantDtos.add(variantDto);
                }

                // Tạo thông số kỹ thuật từ thuộc tính của các biến thể
                java.util.Map<String, java.util.Set<String>> specsMap = new java.util.LinkedHashMap<>();
                for (BienTheSanPham bt : variants) {
                        if (bt.getBienTheThuocTinhs() != null) {
                                for (var btt : bt.getBienTheThuocTinhs()) {
                                        String tenThuocTinh = btt.getThuocTinh().getTenThuocTinh();
                                        String giaTri = btt.getGiaTri();

                                        specsMap.putIfAbsent(tenThuocTinh, new java.util.LinkedHashSet<>());
                                        specsMap.get(tenThuocTinh).add(giaTri);
                                }
                        }
                }

                List<com.noithat.qlnt.backend.dto.response.ProductDetailWithVariantsDto.SpecificationDto> specDtos = specsMap
                                .entrySet().stream()
                                .map(entry -> com.noithat.qlnt.backend.dto.response.ProductDetailWithVariantsDto.SpecificationDto
                                                .builder()
                                                .tenThuocTinh(entry.getKey())
                                                .giaTriList(new java.util.ArrayList<>(entry.getValue()))
                                                .build())
                                .collect(java.util.stream.Collectors.toList());

                // Lấy sản phẩm liên quan (cùng danh mục hoặc bộ sưu tập)
                List<com.noithat.qlnt.backend.dto.response.ProductDetailWithVariantsDto.RelatedProductDto> relatedProducts = new java.util.ArrayList<>();

                // Tìm sản phẩm cùng danh mục hoặc bộ sưu tập
                List<SanPham> relatedList = new java.util.ArrayList<>();
                if (sp.getDanhMuc() != null) {
                        relatedList.addAll(sanPhamRepository.findByDanhMuc_MaDanhMuc(sp.getDanhMuc().getMaDanhMuc())
                                        .stream()
                                        .filter(p -> !p.getMaSanPham().equals(sp.getMaSanPham()))
                                        .limit(3)
                                        .collect(java.util.stream.Collectors.toList()));
                }

                if (relatedList.size() < 6 && sp.getBoSuuTap() != null) {
                        relatedList.addAll(sanPhamRepository.findByBoSuuTap_MaBoSuuTap(sp.getBoSuuTap().getMaBoSuuTap())
                                        .stream()
                                        .filter(p -> !p.getMaSanPham().equals(sp.getMaSanPham()) &&
                                                        !relatedList.contains(p))
                                        .limit(6 - relatedList.size())
                                        .collect(java.util.stream.Collectors.toList()));
                }

                for (SanPham relatedSp : relatedList) {
                        // Tính giá min/max cho sản phẩm liên quan
                        java.math.BigDecimal relGiaMin = null;
                        java.math.BigDecimal relGiaMax = null;
                        int relTongSoLuong = 0;

                        List<BienTheSanPham> relVariants = relatedSp.getBienTheList() != null
                                        ? relatedSp.getBienTheList()
                                        : new java.util.ArrayList<>();

                        for (BienTheSanPham relBt : relVariants) {
                                if (relBt.getGiaBan() != null) {
                                        if (relGiaMin == null || relBt.getGiaBan().compareTo(relGiaMin) < 0) {
                                                relGiaMin = relBt.getGiaBan();
                                        }
                                        if (relGiaMax == null || relBt.getGiaBan().compareTo(relGiaMax) > 0) {
                                                relGiaMax = relBt.getGiaBan();
                                        }
                                }
                                relTongSoLuong += (relBt.getSoLuongTon() != null ? relBt.getSoLuongTon() : 0);
                        }

                        // Lấy ảnh chính
                        List<HinhAnhSanPham> relImages = hinhAnhSanPhamRepository
                                        .findBySanPhamMaSanPhamOrderByThuTuAsc(relatedSp.getMaSanPham());
                        String mainImage = relImages.isEmpty() ? null : relImages.get(0).getDuongDanHinhAnh();

                        relatedProducts.add(
                                        com.noithat.qlnt.backend.dto.response.ProductDetailWithVariantsDto.RelatedProductDto
                                                        .builder()
                                                        .maSanPham(relatedSp.getMaSanPham())
                                                        .tenSanPham(relatedSp.getTenSanPham())
                                                        .moTa(relatedSp.getMoTa())
                                                        .giaMin(relGiaMin)
                                                        .giaMax(relGiaMax)
                                                        .hinhAnh(mainImage)
                                                        .danhGia(danhGiaSanPhamRepository.findAverageByProductId(
                                                                        relatedSp.getMaSanPham()))
                                                        .soLuotDanhGia(danhGiaSanPhamRepository
                                                                        .countByProductId(relatedSp.getMaSanPham())
                                                                        .intValue())
                                                        .soLuongTon(relTongSoLuong)
                                                        .build());
                }

                // Build response DTO
                return com.noithat.qlnt.backend.dto.response.ProductDetailWithVariantsDto.builder()
                                .maSanPham(sp.getMaSanPham())
                                .tenSanPham(sp.getTenSanPham())
                                .moTa(sp.getMoTa())
                                .danhMuc(sp.getDanhMuc() != null
                                                ? com.noithat.qlnt.backend.dto.response.ProductDetailWithVariantsDto.CategoryDto
                                                                .builder()
                                                                .maDanhMuc(sp.getDanhMuc().getMaDanhMuc())
                                                                .tenDanhMuc(sp.getDanhMuc().getTenDanhMuc())
                                                                .build()
                                                : null)
                                .nhaCungCap(sp.getNhaCungCap() != null
                                                ? com.noithat.qlnt.backend.dto.response.ProductDetailWithVariantsDto.SupplierDto
                                                                .builder()
                                                                .maNhaCungCap(sp.getNhaCungCap().getMaNhaCungCap())
                                                                .tenNhaCungCap(sp.getNhaCungCap().getTenNhaCungCap())
                                                                .build()
                                                : null)
                                .boSuuTap(sp.getBoSuuTap() != null
                                                ? com.noithat.qlnt.backend.dto.response.ProductDetailWithVariantsDto.CollectionDto
                                                                .builder()
                                                                .maBoSuuTap(sp.getBoSuuTap().getMaBoSuuTap())
                                                                .tenBoSuuTap(sp.getBoSuuTap().getTenBoSuuTap())
                                                                .build()
                                                : null)
                                .bienThe(variantDtos)
                                .hinhAnh(imageDtos)
                                .giaMin(giaMin)
                                .giaMax(giaMax)
                                .giaGocMin(giaGocMin)
                                .giaGocMax(giaGocMax)
                                .tongSoLuong(tongSoLuong)
                                .danhGia(danhGiaSanPhamRepository.findAverageByProductId(sp.getMaSanPham()))
                                .soLuotDanhGia(danhGiaSanPhamRepository.countByProductId(sp.getMaSanPham()).intValue())
                                .danhGiaKhachHang(danhGiaSanPhamRepository.findBySanPham_MaSanPham(sp.getMaSanPham())
                                                .stream().map(dg -> {
                                                        var builder = com.noithat.qlnt.backend.dto.response.ProductDetailWithVariantsDto.ReviewDto
                                                                        .builder()
                                                                        .id(dg.getMaDanhGia())
                                                                        .tenKhachHang(dg.getKhachHang() != null
                                                                                        ? dg.getKhachHang().getHoTen()
                                                                                        : null)
                                                                        .danhGia(dg.getDiem())
                                                                        .tieuDe(dg.getTieuDe())
                                                                        .noiDung(dg.getNoiDung())
                                                                        .ngayDanhGia(dg.getNgayTao() != null
                                                                                        ? dg.getNgayTao().toString()
                                                                                        : null);
                                                        if (dg.getKhachHang() != null)
                                                                builder.maKhachHang(dg.getKhachHang().getMaKhachHang());
                                                        return builder.build();
                                                }).collect(java.util.stream.Collectors.toList()))
                                .thongSoKyThuat(specDtos)
                                .sanPhamLienQuan(relatedProducts)
                                .build();
        }

        @Override
        @Transactional(readOnly = true)
        public java.util.List<com.noithat.qlnt.backend.dto.response.ProductBasicResponse> getBasicProducts() {
                return sanPhamRepository.findAll().stream()
                                .map(sp -> {
                                        Integer maDanhMuc = sp.getDanhMuc() != null ? sp.getDanhMuc().getMaDanhMuc()
                                                        : null;
                                        String tenDanhMuc = sp.getDanhMuc() != null ? sp.getDanhMuc().getTenDanhMuc()
                                                        : null;
                                        return new com.noithat.qlnt.backend.dto.response.ProductBasicResponse(
                                                        sp.getMaSanPham(),
                                                        sp.getTenSanPham(),
                                                        maDanhMuc,
                                                        tenDanhMuc);
                                })
                                .collect(java.util.stream.Collectors.toList());
        }
}
