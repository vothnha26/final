package com.noithat.qlnt.backend.service.impl;

import com.noithat.qlnt.backend.dto.request.KhachHangCreationRequest;
import com.noithat.qlnt.backend.entity.KhachHang;
import com.noithat.qlnt.backend.entity.HangThanhVien;
import com.noithat.qlnt.backend.entity.TaiKhoan;
import com.noithat.qlnt.backend.repository.KhachHangRepository;
import com.noithat.qlnt.backend.repository.HangThanhVienRepository;
import com.noithat.qlnt.backend.repository.TaiKhoanRepository;
import com.noithat.qlnt.backend.repository.DonHangRepository;
import com.noithat.qlnt.backend.exception.ResourceNotFoundException;
import com.noithat.qlnt.backend.service.IKhachHangService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class KhachHangServiceImpl implements IKhachHangService {

    private final KhachHangRepository khachHangRepository;
    private final HangThanhVienRepository hangThanhVienRepository;
    private final TaiKhoanRepository taiKhoanRepository;
    private final DonHangRepository donHangRepository;

    public KhachHangServiceImpl(KhachHangRepository khachHangRepository,
            HangThanhVienRepository hangThanhVienRepository,
            TaiKhoanRepository taiKhoanRepository,
            DonHangRepository donHangRepository) {
        this.khachHangRepository = khachHangRepository;
        this.hangThanhVienRepository = hangThanhVienRepository;
        this.taiKhoanRepository = taiKhoanRepository;
        this.donHangRepository = donHangRepository;
    }

    @Override
    public List<KhachHang> getAll() {
        return khachHangRepository.findAll();
    }

    @Override
    @Transactional
    public KhachHang create(KhachHangCreationRequest request) {
        KhachHang khachHang = new KhachHang();
        khachHang.setHoTen(request.getHoTen());
        khachHang.setEmail(request.getEmail());
        khachHang.setSoDienThoai(request.getSoDienThoai());
        khachHang.setDiaChi(request.getDiaChi());
        khachHang.setDiemThuong(0);

        HangThanhVien hangThanhVien = hangThanhVienRepository.findById(request.getMaHangThanhVien())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Hạng thành viên không tồn tại: " + request.getMaHangThanhVien()));
        khachHang.setHangThanhVien(hangThanhVien);

        if (request.getMaTaiKhoan() != null) {
            TaiKhoan taiKhoan = taiKhoanRepository.findById(request.getMaTaiKhoan())
                    .orElseThrow(
                            () -> new ResourceNotFoundException("Tài khoản không tồn tại: " + request.getMaTaiKhoan()));
            khachHang.setTaiKhoan(taiKhoan);
        }

        return khachHangRepository.save(khachHang);
    }

    @Override
    @Transactional
    public KhachHang update(Integer maKhachHang, KhachHang request) {
        KhachHang existing = getKhachHangProfile(maKhachHang);
        // Partial update: only overwrite fields that are provided (non-null)
        if (request.getHoTen() != null)
            existing.setHoTen(request.getHoTen());
        if (request.getEmail() != null)
            existing.setEmail(request.getEmail());
        if (request.getSoDienThoai() != null)
            existing.setSoDienThoai(request.getSoDienThoai());
        if (request.getDiaChi() != null)
            existing.setDiaChi(request.getDiaChi());
        // Update ngaySinh and gioiTinh if provided
        if (request.getNgaySinh() != null)
            existing.setNgaySinh(request.getNgaySinh());
        if (request.getGioiTinh() != null)
            existing.setGioiTinh(request.getGioiTinh());

        // Only update diemThuong if explicitly provided (avoid nulling out)
        if (request.getDiemThuong() != null)
            existing.setDiemThuong(request.getDiemThuong());

        // Update hang thanh vien only when provided and valid
        if (request.getHangThanhVien() != null && request.getHangThanhVien().getMaHangThanhVien() != null) {
            Integer hangId = request.getHangThanhVien().getMaHangThanhVien();
            var hang = hangThanhVienRepository.findById(hangId)
                    .orElseThrow(
                            () -> new ResourceNotFoundException("Hạng thành viên ID: " + hangId + " không tồn tại."));
            existing.setHangThanhVien(hang);
        }

        return khachHangRepository.save(existing);
    }

    @Override
    @Transactional
    public void delete(Integer maKhachHang) {
        KhachHang existing = getKhachHangProfile(maKhachHang);

        // Kiểm tra xem khách hàng có đơn hàng nào không
        long orderCount = donHangRepository.countByKhachHang_MaKhachHang(maKhachHang);
        if (orderCount > 0) {
            throw new IllegalStateException(
                    "Không thể xóa khách hàng này vì đã có " + orderCount + " đơn hàng");
        }

        khachHangRepository.delete(existing);
    }

    @Override
    public KhachHang getKhachHangProfile(Integer maKhachHang) {
        return khachHangRepository.findById(maKhachHang)
                .orElseThrow(() -> new ResourceNotFoundException("Khách hàng ID: " + maKhachHang + " không tồn tại."));
    }

    @Override
    public KhachHang findBySoDienThoai(String soDienThoai) {
        if (soDienThoai == null || soDienThoai.trim().isEmpty())
            return null;
        return khachHangRepository.findBySoDienThoai(soDienThoai.trim()).orElse(null);
    }

    @Override
    @Transactional
    public KhachHang tichDiemVaCapNhatHang(Integer maKhachHang, Integer diemThayDoi) {
        KhachHang khachHang = getKhachHangProfile(maKhachHang);
        if (diemThayDoi <= 0) {
            throw new IllegalArgumentException("Điểm thay đổi phải lớn hơn 0.");
        }

        khachHang.setDiemThuong(khachHang.getDiemThuong() + diemThayDoi);

        List<HangThanhVien> allHangs = hangThanhVienRepository.findAllByOrderByDiemToiThieuAsc();
        HangThanhVien hangCu = khachHang.getHangThanhVien();
        HangThanhVien hangMoi = hangCu;

        for (int i = allHangs.size() - 1; i >= 0; i--) {
            HangThanhVien currentHang = allHangs.get(i);
            if (khachHang.getDiemThuong() >= currentHang.getDiemToiThieu()) {
                hangMoi = currentHang;
                break;
            }
        }

        if (!hangMoi.equals(hangCu)) {
            khachHang.setHangThanhVien(hangMoi);
        }

        return khachHangRepository.save(khachHang);
    }
}
