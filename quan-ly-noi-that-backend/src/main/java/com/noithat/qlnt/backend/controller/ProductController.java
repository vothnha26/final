package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.dto.request.BienTheRequestDto;
import com.noithat.qlnt.backend.dto.request.SanPhamRequestDto;
import com.noithat.qlnt.backend.dto.request.HinhAnhRequestDto;
import com.noithat.qlnt.backend.entity.BienTheSanPham;
import com.noithat.qlnt.backend.dto.response.BienTheSanPhamDetailResponse;
import com.noithat.qlnt.backend.entity.SanPham;
import com.noithat.qlnt.backend.entity.HinhAnhSanPham;
import com.noithat.qlnt.backend.service.IProductService;
import jakarta.validation.Valid;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({ "/api/products", "/api/san-pham" }) // Support both endpoints
public class ProductController {
    @Autowired
    private IProductService productService;
    @Autowired
    private com.noithat.qlnt.backend.repository.BienTheGiamGiaRepository bienTheGiamGiaRepository;
    @Autowired
    private com.noithat.qlnt.backend.repository.HinhAnhSanPhamRepository hinhAnhSanPhamRepository;

    // ===== CRUD cho Sản phẩm (Sản phẩm gốc) =====
    @GetMapping
    public ResponseEntity<?> getAllProducts() {
        try {
            var list = productService.getAllProducts();
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("error", e.getMessage()));
        }
    }

    // API so sánh tổng nhập/xuất theo sản phẩm (gộp các biến thể)
    @PostMapping("/compare")
    public ResponseEntity<?> compareProductsAggregate(@RequestBody java.util.List<Integer> productIds) {
        try {
            var result = productService.compareProductsAggregate(productIds);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("error", e.getMessage()));
        }
    }

    // New endpoint: lightweight product list for category assignment UI
    @GetMapping("/basic")
    public ResponseEntity<?> getBasicProducts() {
        try {
            var list = productService.getBasicProducts();
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("error", e.getMessage()));
        }
    }

    // New endpoint: products shaped for shop listing (variant-aware price range &
    // stock)
    @GetMapping("/shop")
    public ResponseEntity<?> getProductsForShop(@RequestParam(value = "page", required = false) Integer page,
            @RequestParam(value = "size", required = false) Integer size) {
        try {
            if (page != null && size != null) {
                var pageDto = productService.getProductsForShop(page, size);
                return ResponseEntity.ok(pageDto);
            }

            var list = productService.getProductsForShop();
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProductById(@PathVariable Integer id) {
        try {
            // Return the detailed product with variants (includes variant attributes)
            var dto = productService.getProductDetailWithVariants(id);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(java.util.Map.of("error", e.getMessage()));
        }
    }

    // Endpoint mới: Lấy chi tiết sản phẩm đầy đủ với biến thể, thuộc tính và giá
    // giảm
    @GetMapping("/{id}/detail")
    public ResponseEntity<?> getProductDetailWithVariants(@PathVariable Integer id) {
        try {
            var dto = productService.getProductDetailWithVariants(id);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<SanPham> createSanPham(@Valid @RequestBody SanPhamRequestDto dto) {
        return new ResponseEntity<>(productService.createSanPham(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<SanPham> updateSanPham(@PathVariable Integer id, @Valid @RequestBody SanPhamRequestDto dto) {
        return ResponseEntity.ok(productService.updateSanPham(id, dto));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<SanPham> patchSanPham(
            @PathVariable Integer id,
            @Valid @RequestBody com.noithat.qlnt.backend.dto.request.SanPhamPatchRequestDto request) {
        SanPham updatedProduct = productService.patchSanPham(id, request);
        return ResponseEntity.ok(updatedProduct);
    }

    /**
     * Update images for a product
     * PUT /api/products/{id}/images or /api/san-pham/{id}/images
     * Request body: List of image objects with thuTu, laAnhChinh, etc.
     */
    @PutMapping("/{id}/images")
    public ResponseEntity<?> updateProductImages(
            @PathVariable Integer id,
            @RequestBody java.util.List<HinhAnhRequestDto> imageDtos) {
        try {
            // Get existing product
            SanPham product = productService.getProductById(id);
            if (product == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(java.util.Map.of("error", "Không tìm thấy sản phẩm"));
            }

            // Delete all existing images for this product
            var existingImages = hinhAnhSanPhamRepository.findBySanPhamMaSanPhamOrderByThuTuAsc(id);
            hinhAnhSanPhamRepository.deleteAll(existingImages);

            // Save new images
            java.util.List<HinhAnhSanPham> savedImages = new java.util.ArrayList<>();
            for (HinhAnhRequestDto dto : imageDtos) {
                HinhAnhSanPham img = new HinhAnhSanPham();
                img.setSanPham(product);
                img.setDuongDanHinhAnh(dto.getDuongDanHinhAnh());
                img.setThuTu(dto.getThuTu() != null ? dto.getThuTu() : 0);
                img.setLaAnhChinh(dto.getLaAnhChinh() != null ? dto.getLaAnhChinh() : false);
                img.setMoTa(dto.getMoTa());
                img.setTrangThai(dto.getTrangThai() != null ? dto.getTrangThai() : true);
                savedImages.add(hinhAnhSanPhamRepository.save(img));
            }

            return ResponseEntity.ok(java.util.Map.of(
                    "message", "Cập nhật hình ảnh thành công",
                    "count", savedImages.size()));
        } catch (Exception e) {
            e.printStackTrace(); // Log the error
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSanPham(@PathVariable Integer id) {
        productService.deleteSanPham(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * API chuyên sâu: Tạo sản phẩm kèm upload ảnh trong một request duy nhất
     * POST /api/products/with-images
     * Content-Type: multipart/form-data
     * 
     * Form data:
     * - tenSanPham: String (required)
     * - moTa: String (optional)
     * - maDanhMuc: Integer (optional)
     * - images: MultipartFile[] (danh sách file ảnh)
     * - thuTu: Integer[] (optional - thứ tự các ảnh)
     * - laAnhChinh: Boolean[] (optional - ảnh chính)
     * - moTaAnh: String[] (optional - mô tả từng ảnh)
     */
    @PostMapping(value = "/with-images", consumes = "multipart/form-data")
    public ResponseEntity<?> createSanPhamWithImages(
            @RequestParam("tenSanPham") String tenSanPham,
            @RequestParam(value = "moTa", required = false) String moTa,
            @RequestParam(value = "maNhaCungCap") Integer maNhaCungCap,
            @RequestParam(value = "maDanhMuc", required = false) Integer maDanhMuc,
            @RequestParam(value = "maBoSuuTap", required = false) Integer maBoSuuTap,
            @RequestParam(value = "diemThuong", required = false) Integer diemThuong,
            @RequestParam(value = "images", required = false) org.springframework.web.multipart.MultipartFile[] images,
            @RequestParam(value = "thuTu", required = false) Integer[] thuTuArray,
            @RequestParam(value = "laAnhChinh", required = false) Boolean[] laAnhChinhArray,
            @RequestParam(value = "moTaAnh", required = false) String[] moTaArray) {

        try {
            // Build SanPhamRequestDto
            SanPhamRequestDto sanPhamDto = new SanPhamRequestDto(
                    tenSanPham,
                    moTa,
                    maNhaCungCap,
                    maDanhMuc,
                    maBoSuuTap,
                    diemThuong,
                    null); // trangThai will default to ACTIVE in service

            // Gọi service
            var result = productService.createSanPhamWithImages(
                    sanPhamDto,
                    images,
                    thuTuArray,
                    laAnhChinhArray,
                    moTaArray);

            return new ResponseEntity<>(result, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("error", e.getMessage()));
        }
    }

    // ===== Chức năng tạo Biến thể cho sản phẩm =====
    @PostMapping("/{productId}/variants")
    public ResponseEntity<BienTheSanPham> createBienThe(@PathVariable Integer productId,
            @RequestBody BienTheRequestDto dto) {
        return new ResponseEntity<>(productService.createBienThe(productId, dto), HttpStatus.CREATED);
    }

    // ===== Chức năng gán Sản phẩm vào Danh mục =====
    @PostMapping("/{productId}/categories/{categoryId}")
    public ResponseEntity<?> addProductToCategory(@PathVariable Integer productId,
            @PathVariable Integer categoryId) {
        try {
            productService.addProductToCategory(productId, categoryId);
            return ResponseEntity.ok().body(java.util.Map.of("message", "Product assigned to category successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{productId}/variants")
    public ResponseEntity<List<? extends Object>> getVariantsByProductId(@PathVariable Integer productId) {
        List<BienTheSanPham> variants = productService.getVariantsByProductId(productId);
        // Map to DTO that includes attribute list and current discounts
        List<BienTheSanPhamDetailResponse> out = variants.stream().map(bt -> {
            BienTheSanPhamDetailResponse resp = BienTheSanPhamDetailResponse.builder()
                    .maBienThe(bt.getMaBienThe())
                    .sku(bt.getSku())
                    .giaBan(bt.getGiaBan())
                    .giaMua(bt.getGiaMua())
                    .soLuongTon(bt.getSoLuongTon())
                    .maSanPham(bt.getSanPham() != null ? bt.getSanPham().getMaSanPham() : null)
                    .tenSanPham(bt.getSanPham() != null ? bt.getSanPham().getTenSanPham() : null)
                    .build();

            // map attributes: ensure at most one value per attribute (group by attribute id
            // and pick first)
            if (bt.getBienTheThuocTinhs() != null) {
                java.util.Map<Object, java.util.List<com.noithat.qlnt.backend.entity.BienTheThuocTinh>> grouped = bt
                        .getBienTheThuocTinhs().stream()
                        .filter(btt -> btt != null)
                        .collect(java.util.stream.Collectors.groupingBy(btt -> {
                            if (btt.getThuocTinh() != null)
                                return btt.getThuocTinh().getMaThuocTinh();
                            // fallback grouping key when ThuocTinh is null: use the giaTri string
                            return btt.getGiaTri() != null ? btt.getGiaTri() : java.util.UUID.randomUUID().toString();
                        }));

                List<BienTheSanPhamDetailResponse.ThuocTinhBienTheResponse> attrs = grouped.values().stream()
                        .map(list -> list.get(0)) // pick first entry for each attribute
                        .map(btt -> BienTheSanPhamDetailResponse.ThuocTinhBienTheResponse.builder()
                                .id(btt.getId())
                                .maThuocTinh(btt.getThuocTinh() != null ? btt.getThuocTinh().getMaThuocTinh() : null)
                                .tenThuocTinh(btt.getThuocTinh() != null ? btt.getThuocTinh().getTenThuocTinh() : null)
                                .maGiaTriThuocTinh(null)
                                .giaTriThuocTinh(btt.getGiaTri())
                                .build())
                        .collect(java.util.stream.Collectors.toList());

                resp.setThuocTinhs(attrs);
            }

            // map current discounts if any (reuse repository via service layer would be
            // better but keep simple)
            // Attempt to include best available discount info
            // fetch any BienTheGiamGia mappings for this variant
            try {
                List<com.noithat.qlnt.backend.entity.BienTheGiamGia> discounts = bienTheGiamGiaRepository
                        .findByBienTheSanPham_MaBienThe(bt.getMaBienThe());
                if (discounts != null && !discounts.isEmpty()) {
                    List<BienTheSanPhamDetailResponse.GiamGiaHienTaiResponse> gd = discounts.stream()
                            .map(d -> BienTheSanPhamDetailResponse.GiamGiaHienTaiResponse.builder()
                                    .maChuongTrinhGiamGia(d.getChuongTrinhGiamGia() != null
                                            ? d.getChuongTrinhGiamGia().getMaChuongTrinhGiamGia()
                                            : null)
                                    .tenChuongTrinh(d.getChuongTrinhGiamGia() != null
                                            ? d.getChuongTrinhGiamGia().getTenChuongTrinh()
                                            : null)
                                    .giaSauGiam(d.getGiaSauGiam())
                                    .phanTramGiam(null)
                                    .build())
                            .collect(java.util.stream.Collectors.toList());
                    resp.setGiamGias(gd);
                }
            } catch (Exception ex) {
                // ignore
            }

            return resp;
        }).collect(java.util.stream.Collectors.toList());

        return ResponseEntity.ok().body(null != out ? java.util.List.copyOf(out) : java.util.Collections.emptyList());
    }
    /**
     * Remove product from category (set category to null)
     */
    @PatchMapping("/{productId}/categories/null")
    public ResponseEntity<?> removeProductFromCategory(@PathVariable Integer productId) {
        try {
            productService.removeProductFromCategory(productId);
            return ResponseEntity.ok().body(java.util.Map.of("message", "Product removed from category successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("error", e.getMessage()));
        }
    }
}