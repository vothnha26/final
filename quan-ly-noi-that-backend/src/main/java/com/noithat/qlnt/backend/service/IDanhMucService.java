package com.noithat.qlnt.backend.service;

import com.noithat.qlnt.backend.dto.common.DanhMucDto;
import com.noithat.qlnt.backend.entity.DanhMuc;

import java.util.Set;
import java.util.List;

/**
 * Interface quản lý danh mục sản phẩm
 */
public interface IDanhMucService {
    
    /**
     * Tạo danh mục mới
     */
    DanhMuc createDanhMuc(DanhMucDto dto);
    
    /**
     * Liên kết danh mục cha với danh mục con
     */
    void linkParentToChild(Integer childId, Integer parentId);
    
    /**
     * Cập nhật danh mục
     */
    DanhMuc updateDanhMuc(Integer id, DanhMucDto dto);
    
    /**
     * Hủy liên kết danh mục cha với danh mục con
     */
    void unlinkParentFromChild(Integer childId, Integer parentId);
    
    /**
     * Lấy danh sách danh mục con
     */
    Set<DanhMuc> getChildren(Integer parentId);
    
    /**
     * Lấy danh sách danh mục cha
     */
    Set<DanhMuc> getParents(Integer childId);

    /**
     * Lấy toàn bộ danh mục (dùng cho GET /api/categories)
     */
    List<DanhMuc> getAll();
    
    /**
     * Lấy một danh mục theo id
     */
    DanhMuc getById(Integer id);
    /**
     * Xóa danh mục
     */
    void deleteDanhMuc(Integer id);
}
