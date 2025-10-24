package com.noithat.qlnt.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.noithat.qlnt.backend.dto.common.BoSuuTapDto;
import com.noithat.qlnt.backend.dto.response.BoSuuTapResponse;
import com.noithat.qlnt.backend.dto.response.CollectionsSummary;
import com.noithat.qlnt.backend.entity.BoSuuTap;
import com.noithat.qlnt.backend.entity.SanPham;
import com.noithat.qlnt.backend.service.IBoSuuTapService;

@RestController
@RequestMapping("/api/collections")
public class BoSuuTapController {

    @Autowired
    private IBoSuuTapService boSuuTapService;

    @Autowired
    private com.noithat.qlnt.backend.repository.BoSuuTapRepository boSuuTapRepository;

    @Autowired
    private com.noithat.qlnt.backend.repository.SanPhamRepository sanPhamRepository;

    @GetMapping
    public ResponseEntity<List<BoSuuTapResponse>> getAll() {
        var list = boSuuTapService.getAll();
        var resp = list.stream().map(bst -> {
            long count = sanPhamRepository.countByBoSuuTap_MaBoSuuTap(bst.getMaBoSuuTap());
            return BoSuuTapResponse.builder()
                    .maBoSuuTap(bst.getMaBoSuuTap())
                    .tenBoSuuTap(bst.getTenBoSuuTap())
                    .moTa(bst.getMoTa())
                    .hinhAnh(bst.getHinhAnh())
                    .soLuongSanPham(count)
                    .build();
        }).toList();
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/{id}")
    public ResponseEntity<BoSuuTapResponse> getById(@PathVariable Integer id) {
        var bst = boSuuTapService.getById(id);
        long count = sanPhamRepository.countByBoSuuTap_MaBoSuuTap(bst.getMaBoSuuTap());
        var resp = BoSuuTapResponse.builder()
                .maBoSuuTap(bst.getMaBoSuuTap())
                .tenBoSuuTap(bst.getTenBoSuuTap())
                .moTa(bst.getMoTa())
                .hinhAnh(bst.getHinhAnh())
                .soLuongSanPham(count)
                .build();
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/{id}/image")
    public ResponseEntity<BoSuuTap> uploadImage(@PathVariable Integer id, @org.springframework.web.bind.annotation.RequestParam("image") org.springframework.web.multipart.MultipartFile image) {
        var bst = boSuuTapRepository.findById(id).orElseThrow(() -> new RuntimeException("Collection not found: " + id));

        if (image != null && !image.isEmpty()) {
            try {
                String uploadDir = "uploads/collections/" + id;
                java.nio.file.Path uploadPath = java.nio.file.Paths.get(uploadDir);
                if (!java.nio.file.Files.exists(uploadPath)) {
                    java.nio.file.Files.createDirectories(uploadPath);
                }

                String originalFilename = image.getOriginalFilename();
                String ext = "";
                if (originalFilename != null && originalFilename.contains(".")) {
                    ext = originalFilename.substring(originalFilename.lastIndexOf("."));
                }
                String unique = java.util.UUID.randomUUID().toString() + ext;
                java.nio.file.Path filePath = uploadPath.resolve(unique);
                java.nio.file.Files.copy(image.getInputStream(), filePath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);

                String imageUrl = "/" + uploadDir + "/" + unique;
                bst.setHinhAnh(imageUrl);
                boSuuTapRepository.save(bst);
            } catch (Exception ex) {
                throw new RuntimeException("Failed to upload image: " + ex.getMessage(), ex);
            }
        }

        return ResponseEntity.ok(bst);
    }

    @PostMapping
    public ResponseEntity<BoSuuTap> create(@RequestBody BoSuuTapDto dto) {
        return new ResponseEntity<>(boSuuTapService.create(dto), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<BoSuuTap> update(@PathVariable Integer id, @RequestBody BoSuuTapDto dto) {
        return ResponseEntity.ok(boSuuTapService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        boSuuTapService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/summary")
    public ResponseEntity<CollectionsSummary> getSummary() {
        long totalCollections = boSuuTapRepository.count();
        long totalProducts = sanPhamRepository.count();

        // Count empty collections
        long empty = boSuuTapRepository.findAll().stream()
                .filter(bst -> sanPhamRepository.countByBoSuuTap_MaBoSuuTap(bst.getMaBoSuuTap()) == 0)
                .count();

        long avg = 0;
        if (totalCollections > 0) {
            avg = Math.round((double) totalProducts / (double) totalCollections);
        }

        var summary = CollectionsSummary.builder()
                .totalCollections(totalCollections)
                .totalProducts(totalProducts)
                .averagePerCollection(avg)
                .emptyCollections(empty)
                .build();

        return ResponseEntity.ok(summary);
    }

    @GetMapping("/{collectionId}/products")
    public ResponseEntity<List<SanPham>> getProductsInCollection(@PathVariable Integer collectionId) {
        return ResponseEntity.ok(boSuuTapService.getProductsInCollection(collectionId));
    }

    @PostMapping("/{collectionId}/products/{productId}")
    public ResponseEntity<Void> addProductToCollection(@PathVariable Integer collectionId, @PathVariable Integer productId) {
        boSuuTapService.addProductToCollection(collectionId, productId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{collectionId}/products/{productId}")
    public ResponseEntity<Void> removeProductFromCollection(@PathVariable Integer collectionId, @PathVariable Integer productId) {
        boSuuTapService.removeProductFromCollection(collectionId, productId);
        return ResponseEntity.noContent().build();
    }
}