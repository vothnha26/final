package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.dto.request.HinhAnhSanPhamRequestDto;
import com.noithat.qlnt.backend.dto.response.HinhAnhSanPhamResponseDto;
import com.noithat.qlnt.backend.entity.HinhAnhSanPham;
import com.noithat.qlnt.backend.service.IHinhAnhSanPhamService;
import com.noithat.qlnt.backend.service.CloudinaryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Controller quản lý hình ảnh sản phẩm
 * Endpoints:
 * - GET    /api/images - Lấy tất cả hình ảnh (phân trang)
 * - GET    /api/images/{id} - Lấy hình ảnh theo ID
 * - GET    /api/products/{productId}/images - Lấy tất cả hình ảnh của sản phẩm
 * - GET    /api/products/{productId}/images/main - Lấy hình ảnh chính của sản phẩm
 * - POST   /api/products/{productId}/images - Thêm hình ảnh cho sản phẩm
 * - PUT    /api/images/{id} - Cập nhật hình ảnh
 * - PUT    /api/images/{id}/set-main - Đặt làm ảnh chính
 * - PUT    /api/images/{id}/order - Cập nhật thứ tự
 * - DELETE /api/images/{id} - Xóa hình ảnh
 * - DELETE /api/products/{productId}/images - Xóa tất cả hình ảnh của sản phẩm
 */
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "${app.cors.allowed-origins}", allowCredentials = "true")
@RequiredArgsConstructor
public class HinhAnhSanPhamController {

    private final IHinhAnhSanPhamService hinhAnhService;
    private final CloudinaryService cloudinaryService;

    /**
     * Lấy tất cả hình ảnh với phân trang
     * GET /api/images?page=0&size=10&sortBy=thuTu&sortDir=asc
     */
    @GetMapping("/images")
    public ResponseEntity<Page<HinhAnhSanPhamResponseDto>> getAllImages(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "thuTu") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {
        
        Sort sort = sortDir.equalsIgnoreCase("desc") 
            ? Sort.by(sortBy).descending() 
            : Sort.by(sortBy).ascending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        Page<HinhAnhSanPham> imagesPage = hinhAnhService.getAllHinhAnh(pageable);
        
        Page<HinhAnhSanPhamResponseDto> responsePage = imagesPage.map(HinhAnhSanPhamResponseDto::fromEntity);
        
        return ResponseEntity.ok(responsePage);
    }

    /**
     * Lấy hình ảnh theo ID
     * GET /api/images/{id}
     */
    @GetMapping("/images/{id}")
    public ResponseEntity<HinhAnhSanPhamResponseDto> getImageById(@PathVariable Integer id) {
        HinhAnhSanPham hinhAnh = hinhAnhService.getHinhAnhById(id);
        return ResponseEntity.ok(HinhAnhSanPhamResponseDto.fromEntity(hinhAnh));
    }

