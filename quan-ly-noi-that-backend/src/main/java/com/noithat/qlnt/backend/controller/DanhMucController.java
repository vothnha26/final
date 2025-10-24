package com.noithat.qlnt.backend.controller;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

import com.noithat.qlnt.backend.dto.common.DanhMucDto;
import com.noithat.qlnt.backend.dto.common.DanhMucResponse;
import com.noithat.qlnt.backend.entity.DanhMuc;
import com.noithat.qlnt.backend.service.IDanhMucService;

@RestController
@RequestMapping("/api/categories")
public class DanhMucController {
    private static final Logger logger = LoggerFactory.getLogger(DanhMucController.class);

    @Autowired
    private IDanhMucService danhMucService;

    @Autowired
    private com.noithat.qlnt.backend.repository.SanPhamRepository sanPhamRepository;

    /**
     * Get all categories
     */
    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<DanhMucResponse>> getAllCategories() {
        List<DanhMuc> list = danhMucService.getAll();
        List<DanhMucResponse> resp = list.stream().map(dm -> {
            Integer parentId = dm.getParent() != null ? dm.getParent().getMaDanhMuc() : null;
            String parentName = dm.getParent() != null ? dm.getParent().getTenDanhMuc() : null;
            List<Integer> childrenIds = dm.getChildren() == null ? List.of()
                    : dm.getChildren().stream().map(DanhMuc::getMaDanhMuc).collect(Collectors.toList());
            Long productCount = Long.valueOf(sanPhamRepository.countByDanhMuc_MaDanhMuc(dm.getMaDanhMuc()));
            return new DanhMucResponse(
                    dm.getMaDanhMuc(),
                    dm.getTenDanhMuc(),
                    dm.getMoTa(),
                    parentId,
                    parentId, // maDanhMucCha alias
                    parentName, // tenDanhMucCha
                    childrenIds,
                    productCount);
        }).collect(Collectors.toList());
        return ResponseEntity.ok(resp);
    }

    /**
     * Get a single category by id
     */
    @GetMapping("/{id}")
    public ResponseEntity<DanhMuc> getCategoryById(@PathVariable Integer id) {
        DanhMuc cat = danhMucService.getById(id);
        return ResponseEntity.ok(cat);
    }
    // NOTE: Single-get by id is not exposed here because the service interface
    // does not currently provide a getById method. If you add getById to the
    // service, you can re-enable this endpoint.

    /**
     * Create a new category
     */
    @PostMapping
    public ResponseEntity<DanhMuc> createDanhMuc(@RequestBody DanhMucDto dto) {
        DanhMuc newCategory = danhMucService.createDanhMuc(dto);
        logger.info("Created category id={}", newCategory.getMaDanhMuc());
        return new ResponseEntity<>(newCategory, HttpStatus.CREATED);
    }

    /**
     * Update an existing category
     */
    @PutMapping("/{id}")
    public ResponseEntity<DanhMuc> updateDanhMuc(@PathVariable Integer id, @RequestBody DanhMucDto dto) {
        DanhMuc updatedCategory = danhMucService.updateDanhMuc(id, dto);
        logger.info("Updated category id={}", updatedCategory.getMaDanhMuc());
        return ResponseEntity.ok(updatedCategory);
    }

    /**
     * Delete a category
     */
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteDanhMuc(@PathVariable Integer id) {
        // Set all products in this category to null before deleting
        List<com.noithat.qlnt.backend.entity.SanPham> products = sanPhamRepository.findByDanhMuc_MaDanhMuc(id);
        for (com.noithat.qlnt.backend.entity.SanPham sp : products) {
            sp.setDanhMuc(null);
            sanPhamRepository.save(sp);
        }
        danhMucService.deleteDanhMuc(id);
        logger.info("Deleted category id={}", id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Get children of a category
     */
    @GetMapping("/{id}/children")
    public ResponseEntity<Set<DanhMuc>> getChildren(@PathVariable Integer id) {
        return ResponseEntity.ok(danhMucService.getChildren(id));
    }

    /**
     * Get parents of a category
     */
    @GetMapping("/{id}/parents")
    public ResponseEntity<Set<DanhMuc>> getParents(@PathVariable Integer id) {
        return ResponseEntity.ok(danhMucService.getParents(id));
    }

    /**
     * Link a parent category to a child
     */
    @PostMapping("/{childId}/parents/{parentId}")
    public ResponseEntity<Void> linkParentToChild(@PathVariable Integer childId, @PathVariable Integer parentId) {
        danhMucService.linkParentToChild(childId, parentId);
        logger.info("Linked parent {} -> child {}", parentId, childId);
        return ResponseEntity.ok().build();
    }

    /**
     * Unlink a parent from a child
     */
    @DeleteMapping("/{childId}/parents/{parentId}")
    public ResponseEntity<Void> unlinkParentFromChild(@PathVariable Integer childId, @PathVariable Integer parentId) {
        danhMucService.unlinkParentFromChild(childId, parentId);
        logger.info("Unlinked parent {} from child {}", parentId, childId);
        return ResponseEntity.noContent().build();
    }
}