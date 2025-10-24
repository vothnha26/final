package com.noithat.qlnt.backend.service.impl;

import java.util.Set;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.noithat.qlnt.backend.dto.common.DanhMucDto;
import com.noithat.qlnt.backend.entity.DanhMuc;
import com.noithat.qlnt.backend.repository.DanhMucRepository;
import com.noithat.qlnt.backend.service.IDanhMucService;

import jakarta.persistence.EntityNotFoundException;

/**
 * Implementation của IDanhMucService
 * Xử lý logic nghiệp vụ quản lý danh mục sản phẩm
 */
@Service
public class DanhMucServiceImpl implements IDanhMucService {

    @Autowired
    private DanhMucRepository danhMucRepository;

    private DanhMuc findCategoryById(Integer id) {
        return danhMucRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy danh mục với id: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public DanhMuc getById(Integer id) {
        return findCategoryById(id);
    }

    @Override
    @Transactional
    public DanhMuc createDanhMuc(DanhMucDto dto) {
        DanhMuc danhMuc = new DanhMuc();
        danhMuc.setTenDanhMuc(dto.tenDanhMuc());
        danhMuc.setMoTa(dto.moTa());
        return danhMucRepository.save(danhMuc);
    }

    @Override
    @Transactional
    public void linkParentToChild(Integer childId, Integer parentId) {
        if (childId.equals(parentId)) {
            throw new IllegalArgumentException("Không thể tự liên kết cha-con với chính nó.");
        }
        DanhMuc child = findCategoryById(childId);
        DanhMuc parent = findCategoryById(parentId);
        // With adjacency-list design, assign single parent
        child.setParent(parent);
        danhMucRepository.save(child);
    }
    
    @Override
    @Transactional
    public DanhMuc updateDanhMuc(Integer id, DanhMucDto dto) {
        DanhMuc danhMucToUpdate = findCategoryById(id);
        danhMucToUpdate.setTenDanhMuc(dto.tenDanhMuc());
        danhMucToUpdate.setMoTa(dto.moTa());
        return danhMucRepository.save(danhMucToUpdate);
    }
    
    @Override
    @Transactional
    public void unlinkParentFromChild(Integer childId, Integer parentId) {
        DanhMuc child = findCategoryById(childId);
        DanhMuc parent = findCategoryById(parentId);
        // Only unlink if current parent matches
        if (child.getParent() != null && child.getParent().getMaDanhMuc().equals(parent.getMaDanhMuc())) {
            child.setParent(null);
            danhMucRepository.save(child);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Set<DanhMuc> getChildren(Integer parentId) {
        DanhMuc parent = findCategoryById(parentId);
        return parent.getChildren();
    }

    @Override
    @Transactional(readOnly = true)
    public Set<DanhMuc> getParents(Integer childId) {
        DanhMuc child = findCategoryById(childId);
        // In adjacency-list model a child has at most one parent; return a Set for compatibility
        return child.getParent() != null ? Set.of(child.getParent()) : Set.of();
    }

    @Override
    @Transactional(readOnly = true)
    public List<DanhMuc> getAll() {
        return danhMucRepository.findAll();
    }

    @Override
    @Transactional
    public void deleteDanhMuc(Integer id) {
        DanhMuc categoryToDelete = findCategoryById(id);
        // For adjacency-list: clear parent reference from children
        for (DanhMuc child : categoryToDelete.getChildren()) {
            child.setParent(null);
            danhMucRepository.save(child);
        }
        categoryToDelete.getChildren().clear();

        // Remove reference to parent if exists
        if (categoryToDelete.getParent() != null) {
            categoryToDelete.setParent(null);
        }

        danhMucRepository.delete(categoryToDelete);
    }
}