    /**
     * Lấy tất cả hình ảnh của một sản phẩm
     * GET /api/products/{productId}/images
     */
    @GetMapping("/products/{productId}/images")
    public ResponseEntity<List<HinhAnhSanPhamResponseDto>> getImagesByProduct(
            @PathVariable Integer productId) {
        
        List<HinhAnhSanPham> images = hinhAnhService.getHinhAnhBySanPham(productId);
        
        List<HinhAnhSanPhamResponseDto> response = images.stream()
            .map(HinhAnhSanPhamResponseDto::fromEntity)
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    /**
     * Lấy hình ảnh chính của sản phẩm
     * GET /api/products/{productId}/images/main
     */
    @GetMapping("/products/{productId}/images/main")
    public ResponseEntity<HinhAnhSanPhamResponseDto> getMainImage(
            @PathVariable Integer productId) {
        
        HinhAnhSanPham mainImage = hinhAnhService.getHinhAnhChinh(productId);
        
        if (mainImage == null) {
            return ResponseEntity.noContent().build();
        }
        
        return ResponseEntity.ok(HinhAnhSanPhamResponseDto.fromEntity(mainImage));
    }

    /**
     * Thêm hình ảnh mới cho sản phẩm
     * POST /api/products/{productId}/images
     * Body: {
     *   "duongDanHinhAnh": "https://example.com/image.jpg",
     *   "thuTu": 0,
     *   "laAnhChinh": true,
     *   "moTa": "Ảnh chính sản phẩm",
     *   "trangThai": true
     * }
     */
    @PostMapping("/products/{productId}/images")
    public ResponseEntity<HinhAnhSanPhamResponseDto> createImage(
            @PathVariable Integer productId,
            @Valid @RequestBody HinhAnhSanPhamRequestDto request) {
        
        HinhAnhSanPham created = hinhAnhService.createHinhAnh(productId, request);
        
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(HinhAnhSanPhamResponseDto.fromEntity(created));
    }

    /**
     * Upload nhiều ảnh thực tế cho sản phẩm (MultipartFile)
     * POST /api/products/{productId}/images/upload
     * Content-Type: multipart/form-data
     * Form data:
     *   - images: MultipartFile[] (danh sách file ảnh)
     *   - thuTu: Integer[] (optional - thứ tự các ảnh, mặc định theo index)
     *   - laAnhChinh: Boolean[] (optional - ảnh nào là ảnh chính, mặc định ảnh đầu)
     */
    @CrossOrigin(origins = "${app.cors.allowed-origins}", allowCredentials = "true", allowedHeaders = "*")
    @PostMapping("/products/{productId}/images/upload")
    public ResponseEntity<?> uploadImages(
            @PathVariable Integer productId,
            @RequestParam("images") MultipartFile[] images,
            @RequestParam(value = "thuTu", required = false) Integer[] thuTuArray,
            @RequestParam(value = "laAnhChinh", required = false) Boolean[] laAnhChinhArray) {
        
        try {
            List<HinhAnhSanPhamResponseDto> uploadedImages = new ArrayList<>();
            
            for (int i = 0; i < images.length; i++) {
                MultipartFile file = images[i];
                
                // Validate file
                if (file.isEmpty()) {
                    continue;
                }
                
                // Kiểm tra định dạng ảnh
                String contentType = file.getContentType();
                if (contentType == null || !contentType.startsWith("image/")) {
                    continue; // Bỏ qua file không phải ảnh
                }

                // Upload to Cloudinary
                String imageUrl = cloudinaryService.uploadImage(file, "products/" + productId);
                
                // Xác định thứ tự
                Integer thuTu = (thuTuArray != null && i < thuTuArray.length) 
                    ? thuTuArray[i] 
                    : i;
                
                // Xác định ảnh chính (mặc định ảnh đầu tiên)
                Boolean laAnhChinh = (laAnhChinhArray != null && i < laAnhChinhArray.length) 
                    ? laAnhChinhArray[i] 
                    : (i == 0);
                
                // Tạo DTO và lưu vào database
                HinhAnhSanPhamRequestDto dto = new HinhAnhSanPhamRequestDto(
                    imageUrl,
                    thuTu,
                    laAnhChinh,
                    "Ảnh sản phẩm " + (i + 1),
                    true
                );
                
                HinhAnhSanPham saved = hinhAnhService.createHinhAnh(productId, dto);
                uploadedImages.add(HinhAnhSanPhamResponseDto.fromEntity(saved));
            }
            
            if (uploadedImages.isEmpty()) {
                return ResponseEntity.badRequest().body("Không có ảnh hợp lệ nào được upload");
            }
            
            return ResponseEntity.status(HttpStatus.CREATED).body(uploadedImages);
            
        } catch (IOException e) {
            // Log stack trace for debugging
            java.io.StringWriter sw = new java.io.StringWriter();
            java.io.PrintWriter pw = new java.io.PrintWriter(sw);
            e.printStackTrace(pw);
            String stack = sw.toString();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(java.util.Map.of("error", "Lỗi khi upload ảnh", "exception", stack));
        }
    }

    /**
     * Cập nhật thông tin hình ảnh
     * PUT /api/images/{id}
     * Body: {
     *   "duongDanHinhAnh": "https://example.com/new-image.jpg",
     *   "thuTu": 1,
     *   "laAnhChinh": false,
     *   "moTa": "Ảnh phụ",
     *   "trangThai": true
     * }
     */
    @PutMapping("/images/{id}")
    public ResponseEntity<HinhAnhSanPhamResponseDto> updateImage(
            @PathVariable Integer id,
            @Valid @RequestBody HinhAnhSanPhamRequestDto request) {
        
        HinhAnhSanPham updated = hinhAnhService.updateHinhAnh(id, request);
        
        return ResponseEntity.ok(HinhAnhSanPhamResponseDto.fromEntity(updated));
    }

    /**
     * Đặt hình ảnh làm ảnh chính
     * PUT /api/images/{id}/set-main
     */
    @PutMapping("/images/{id}/set-main")
    public ResponseEntity<HinhAnhSanPhamResponseDto> setAsMainImage(@PathVariable Integer id) {
        HinhAnhSanPham updated = hinhAnhService.setAsMainImage(id);
        return ResponseEntity.ok(HinhAnhSanPhamResponseDto.fromEntity(updated));
    }

    /**
     * Cập nhật thứ tự hình ảnh
     * PUT /api/images/{id}/order?thuTu=2
     */
    @PutMapping("/images/{id}/order")
    public ResponseEntity<HinhAnhSanPhamResponseDto> updateImageOrder(
            @PathVariable Integer id,
            @RequestParam Integer thuTu) {
        
        HinhAnhSanPham updated = hinhAnhService.updateThuTu(id, thuTu);
        return ResponseEntity.ok(HinhAnhSanPhamResponseDto.fromEntity(updated));
    }

    /**
     * Xóa hình ảnh
     * DELETE /api/images/{id}
     */
    @DeleteMapping("/images/{id}")
    public ResponseEntity<Void> deleteImage(@PathVariable Integer id) {
        // Get image to delete from Cloudinary
        HinhAnhSanPham image = hinhAnhService.getHinhAnhById(id);
        if (image != null && image.getDuongDanHinhAnh() != null) {
            try {
                cloudinaryService.deleteImage(image.getDuongDanHinhAnh());
            } catch (Exception e) {
                // Log but continue with database deletion
                System.err.println("Failed to delete image from Cloudinary: " + e.getMessage());
            }
        }
        hinhAnhService.deleteHinhAnh(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Xóa tất cả hình ảnh của sản phẩm
     * DELETE /api/products/{productId}/images
     */
    @DeleteMapping("/products/{productId}/images")
    public ResponseEntity<Void> deleteAllImagesByProduct(@PathVariable Integer productId) {
        // Get all images for this product
        List<HinhAnhSanPham> images = hinhAnhService.getHinhAnhBySanPham(productId);
        for (HinhAnhSanPham image : images) {
            if (image.getDuongDanHinhAnh() != null) {
                try {
                    cloudinaryService.deleteImage(image.getDuongDanHinhAnh());
                } catch (Exception e) {
                    System.err.println("Failed to delete image from Cloudinary: " + e.getMessage());
                }
            }
        }
        hinhAnhService.deleteAllBySanPham(productId);
        return ResponseEntity.noContent().build();
    }

    /**
     * Thêm nhiều hình ảnh cùng lúc
     * POST /api/products/{productId}/images/batch
     * Body: [
     *   {"duongDanHinhAnh": "url1", "thuTu": 0, "laAnhChinh": true},
     *   {"duongDanHinhAnh": "url2", "thuTu": 1, "laAnhChinh": false}
     * ]
     */
    @PostMapping("/products/{productId}/images/batch")
    public ResponseEntity<List<HinhAnhSanPhamResponseDto>> createMultipleImages(
            @PathVariable Integer productId,
            @Valid @RequestBody List<HinhAnhSanPhamRequestDto> requests) {
        
        List<HinhAnhSanPham> createdImages = requests.stream()
            .map(req -> hinhAnhService.createHinhAnh(productId, req))
            .collect(Collectors.toList());
        
        List<HinhAnhSanPhamResponseDto> response = createdImages.stream()
            .map(HinhAnhSanPhamResponseDto::fromEntity)
            .collect(Collectors.toList());
        
        return ResponseEntity
            .status(HttpStatus.CREATED)
            .body(response);
    }
}
