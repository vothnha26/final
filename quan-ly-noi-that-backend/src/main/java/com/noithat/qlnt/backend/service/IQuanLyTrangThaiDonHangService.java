package com.noithat.qlnt.backend.service;

import com.noithat.qlnt.backend.entity.DonHang;
import com.noithat.qlnt.backend.entity.LichSuTrangThaiDonHang;
import java.util.List;
import java.util.Map;

public interface IQuanLyTrangThaiDonHangService {
    // Order status constants (moved from the concrete service)
    String CHO_XAC_NHAN = "CHO_XAC_NHAN";
    String XAC_NHAN = "XAC_NHAN";
    String DANG_CHUAN_BI = "DANG_CHUAN_BI";
    String DANG_GIAO_HANG = "DANG_GIAO_HANG"; // Đang giao hàng
    String DA_GIAO_HANG = "DA_GIAO_HANG"; // Đã giao hàng
    String HOAN_THANH = "HOAN_THANH";
    String HUY_BO = "HUY_BO";
    String DA_HUY = "DA_HUY";
    // Vietnamese-named method kept for backward compatibility
    void capNhatTrangThai(Integer maDonHang, String trangThai, String nguoiThayDoi, String ghiChu);

    // Core order status operations (used by controllers)
    boolean changeOrderStatus(Integer maDonHang, String trangThaiMoi, String nguoiThayDoi, String ghiChu);
    boolean canChangeStatus(Integer maDonHang, String trangThaiMoi);

    // Query methods
    List<DonHang> getDonHangTheoTrangThai(String trangThai);
    List<DonHang> getOrdersByStatus(String trangThai);
    List<DonHang> getPendingOrders();
    List<DonHang> getShippingOrders();
    List<DonHang> getOrdersNeedingAttention();
    List<LichSuTrangThaiDonHang> getOrderStatusHistory(Integer maDonHang);

    // Statistics
    Map<String, Long> countOrdersByStatus();
    List<Object[]> getProcessingTimeStats();
}
