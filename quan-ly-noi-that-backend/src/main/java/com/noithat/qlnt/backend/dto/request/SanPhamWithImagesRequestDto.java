package com.noithat.qlnt.backend.dto.request;

import lombok.*;

import java.util.List;

/**
 * DTO để tạo sản phẩm kèm hình ảnh trong một request duy nhất
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SanPhamWithImagesRequestDto {
    
    // Thông tin sản phẩm cơ bản
    private String tenSanPham;
    private String moTa;
    private String moTaChiTiet;
    private Integer maDanhMuc;
    
    // Diem thuong (bonus points)
    private Integer diemThuong;
    
    // Danh sách đường dẫn ảnh (từ upload hoặc URL)
    private List<String> imageUrls;
    
    // Thứ tự của từng ảnh (optional, nếu không có sẽ theo index)
    private List<Integer> thuTuList;
    
    // Đánh dấu ảnh chính (optional, mặc định ảnh đầu tiên)
    private List<Boolean> laAnhChinhList;
    
    // Mô tả cho từng ảnh (optional)
    private List<String> moTaAnhList;
}
