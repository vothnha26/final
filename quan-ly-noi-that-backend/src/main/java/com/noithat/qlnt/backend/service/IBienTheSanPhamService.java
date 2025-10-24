package com.noithat.qlnt.backend.service;

import com.noithat.qlnt.backend.entity.BienTheSanPham;

import java.util.List;

public interface IBienTheSanPhamService {
    List<BienTheSanPham> getAll();
    BienTheSanPham getById(Integer id);
    List<BienTheSanPham> getBySanPhamId(Integer maSanPham);
    BienTheSanPham create(BienTheSanPham bienThe);
    BienTheSanPham update(Integer id, BienTheSanPham bienThe);
    void delete(Integer id);
}
