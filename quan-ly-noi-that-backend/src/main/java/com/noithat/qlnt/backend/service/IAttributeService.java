package com.noithat.qlnt.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.noithat.qlnt.backend.dto.common.ThuocTinhDto;
import com.noithat.qlnt.backend.entity.ThuocTinh;

@Service
public interface IAttributeService {

    // ----- Quản lý Thuộc Tính -----
    ThuocTinh createThuocTinh(ThuocTinhDto dto);

    List<ThuocTinh> getAllThuocTinh();

    // ----- HÀM MỚI -----
    ThuocTinh updateThuocTinh(Integer id, ThuocTinhDto dto);

    void deleteThuocTinh(Integer id);

    void deleteGiaTriThuocTinh(Integer id);
}