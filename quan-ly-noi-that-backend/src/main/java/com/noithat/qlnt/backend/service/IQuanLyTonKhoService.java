package com.noithat.qlnt.backend.service;

import com.noithat.qlnt.backend.entity.BienTheSanPham;
import com.noithat.qlnt.backend.entity.LichSuTonKho;
import org.springframework.http.ResponseEntity;
import java.util.List;
import java.util.Map;

public interface IQuanLyTonKhoService {
    // maNhaCungCap is optional and may be null when supplier is not provided
    boolean importStock(Integer maBienThe, Integer quantity, String nguoiThucHien, String lyDo, Integer maNhaCungCap);
    boolean exportStock(Integer maBienThe, Integer quantity, String maThamChieu, String nguoiThucHien, String lyDo);
    boolean reserveProduct(Integer maBienThe, Integer quantity, String maThamChieu, String nguoiThucHien);
    boolean releaseReservation(Integer maBienThe, Integer quantity, String maThamChieu, String nguoiThucHien);
    boolean confirmSale(Integer maBienThe, Integer quantity, String maThamChieu, String nguoiThucHien);
    boolean returnProduct(Integer maBienThe, Integer quantity, String maThamChieu, String nguoiThucHien, String lyDo);
    boolean adjustStock(Integer maBienThe, Integer newQuantity, String lyDo, String nguoiThucHien);
    List<BienTheSanPham> getLowStockProducts();
    List<BienTheSanPham> getOutOfStockProducts();
    List<LichSuTonKho> getStockHistory(Integer maBienThe);
    List<LichSuTonKho> getAllStockHistoryNhap();
    List<LichSuTonKho> getStockHistoryNhapBetween(java.time.LocalDateTime from, java.time.LocalDateTime to);
    List<LichSuTonKho> getAllStockHistory();
    List<LichSuTonKho> getStockHistoryBetween(java.time.LocalDateTime from, java.time.LocalDateTime to);
    boolean isAvailableForSale(Integer maBienThe, Integer quantity);
    Integer getAvailableQuantity(Integer maBienThe);
    Double getTotalStockValue();
    List<Object[]> getStockSummaryByProduct();
    List<Object[]> getStockSummaryByCategory();
    ResponseEntity<Map<String, Object>> getCurrentStockInfo(Integer maBienThe);
}
