package com.noithat.qlnt.backend.service;

import com.noithat.qlnt.backend.dto.request.HangThanhVienRequest;
import com.noithat.qlnt.backend.dto.response.HangThanhVienResponse;
import com.noithat.qlnt.backend.dto.response.VipBenefitResponse;
import com.noithat.qlnt.backend.dto.common.HangThanhVienDto;
import com.noithat.qlnt.backend.dto.common.VipKhachHangDto;
import com.noithat.qlnt.backend.entity.HangThanhVien;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

/**
 * Interface định nghĩa các phương thức quản lý hạng thành viên
 */
public interface IHangThanhVienService {

    /**
     * Lấy tất cả hạng thành viên với phân trang
     */
    Page<HangThanhVienResponse> getAllHangThanhVien(Pageable pageable);

    /**
     * Lấy tất cả hạng thành viên không phân trang
     */
    List<HangThanhVienResponse> getAllHangThanhVien();

    /**
     * Lấy hạng thành viên theo ID
     */
    HangThanhVienResponse getHangThanhVienById(Integer id);

    /**
     * Tạo mới hạng thành viên
     */
    HangThanhVienResponse createHangThanhVien(HangThanhVienRequest request);

    /**
     * Cập nhật hạng thành viên
     */
    HangThanhVienResponse updateHangThanhVien(Integer id, HangThanhVienRequest request);

    /**
     * Cập nhật trạng thái hạng thành viên
     */
    HangThanhVienResponse updateHangThanhVienStatus(Integer id, Boolean trangThai);

    /**
     * Xóa hạng thành viên
     */
    void deleteHangThanhVien(Integer id);

    /**
     * Xác định hạng thành viên cho khách hàng dựa trên điểm thưởng
     */
    HangThanhVien xacDinhHangThanhVien(Integer diemThuong);

    /**
     * Cập nhật hạng thành viên cho khách hàng
     */
    void capNhatHangThanhVien(Integer maKhachHang);

    /**
     * Lấy thống kê hạng thành viên
     */
    Map<String, Object> getThongKeHangThanhVien();

    /**
     * Lấy danh sách hạng thành viên cho VIP Management
     */
    List<HangThanhVienDto> getAllVipLevels();

    /**
     * Tạo/cập nhật hạng thành viên từ VIP Management
     */
    HangThanhVienDto saveVipLevel(HangThanhVienDto dto);

    /**
     * Lấy VIP level theo ID
     */
    HangThanhVienDto getVipLevelById(Integer id);

    /**
     * Xóa VIP level theo ID
     */
    void deleteById(Integer id);

    /**
     * Lấy danh sách khách hàng VIP với filter
     */
    List<VipKhachHangDto> getVipCustomers(String level, String search);

    /**
     * Xem trước ưu đãi VIP cho khách hàng với giá trị đơn hàng
     */
    VipBenefitResponse previewVipBenefits(Integer customerId, BigDecimal orderAmount);

    /**
     * Xác định hạng thành viên dựa trên tổng chi tiêu
     */
    HangThanhVien xacDinhHangTheoChiTieu(BigDecimal tongChiTieu);

    /**
     * Lấy danh sách khách hàng theo hạng thành viên
     */
    List<VipKhachHangDto> getKhachHangByHang(Integer maHangThanhVien);
}
