package com.noithat.qlnt.backend.service;

import com.noithat.qlnt.backend.entity.DonHang;
import com.noithat.qlnt.backend.entity.LichSuTrangThaiDonHang;
import com.noithat.qlnt.backend.entity.ChiTietDonHang;
import com.noithat.qlnt.backend.repository.DonHangRepository;
import com.noithat.qlnt.backend.repository.LichSuTrangThaiDonHangRepository;
import com.noithat.qlnt.backend.repository.ChiTietDonHangRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

@Service
@Transactional
public class QuanLyTrangThaiDonHangService {
    
    @Autowired
    private DonHangRepository donHangRepository;
    
    @Autowired
    private LichSuTrangThaiDonHangRepository lichSuTrangThaiRepository;
    
    @Autowired
    private ChiTietDonHangRepository chiTietDonHangRepository;
    
    @Autowired
    private QuanLyTonKhoService quanLyTonKhoService;
    
    // =================== ORDER STATUS MANAGEMENT ===================
    
    /**
     * Thay đổi trạng thái đơn hàng
     */
    public boolean changeOrderStatus(Integer maDonHang, String trangThaiMoi, 
                                   String nguoiThayDoi, String ghiChu) {
        try {
            Optional<DonHang> optionalDonHang = donHangRepository.findById(maDonHang);
            if (optionalDonHang.isEmpty()) {
                throw new RuntimeException("Không tìm thấy đơn hàng với mã: " + maDonHang);
            }
            
            DonHang donHang = optionalDonHang.get();
            String trangThaiCu = donHang.getTrangThaiDonHang();
            
            // Kiểm tra có thể chuyển trạng thái không
            if (!canTransition(trangThaiCu, trangThaiMoi)) {
                String allowedTransitions = getAllowedTransitions(trangThaiCu);
                throw new RuntimeException("Không thể chuyển từ trạng thái '" + trangThaiCu + 
                    "' sang '" + trangThaiMoi + "'. " + allowedTransitions);
            }
            
            // Xử lý logic nghiệp vụ theo trạng thái
            boolean processResult = processStatusChange(donHang, trangThaiCu, trangThaiMoi, nguoiThayDoi);
            if (!processResult) {
                return false;
            }
            
            // Cập nhật trạng thái đơn hàng
            donHang.setTrangThaiDonHang(trangThaiMoi);
            donHangRepository.save(donHang);
            
            // Ghi lịch sử thay đổi
            LichSuTrangThaiDonHang lichSu = new LichSuTrangThaiDonHang(
                donHang, trangThaiCu, trangThaiMoi, nguoiThayDoi, ghiChu
            );
            lichSuTrangThaiRepository.save(lichSu);
            
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    
    // Định nghĩa các trạng thái
    public static final String CHO_XAC_NHAN = "CHO_XAC_NHAN";
    public static final String XAC_NHAN = "XAC_NHAN";
    public static final String DANG_CHUAN_BI = "DANG_CHUAN_BI";
    public static final String DANG_GIAO = "DANG_GIAO";
    public static final String HOAN_THANH = "HOAN_THANH";
    public static final String HUY_BO = "HUY_BO";
    
    /**
     * Kiểm tra có thể chuyển trạng thái không
     */
    private boolean canTransition(String trangThaiCu, String trangThaiMoi) {
        switch (trangThaiCu) {
            case CHO_XAC_NHAN:
                return XAC_NHAN.equals(trangThaiMoi) || HUY_BO.equals(trangThaiMoi);
            case XAC_NHAN:
                return DANG_CHUAN_BI.equals(trangThaiMoi) || HUY_BO.equals(trangThaiMoi);
            case DANG_CHUAN_BI:
                return DANG_GIAO.equals(trangThaiMoi) || HUY_BO.equals(trangThaiMoi);
            case DANG_GIAO:
                return HOAN_THANH.equals(trangThaiMoi);
            case HOAN_THANH:
            case HUY_BO:
                return false; // Trạng thái cuối
            default:
                return false;
        }
    }
    
    /**
     * Lấy danh sách trạng thái hợp lệ có thể chuyển đến
     */
    private String getAllowedTransitions(String trangThaiCu) {
        switch (trangThaiCu) {
            case CHO_XAC_NHAN:
                return "Trạng thái hợp lệ: 'XAC_NHAN' hoặc 'HUY_BO'";
            case XAC_NHAN:
                return "Trạng thái hợp lệ: 'DANG_CHUAN_BI' hoặc 'HUY_BO'";
            case DANG_CHUAN_BI:
                return "Trạng thái hợp lệ: 'DANG_GIAO' hoặc 'HUY_BO'";
            case DANG_GIAO:
                return "Trạng thái hợp lệ: 'HOAN_THANH'";
            case HOAN_THANH:
                return "Đơn hàng đã hoàn thành, không thể thay đổi trạng thái";
            case HUY_BO:
                return "Đơn hàng đã bị hủy, không thể thay đổi trạng thái";
            default:
                return "Trạng thái không hợp lệ";
        }
    }
    
    /**
     * Xử lý logic nghiệp vụ khi chuyển trạng thái
     */
    private boolean processStatusChange(DonHang donHang, String trangThaiCu, 
                                      String trangThaiMoi, String nguoiThayDoi) {
        
        switch (trangThaiMoi) {
            case XAC_NHAN:
                return processOrderConfirmation(donHang, nguoiThayDoi);
                
            case DANG_CHUAN_BI:
                return processOrderPreparation(donHang, nguoiThayDoi);
                
            case DANG_GIAO:
                return processOrderShipping(donHang, nguoiThayDoi);
                
            case HOAN_THANH:
                return processOrderCompletion(donHang, nguoiThayDoi);
                
            case HUY_BO:
                return processOrderCancellation(donHang, nguoiThayDoi);
                
            default:
                return true; // Các trạng thái khác không cần xử lý đặc biệt
        }
    }
    
    /**
     * Xử lý xác nhận đơn hàng - Đặt trước hàng
     */
    private boolean processOrderConfirmation(DonHang donHang, String nguoiThayDoi) {
        try {
            List<ChiTietDonHang> chiTietList = chiTietDonHangRepository.findByDonHang(donHang);
            
            for (ChiTietDonHang chiTiet : chiTietList) {
                boolean reserved = quanLyTonKhoService.reserveProduct(
                    chiTiet.getBienThe().getMaBienThe(),
                    chiTiet.getSoLuong(),
                    "ORDER-" + donHang.getMaDonHang(),
                    nguoiThayDoi
                );
                
                if (!reserved) {
                    // Nếu không đặt trước được, rollback các đặt trước đã thực hiện
                    rollbackReservations(donHang, nguoiThayDoi);
                    return false;
                }
            }
            
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Xử lý chuẩn bị đơn hàng
     */
    private boolean processOrderPreparation(DonHang donHang, String nguoiThayDoi) {
        // Logic kiểm tra kho, chuẩn bị hàng
        // Có thể thêm logic kiểm tra tình trạng hàng trong kho
        return true;
    }
    
    /**
     * Xử lý giao hàng
     */
    private boolean processOrderShipping(DonHang donHang, String nguoiThayDoi) {
        // Logic xuất kho, tạo phiếu giao hàng
        // Có thể tích hợp với hệ thống vận chuyển
        return true;
    }
    
    /**
     * Xử lý hoàn thành đơn hàng - Trừ tồn kho
     */
    private boolean processOrderCompletion(DonHang donHang, String nguoiThayDoi) {
        try {
            List<ChiTietDonHang> chiTietList = chiTietDonHangRepository.findByDonHang(donHang);
            
            for (ChiTietDonHang chiTiet : chiTietList) {
                boolean confirmed = quanLyTonKhoService.confirmSale(
                    chiTiet.getBienThe().getMaBienThe(),
                    chiTiet.getSoLuong(),
                    "ORDER-" + donHang.getMaDonHang(),
                    nguoiThayDoi
                );
                
                if (!confirmed) {
                    return false;
                }
            }
            
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Xử lý hủy đơn hàng - Hủy đặt trước
     */
    private boolean processOrderCancellation(DonHang donHang, String nguoiThayDoi) {
        try {
            // Hủy đặt trước nếu đơn hàng đã được xác nhận
            if (!CHO_XAC_NHAN.equals(donHang.getTrangThaiDonHang())) {
                rollbackReservations(donHang, nguoiThayDoi);
            }
            
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    
    /**
     * Hủy tất cả đặt trước của đơn hàng
     */
    private void rollbackReservations(DonHang donHang, String nguoiThayDoi) {
        try {
            List<ChiTietDonHang> chiTietList = chiTietDonHangRepository.findByDonHang(donHang);
            
            for (ChiTietDonHang chiTiet : chiTietList) {
                quanLyTonKhoService.releaseReservation(
                    chiTiet.getBienThe().getMaBienThe(),
                    chiTiet.getSoLuong(),
                    "CANCEL-ORDER-" + donHang.getMaDonHang(),
                    nguoiThayDoi
                );
            }
        } catch (Exception e) {
            // Log error but don't throw
        }
    }
    
    // =================== QUERY OPERATIONS ===================
    
    /**
     * Lấy lịch sử trạng thái của đơn hàng
     */
    public List<LichSuTrangThaiDonHang> getOrderStatusHistory(Integer maDonHang) {
        return lichSuTrangThaiRepository.findByDonHangOrderByThoiGianThayDoiDesc(maDonHang);
    }
    
    /**
     * Lấy danh sách đơn hàng theo trạng thái
     */
    public List<DonHang> getOrdersByStatus(String trangThai) {
        return donHangRepository.findByTrangThaiDonHang(trangThai);
    }
    
    /**
     * Lấy danh sách đơn hàng cần xử lý
     */
    public List<DonHang> getPendingOrders() {
        return donHangRepository.findByTrangThaiDonHangIn(List.of(CHO_XAC_NHAN, XAC_NHAN, DANG_CHUAN_BI));
    }
    
    /**
     * Lấy danh sách đơn hàng đang giao
     */
    public List<DonHang> getShippingOrders() {
        return donHangRepository.findByTrangThaiDonHang(DANG_GIAO);
    }
    
    /**
     * Kiểm tra có thể chuyển trạng thái không
     */
    public boolean canChangeStatus(Integer maDonHang, String trangThaiMoi) {
        Optional<DonHang> optionalDonHang = donHangRepository.findById(maDonHang);
        if (optionalDonHang.isEmpty()) {
            return false;
        }
        
        return canTransition(optionalDonHang.get().getTrangThaiDonHang(), trangThaiMoi);
    }
    
    /**
     * Lấy danh sách đơn hàng cần chú ý (đơn hàng quá hạn hoặc có vấn đề)
     */
    public List<DonHang> getOrdersNeedingAttention() {
        // Lấy đơn hàng đã được xác nhận nhưng chưa chuẩn bị quá 1 ngày
        // hoặc đang chuẩn bị quá 2 ngày
        // hoặc đang giao quá 3 ngày
        // Fallback to repository query by multiple statuses
        return donHangRepository.findByTrangThaiDonHangIn(List.of(XAC_NHAN, DANG_CHUAN_BI, DANG_GIAO));
    }
    
    /**
     * Đếm số lượng đơn hàng theo trạng thái
     */
    public Map<String, Long> countOrdersByStatus() {
        Map<String, Long> statusCounts = new HashMap<>();
        
    statusCounts.put("CHO_XAC_NHAN", (long) donHangRepository.findByTrangThaiDonHang(CHO_XAC_NHAN).size());
    statusCounts.put("XAC_NHAN", (long) donHangRepository.findByTrangThaiDonHang(XAC_NHAN).size());
    statusCounts.put("DANG_CHUAN_BI", (long) donHangRepository.findByTrangThaiDonHang(DANG_CHUAN_BI).size());
    statusCounts.put("DANG_GIAO", (long) donHangRepository.findByTrangThaiDonHang(DANG_GIAO).size());
    statusCounts.put("HOAN_THANH", (long) donHangRepository.findByTrangThaiDonHang(HOAN_THANH).size());
    statusCounts.put("HUY_BO", (long) donHangRepository.findByTrangThaiDonHang(HUY_BO).size());
        
        return statusCounts;
    }
    
    /**
     * Lấy thống kê thời gian xử lý đơn hàng
     */
    public List<Object[]> getProcessingTimeStats() {
        return lichSuTrangThaiRepository.getAverageProcessingTimeByStatus();
    }
}