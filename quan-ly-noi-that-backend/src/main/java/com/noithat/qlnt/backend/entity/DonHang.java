package com.noithat.qlnt.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "DonHang")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class DonHang {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer maDonHang;

    @Column(name = "NgayDatHang", nullable = false)
    private LocalDateTime ngayDatHang = LocalDateTime.now();

    // ----- TRẠNG THÁI -----
    @Column(name = "TrangThaiDonHang", columnDefinition = "NVARCHAR(50)")
    private String trangThaiDonHang = "CHO_XU_LY"; // Trạng thái xử lý: CHO_XU_LY, DANG_GIAO_HANG, HOAN_THANH, DA_HUY

    @Column(name = "TrangThaiThanhToan", columnDefinition = "NVARCHAR(50)")
    private String trangThaiThanhToan = "UNPAID"; // Trạng thái thanh toán: UNPAID, PAID, FAILED...

    // ----- THÔNG TIN THANH TOÁN (Lưu chi tiết tại thời điểm mua) -----
    @Column(name = "TongTienGoc")
    private BigDecimal tongTienGoc;

    @Column(name = "GiamGiaVip")
    private BigDecimal giamGiaVip = BigDecimal.ZERO;

    @Column(name = "GiamGiaVoucher")
    private BigDecimal giamGiaVoucher = BigDecimal.ZERO;
    
    @Column(name = "DiemThuongSuDung")
    private Integer diemThuongSuDung = 0;

    @Column(name = "GiamGiaDiemThuong")
    private BigDecimal giamGiaDiemThuong = BigDecimal.ZERO;

    @Column(name = "PhiGiaoHang")
    private BigDecimal phiGiaoHang = BigDecimal.ZERO;

    @Column(name = "ThanhTien", nullable = false)
    private BigDecimal thanhTien; // Số tiền cuối cùng khách phải trả

    @Column(name = "DiemThuongNhanDuoc")
    private Integer diemThuongNhanDuoc = 0; // Điểm sẽ tích lũy được từ đơn này

    // ----- THÔNG TIN GIAO HÀNG (Lưu lại thông tin khách nhập) -----
    @Column(name = "TenNguoiNhan", columnDefinition = "NVARCHAR(100)")
    private String tenNguoiNhan;

    @Column(name = "SoDienThoaiNhan", columnDefinition = "NVARCHAR(20)")
    private String soDienThoaiNhan;

    @Column(name = "DiaChiGiaoHang", columnDefinition = "NVARCHAR(255)")
    private String diaChiGiaoHang;

    @Column(name = "PhuongThucThanhToan", nullable = false, columnDefinition = "NVARCHAR(50)")
    private String phuongThucThanhToan;
    
    @Column(columnDefinition = "NVARCHAR(255)")
    private String ghiChu;
    
    // ----- CÁC MỐI QUAN HỆ -----
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MaKhachHang", nullable = true)
    private KhachHang khachHang;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "MaVoucher")
    private Voucher voucher;

    @OneToMany(mappedBy = "donHang", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ChiTietDonHang> chiTietDonHangs = new ArrayList<>();
}