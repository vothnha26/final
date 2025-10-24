package com.noithat.qlnt.backend.service;

import com.noithat.qlnt.backend.dto.common.NhaCungCapDto;
import com.noithat.qlnt.backend.entity.NhaCungCap;

import java.util.List;

/**
 * Interface quản lý nhà cung cấp
 */
public interface INhaCungCapService {
    
    /**
     * Lấy tất cả nhà cung cấp
     */
    List<NhaCungCap> getAllNhaCungCaps();
    
    /**
     * Tạo nhà cung cấp mới
     */
    NhaCungCap createNhaCungCap(NhaCungCapDto dto);
    
    /**
     * Cập nhật nhà cung cấp
     */
    NhaCungCap updateNhaCungCap(Integer id, NhaCungCapDto dto);
    
    /**
     * Xóa nhà cung cấp
    */
    void deleteNhaCungCap(Integer id);
}
