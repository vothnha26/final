package com.noithat.qlnt.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.noithat.qlnt.backend.dto.common.BoSuuTapDto;
import com.noithat.qlnt.backend.entity.BoSuuTap;
import com.noithat.qlnt.backend.entity.SanPham;

@Service
public interface IBoSuuTapService {
    List<BoSuuTap> getAll();

    BoSuuTap getById(Integer id);

    BoSuuTap create(BoSuuTapDto dto);

    BoSuuTap update(Integer id, BoSuuTapDto dto);

    void delete(Integer id);

    void addProductToCollection(Integer collectionId, Integer productId);

    void removeProductFromCollection(Integer collectionId, Integer productId);

    List<SanPham> getProductsInCollection(Integer collectionId);
}