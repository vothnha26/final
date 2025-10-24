package com.noithat.qlnt.backend.service;

import com.noithat.qlnt.backend.dto.request.BienTheRequestDto;
import com.noithat.qlnt.backend.dto.request.SanPhamRequestDto;
import com.noithat.qlnt.backend.dto.response.SanPhamWithImagesResponseDto;
import com.noithat.qlnt.backend.entity.BienTheSanPham;
import com.noithat.qlnt.backend.entity.SanPham;
import com.noithat.qlnt.backend.dto.response.ShopProductResponseDto;
import com.noithat.qlnt.backend.dto.response.ProductDetailDto;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

public interface IProductService {
    List<SanPhamWithImagesResponseDto> getAllProducts();

    List<ShopProductResponseDto> getProductsForShop();
    
    // New: paged shop product response
    com.noithat.qlnt.backend.dto.response.ShopProductPageResponseDto getProductsForShop(int page, int size);

    SanPham getProductById(Integer id);

    ProductDetailDto getProductDetailById(Integer id);

    // New: return product DTO shaped for frontend product-with-images expectations
    SanPhamWithImagesResponseDto getProductWithImagesById(Integer id);

    SanPham createSanPham(SanPhamRequestDto dto);

    SanPham updateSanPham(Integer id, SanPhamRequestDto dto);

    SanPham patchSanPham(Integer id, com.noithat.qlnt.backend.dto.request.SanPhamPatchRequestDto request);

    void deleteSanPham(Integer id);


    void addProductToCategory(Integer productId, Integer categoryId);

    /**
     * Remove product from category (set category to null)
     */
    void removeProductFromCategory(Integer productId);

    BienTheSanPham createBienThe(Integer sanPhamId, BienTheRequestDto dto);

    List<BienTheSanPham> getVariantsByProductId(Integer productId);

    // API mới: Tạo sản phẩm kèm upload ảnh
    SanPhamWithImagesResponseDto createSanPhamWithImages(
            SanPhamRequestDto sanPhamDto,
            MultipartFile[] images,
            Integer[] thuTuArray,
            Boolean[] laAnhChinhArray,
            String[] moTaArray);

    // API mới: Lấy chi tiết sản phẩm đầy đủ với biến thể, thuộc tính và giá giảm
    com.noithat.qlnt.backend.dto.response.ProductDetailWithVariantsDto getProductDetailWithVariants(Integer id);

    // API mới: Lấy danh sách sản phẩm cơ bản cho category assignment UI
    java.util.List<com.noithat.qlnt.backend.dto.response.ProductBasicResponse> getBasicProducts();

    // API so sánh tổng nhập/xuất theo sản phẩm (gộp các biến thể)
    java.util.List<com.noithat.qlnt.backend.dto.response.ProductCompareResponse> compareProductsAggregate(java.util.List<Integer> productIds);
}
