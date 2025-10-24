package com.noithat.qlnt.backend.repository;

import com.noithat.qlnt.backend.entity.BienTheGiamGia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BienTheGiamGiaRepository extends JpaRepository<BienTheGiamGia, BienTheGiamGia.BienTheGiamGiaId> {
    
    /**
     * Tìm tất cả mapping theo biến thể
     */
    List<BienTheGiamGia> findByBienTheSanPham_MaBienThe(Integer maBienThe);
    
    /**
     * Tìm tất cả mapping theo chương trình giảm giá
     */
    List<BienTheGiamGia> findByChuongTrinhGiamGia_MaChuongTrinhGiamGia(Integer maChuongTrinh);
}
