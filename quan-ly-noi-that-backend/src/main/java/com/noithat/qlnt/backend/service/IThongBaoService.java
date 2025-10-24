package com.noithat.qlnt.backend.service;

import com.noithat.qlnt.backend.dto.request.ThongBaoRequest;
import com.noithat.qlnt.backend.dto.response.ThongBaoResponse;
import com.noithat.qlnt.backend.entity.ThongBao;

import java.util.List;

/**
 * Service Interface cho Thông báo
 */
public interface IThongBaoService {
    
    // ==================== CRUD Operations ====================
    
    /**
     * Lấy tất cả thông báo (chưa bị xóa)
     */
    List<ThongBao> getAll();
    
    /**
     * Lấy tất cả thông báo với Response format
     */
    List<ThongBaoResponse> getAllWithResponse();
    
    /**
     * Lấy thông báo theo ID
     */
    ThongBao getById(Integer id);
    
    /**
     * Lấy thông báo theo ID với Response format
     */
    ThongBaoResponse getByIdWithResponse(Integer id);
    
    /**
     * Tạo thông báo mới
     */
    ThongBao create(ThongBaoRequest request);
    
    /**
     * Tạo thông báo mới và trả về Response
     */
    ThongBaoResponse createWithResponse(ThongBaoRequest request);
    
    /**
     * Cập nhật thông báo
     */
    ThongBao update(Integer id, ThongBaoRequest request);
    
    /**
     * Xóa thông báo (soft delete)
     */
    void delete(Integer id);
    
    /**
     * Xóa vĩnh viễn thông báo
     */
    void permanentDelete(Integer id);
    
    // ==================== Business Logic ====================
    
    /**
     * Lấy thông báo cho người dùng cụ thể
     * Bao gồm cả thông báo cho ALL và thông báo riêng cho user đó
     */
    List<ThongBao> getNotificationsForUser(Integer nguoiNhanId, String loaiNguoiNhan);
    
    /**
     * Lấy thông báo cho người dùng với Response format
     */
    List<ThongBaoResponse> getNotificationsForUserWithResponse(Integer nguoiNhanId, String loaiNguoiNhan);
    
    /**
     * Đánh dấu một thông báo là đã đọc
     */
    void danhDauDaDoc(Integer id);
    
    /**
     * Đánh dấu tất cả thông báo của người dùng là đã đọc
     */
    void danhDauTatCaDaDoc(Integer nguoiNhanId, String loaiNguoiNhan);
    
    /**
     * Đếm số thông báo chưa đọc của người dùng
     */
    long countChuaDoc(Integer nguoiNhanId, String loaiNguoiNhan);
    
    /**
     * Lấy thông báo chưa đọc của người dùng
     */
    List<ThongBao> getChuaDoc(Integer nguoiNhanId, String loaiNguoiNhan);
    
    /**
     * Lấy thông báo theo loại (success, warning, error, etc.)
     */
    List<ThongBao> getByLoai(String loai);
    
    /**
     * Lấy thông báo theo loại cho người dùng
     */
    List<ThongBao> getByLoaiForUser(String loai, Integer nguoiNhanId, String loaiNguoiNhan);
    
    /**
     * Lấy thông báo ưu tiên cao chưa đọc
     */
    List<ThongBao> getHighPriorityUnread(Integer nguoiNhanId, String loaiNguoiNhan);

    // ==================== Response Mapped Methods (DTO) ====================
    /**
     * Lấy thông báo theo loại với Response DTO
     */
    List<ThongBaoResponse> getByLoaiWithResponse(String loai);

    /**
     * Lấy thông báo chưa đọc cho người dùng (DTO)
     */
    List<ThongBaoResponse> getChuaDocWithResponse(Integer nguoiNhanId, String loaiNguoiNhan);

    /**
     * Lấy thông báo ưu tiên cao chưa đọc (DTO)
     */
    List<ThongBaoResponse> getHighPriorityUnreadWithResponse(Integer nguoiNhanId, String loaiNguoiNhan);
    
    // ==================== Auto-create Notifications ====================
    
    /**
     * Tạo thông báo khi có đơn hàng mới
     */
    void taoThongBaoDonHangMoi(Integer maDonHang);
    
    /**
     * Tạo thông báo cảnh báo tồn kho thấp
     */
    void taoThongBaoCanhBaoTonKho(Integer maSanPham, String tenSanPham, Integer soLuongTon);
    
    /**
     * Tạo thông báo sản phẩm hết hàng
     */
    void taoThongBaoHetHang(Integer maSanPham, String tenSanPham);
    
    /**
     * Tạo thông báo khi khách hàng đạt cấp VIP mới
     */
    void taoThongBaoKhachHangVIP(Integer maKhachHang, String tenKhachHang, String hangVipMoi);
    
    /**
     * Tạo thông báo thanh toán thành công
     */
    void taoThongBaoThanhToan(Integer maDonHang, String soTien);
    
    /**
     * Tạo thông báo thay đổi trạng thái đơn hàng
     */
    void taoThongBaoThayDoiTrangThai(Integer maDonHang, String trangThaiMoi);
    
    /**
     * Tạo thông báo đơn hàng bị hủy
     */
    void taoThongBaoDonHangBiHuy(Integer maDonHang, String lyDo);
    
    /**
     * Tạo thông báo tổng quát
     */
    ThongBao taoThongBaoTongQuat(String loai, String tieuDe, String noiDung, String loaiNguoiNhan, String doUuTien);
    
    // ==================== Maintenance ====================
    
    /**
     * Xóa thông báo cũ (soft delete) - quá 30 ngày
     */
    int xoaThongBaoCu();
    
    /**
     * Xóa vĩnh viễn thông báo đã soft delete quá 90 ngày
     */
    int xoaVinhVienThongBaoCu();
}
