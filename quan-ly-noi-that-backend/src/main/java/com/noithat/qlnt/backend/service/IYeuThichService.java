package com.noithat.qlnt.backend.service;

import com.noithat.qlnt.backend.entity.YeuThich;

import java.util.List;

public interface IYeuThichService {
    List<YeuThich> getFavoritesForCustomer(Integer maKhachHang);

    YeuThich addFavorite(Integer maKhachHang, Integer maSanPham);

    void removeFavorite(Integer maKhachHang, Integer maSanPham);

    boolean isFavorite(Integer maKhachHang, Integer maSanPham);
}
