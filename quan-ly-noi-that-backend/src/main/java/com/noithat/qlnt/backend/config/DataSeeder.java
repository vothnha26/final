package com.noithat.qlnt.backend.config;

import com.noithat.qlnt.backend.entity.*;
import com.noithat.qlnt.backend.repository.*;
import org.springframework.boot.CommandLineRunner;
import com.noithat.qlnt.backend.repository.KhachHangRepository;
import org.springframework.context.annotation.Configuration;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

/**
 * DataSeeder để khởi tạo dữ liệu mẫu cho hệ thống quản lý nội thất
 * DISABLED - Không sử dụng nữa
 */
@Configuration
public class DataSeeder {

    // @Bean - Đã tắt DataSeeder
    @Transactional
    CommandLineRunner initDatabase(
            NhaCungCapRepository nhaCungCapRepository,
            DanhMucRepository danhMucRepository,
            BoSuuTapRepository boSuuTapRepository,
            HangThanhVienRepository hangThanhVienRepository,
            VoucherRepository voucherRepository,
            SanPhamRepository sanPhamRepository,
            BienTheSanPhamRepository bienTheSanPhamRepository,
            ThuocTinhRepository thuocTinhRepository,
            BienTheThuocTinhRepository bienTheThuocTinhRepository,
            VaiTroRepository vaiTroRepository,
            KhachHangRepository khachHangRepository,
            DanhGiaSanPhamRepository danhGiaSanPhamRepository,
            ThongBaoRepository thongBaoRepository,
            TaiKhoanRepository taiKhoanRepository,
            org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        return args -> {
            // Skip if data already exists
            if (vaiTroRepository.count() > 0) {
                System.out.println("=== Data already seeded, skipping... ===");
                return;
            }

            System.out.println("=== Starting Data Seeding ===");

            // 0. Seed Vai Trò (Roles)
            System.out.println("Seeding Vai Trò...");
            VaiTro adminRole = new VaiTro();
            adminRole.setTenVaiTro("ADMIN");

            VaiTro managerRole = new VaiTro();
            managerRole.setTenVaiTro("MANAGER");

            VaiTro staffRole = new VaiTro();
            staffRole.setTenVaiTro("STAFF");

            VaiTro userRole = new VaiTro();
            userRole.setTenVaiTro("USER");

            List<VaiTro> roles = vaiTroRepository.saveAll(Arrays.asList(adminRole, managerRole, staffRole, userRole));
            System.out.println("✓ Created " + roles.size() + " roles");

            // 1. Seed Nhà Cung Cấp (Suppliers)
            System.out.println("Seeding Nhà Cung Cấp...");
            NhaCungCap ncc1 = new NhaCungCap();
            ncc1.setTenNhaCungCap("Nội Thất Hòa Phát");

            NhaCungCap ncc2 = new NhaCungCap();
            ncc2.setTenNhaCungCap("Nội Thất Thành Đạt");

            NhaCungCap ncc3 = new NhaCungCap();
            ncc3.setTenNhaCungCap("An Cường Wood");

            List<NhaCungCap> suppliers = nhaCungCapRepository.saveAll(Arrays.asList(ncc1, ncc2, ncc3));
            System.out.println("✓ Created " + suppliers.size() + " suppliers");

            // 2. Seed Danh Mục (Categories)
            System.out.println("Seeding Danh Mục...");
            DanhMuc dm1 = new DanhMuc();
            dm1.setTenDanhMuc("Bàn");

            DanhMuc dm2 = new DanhMuc();
            dm2.setTenDanhMuc("Ghế");

            DanhMuc dm3 = new DanhMuc();
            dm3.setTenDanhMuc("Tủ");

            DanhMuc dm4 = new DanhMuc();
            dm4.setTenDanhMuc("Giường");

            DanhMuc dm5 = new DanhMuc();
            dm5.setTenDanhMuc("Sofa");

            List<DanhMuc> categories = danhMucRepository.saveAll(Arrays.asList(dm1, dm2, dm3, dm4, dm5));
            System.out.println("✓ Created " + categories.size() + " categories");

            // 3. Seed Bộ Sưu Tập (Collections)
            System.out.println("Seeding Bộ Sưu Tập...");
            BoSuuTap bst1 = new BoSuuTap();
            bst1.setTenBoSuuTap("Bộ sưu tập Hiện Đại");
            bst1.setMoTa("Các sản phẩm nội thất phong cách hiện đại, tối giản");

            BoSuuTap bst2 = new BoSuuTap();
            bst2.setTenBoSuuTap("Bộ sưu tập Cổ Điển");
            bst2.setMoTa("Nội thất sang trọng phong cách cổ điển châu Âu");

            BoSuuTap bst3 = new BoSuuTap();
            bst3.setTenBoSuuTap("Bộ sưu tập Văn Phòng");
            bst3.setMoTa("Nội thất văn phòng chuyên nghiệp");

            List<BoSuuTap> collections = boSuuTapRepository.saveAll(Arrays.asList(bst1, bst2, bst3));
            System.out.println("✓ Created " + collections.size() + " collections");

            // 4. Seed Hạng Thành Viên (Member Tiers)
            System.out.println("Seeding Hạng Thành Viên...");
            HangThanhVien htv1 = new HangThanhVien();
            htv1.setTenHang("Đồng");
            htv1.setDiemToiThieu(0);
            htv1.setMoTa("Hạng thành viên cơ bản");
            htv1.setMauSac("#CD7F32");
            htv1.setTrangThai(true);
            htv1.setIcon("bronze");

            HangThanhVien htv2 = new HangThanhVien();
            htv2.setTenHang("Bạc");
            htv2.setDiemToiThieu(1000);
            htv2.setMoTa("Hạng thành viên bạc - Giảm 5%");
            htv2.setMauSac("#C0C0C0");
            htv2.setTrangThai(true);
            htv2.setIcon("silver");

            HangThanhVien htv3 = new HangThanhVien();
            htv3.setTenHang("Vàng");
            htv3.setDiemToiThieu(5000);
            htv3.setMoTa("Hạng thành viên vàng - Giảm 10%");
            htv3.setMauSac("#FFD700");
            htv3.setTrangThai(true);
            htv3.setIcon("gold");

            HangThanhVien htv4 = new HangThanhVien();
            htv4.setTenHang("Kim Cương");
            htv4.setDiemToiThieu(10000);
            htv4.setMoTa("Hạng thành viên kim cương - Giảm 15%");
            htv4.setMauSac("#B9F2FF");
            htv4.setTrangThai(true);
            htv4.setIcon("diamond");

            List<HangThanhVien> tiers = hangThanhVienRepository.saveAll(Arrays.asList(htv1, htv2, htv3, htv4));
            System.out.println("✓ Created " + tiers.size() + " member tiers");

            // 5. Seed Vouchers
            System.out.println("Seeding Vouchers...");
            Voucher v1 = new Voucher();
            v1.setMaCode("NEWUSER10");
            v1.setTenVoucher("Giảm giá cho khách hàng mới");
            v1.setMoTa("Giảm 10% cho đơn hàng đầu tiên");
            v1.setLoaiGiamGia("PERCENTAGE");
            v1.setGiaTriGiam(new BigDecimal("10"));
            v1.setGiaTriDonHangToiThieu(new BigDecimal("500000"));
            v1.setGiaTriGiamToiDa(new BigDecimal("100000"));
            v1.setNgayBatDau(LocalDateTime.now());
            v1.setNgayKetThuc(LocalDateTime.now().plusMonths(3));
            v1.setSoLuongToiDa(100);
            v1.setSoLuongDaSuDung(0);
            v1.setTrangThai("DANG_HOAT_DONG");
            v1.setApDungChoMoiNguoi(true);

            Voucher v2 = new Voucher();
            v2.setMaCode("VIP50K");
            v2.setTenVoucher("Giảm 50K cho hạng Vàng");
            v2.setMoTa("Giảm 50.000đ cho khách hàng hạng Vàng trở lên");
            v2.setLoaiGiamGia("FIXED");
            v2.setGiaTriGiam(new BigDecimal("50000"));
            v2.setGiaTriDonHangToiThieu(new BigDecimal("1000000"));
            v2.setNgayBatDau(LocalDateTime.now());
            v2.setNgayKetThuc(LocalDateTime.now().plusMonths(1));
            v2.setSoLuongToiDa(50);
            v2.setSoLuongDaSuDung(0);
            v2.setTrangThai("DANG_HOAT_DONG");
            v2.setApDungChoMoiNguoi(false);

            Voucher v3 = new Voucher();
            v3.setMaCode("SUMMER20");
            v3.setTenVoucher("Khuyến mãi mùa hè");
            v3.setMoTa("Giảm 20% cho tất cả sản phẩm");
            v3.setLoaiGiamGia("PERCENTAGE");
            v3.setGiaTriGiam(new BigDecimal("20"));
            v3.setGiaTriDonHangToiThieu(new BigDecimal("2000000"));
            v3.setGiaTriGiamToiDa(new BigDecimal("500000"));
            v3.setNgayBatDau(LocalDateTime.now());
            v3.setNgayKetThuc(LocalDateTime.now().plusMonths(2));
            v3.setSoLuongToiDa(200);
            v3.setSoLuongDaSuDung(0);
            v3.setTrangThai("DANG_HOAT_DONG");
            v3.setApDungChoMoiNguoi(true);

            List<Voucher> vouchers = voucherRepository.saveAll(Arrays.asList(v1, v2, v3));
            System.out.println("✓ Created " + vouchers.size() + " vouchers");

            // 6. Seed Sản Phẩm (Products)
            System.out.println("Seeding Sản Phẩm...");

            // Sản phẩm 1: Bàn làm việc
            SanPham sp1 = new SanPham();
            sp1.setTenSanPham("Bàn làm việc hiện đại");
            sp1.setMoTa("Bàn làm việc gỗ công nghiệp cao cấp, thiết kế hiện đại");
            sp1.setNhaCungCap(ncc1);
            sp1.setDanhMuc(dm1);
            sp1.setBoSuuTap(bst1);
            sp1.setDiemThuong(50);

            // Sản phẩm 2: Ghế văn phòng
            SanPham sp2 = new SanPham();
            sp2.setTenSanPham("Ghế văn phòng ergonomic");
            sp2.setMoTa("Ghế văn phòng có tựa lưng, điều chỉnh độ cao");
            sp2.setNhaCungCap(ncc2);
            sp2.setDanhMuc(dm2);
            sp2.setBoSuuTap(bst3);
            sp2.setDiemThuong(30);

            // Sản phẩm 3: Tủ quần áo
            SanPham sp3 = new SanPham();
            sp3.setTenSanPham("Tủ quần áo 2 cánh");
            sp3.setMoTa("Tủ quần áo gỗ tự nhiên, 2 cánh mở");
            sp3.setNhaCungCap(ncc3);
            sp3.setDanhMuc(dm3);
            sp3.setBoSuuTap(bst2);
            sp3.setDiemThuong(100);

            // Sản phẩm 4: Giường ngủ
            SanPham sp4 = new SanPham();
            sp4.setTenSanPham("Giường ngủ 1m6");
            sp4.setMoTa("Giường ngủ gỗ sồi tự nhiên, kích thước 1m6");
            sp4.setNhaCungCap(ncc1);
            sp4.setDanhMuc(dm4);
            sp4.setBoSuuTap(bst2);
            sp4.setDiemThuong(150);

            // Sản phẩm 5: Sofa
            SanPham sp5 = new SanPham();
            sp5.setTenSanPham("Sofa 3 chỗ ngồi");
            sp5.setMoTa("Sofa bọc da cao cấp, thiết kế sang trọng");
            sp5.setNhaCungCap(ncc2);
            sp5.setDanhMuc(dm5);
            sp5.setBoSuuTap(bst1);
            sp5.setDiemThuong(200);

            List<SanPham> products = sanPhamRepository.saveAll(Arrays.asList(sp1, sp2, sp3, sp4, sp5));
            System.out.println("✓ Created " + products.size() + " products");

            // 7. Seed Thuộc Tính (Attributes)
            System.out.println("Seeding Thuộc Tính...");
            ThuocTinh tt1 = new ThuocTinh();
            tt1.setTenThuocTinh("Màu sắc");

            ThuocTinh tt2 = new ThuocTinh();
            tt2.setTenThuocTinh("Kích thước");

            ThuocTinh tt3 = new ThuocTinh();
            tt3.setTenThuocTinh("Chất liệu");

            List<ThuocTinh> attributes = thuocTinhRepository.saveAll(Arrays.asList(tt1, tt2, tt3));
            System.out.println("✓ Created " + attributes.size() + " attributes");

            // 8. Seed Biến Thể Sản Phẩm (Product Variants)
            System.out.println("Seeding Biến Thể Sản Phẩm...");

            // Biến thể cho Bàn làm việc
            BienTheSanPham bt1 = createVariant(sp1, "BTB-001", new BigDecimal("2500000"), new BigDecimal("3000000"),
                    50);
            BienTheSanPham bt2 = createVariant(sp1, "BTB-002", new BigDecimal("2300000"), new BigDecimal("2800000"),
                    30);

            // Biến thể cho Ghế văn phòng
            BienTheSanPham bt3 = createVariant(sp2, "GVP-001", new BigDecimal("1200000"), new BigDecimal("1500000"),
                    100);
            BienTheSanPham bt4 = createVariant(sp2, "GVP-002", new BigDecimal("1000000"), new BigDecimal("1300000"),
                    80);

            // Biến thể cho Tủ quần áo
            BienTheSanPham bt5 = createVariant(sp3, "TQA-001", new BigDecimal("4000000"), new BigDecimal("5000000"),
                    20);

            // Biến thể cho Giường ngủ
            BienTheSanPham bt6 = createVariant(sp4, "GN-001", new BigDecimal("6000000"), new BigDecimal("7500000"), 15);

            // Biến thể cho Sofa
            BienTheSanPham bt7 = createVariant(sp5, "SF-001", new BigDecimal("8000000"), new BigDecimal("10000000"),
                    10);

            List<BienTheSanPham> variants = bienTheSanPhamRepository.saveAll(
                    Arrays.asList(bt1, bt2, bt3, bt4, bt5, bt6, bt7));
            System.out.println("✓ Created " + variants.size() + " product variants");

            // 9. Seed Thuộc Tính của Biến Thể
            System.out.println("Seeding Thuộc Tính Biến Thể...");

            // Thuộc tính cho biến thể 1
            createVariantAttribute(bt1, tt1, "Nâu gỗ");
            createVariantAttribute(bt1, tt2, "120x60cm");
            createVariantAttribute(bt1, tt3, "Gỗ công nghiệp");

            // Thuộc tính cho biến thể 2
            createVariantAttribute(bt2, tt1, "Trắng");
            createVariantAttribute(bt2, tt2, "100x60cm");
            createVariantAttribute(bt2, tt3, "Gỗ công nghiệp");

            // Thuộc tính cho biến thể 3
            createVariantAttribute(bt3, tt1, "Đen");
            createVariantAttribute(bt3, tt2, "45x45cm");
            createVariantAttribute(bt3, tt3, "Da PU cao cấp");

            // Thuộc tính cho biến thể 4
            createVariantAttribute(bt4, tt1, "Xám");
            createVariantAttribute(bt4, tt2, "45x45cm");
            createVariantAttribute(bt4, tt3, "Vải lưới");

            // Thuộc tính cho biến thể 5
            createVariantAttribute(bt5, tt1, "Gỗ tự nhiên");
            createVariantAttribute(bt5, tt2, "180x80x200cm");
            createVariantAttribute(bt5, tt3, "Gỗ tự nhiên");

            // Thuộc tính cho biến thể 6
            createVariantAttribute(bt6, tt1, "Nâu vân gỗ");
            createVariantAttribute(bt6, tt2, "160x200cm");
            createVariantAttribute(bt6, tt3, "Gỗ sồi tự nhiên");

            // Thuộc tính cho biến thể 7
            createVariantAttribute(bt7, tt1, "Xám nhạt");
            createVariantAttribute(bt7, tt2, "200x90x85cm");
            createVariantAttribute(bt7, tt3, "Da thật");

            bienTheThuocTinhRepository.flush();
            System.out.println("✓ Created variant attributes");

            System.out.println("=== Data Seeding Completed Successfully ===");

            // 11. Seed some sample customers (Khách hàng) with Vietnamese names
            try {
                System.out.println("Seeding sample customers...");
                com.noithat.qlnt.backend.entity.KhachHang kh1 = new com.noithat.qlnt.backend.entity.KhachHang();
                kh1.setHoTen("Nguyễn Văn A");
                kh1.setEmail("nguyenvana@example.com");
                kh1.setSoDienThoai("0912345678");
                kh1.setDiaChi("123 Đường Lê Lợi, Quận 1, TP.HCM");
                kh1.setNgayThamGia(java.time.LocalDate.now());
                kh1.setNgaySinh(java.time.LocalDate.of(1990, 1, 15));
                kh1.setGioiTinh("Nam");
                kh1.setDiemThuong(150);
                kh1.setHangThanhVien(tiers.get(0));

                com.noithat.qlnt.backend.entity.KhachHang kh2 = new com.noithat.qlnt.backend.entity.KhachHang();
                kh2.setHoTen("Trần Thị B");
                kh2.setEmail("tranthib@example.com");
                kh2.setSoDienThoai("0987654321");
                kh2.setDiaChi("456 Phố Huế, Hà Nội");
                kh2.setNgayThamGia(java.time.LocalDate.now());
                kh2.setNgaySinh(java.time.LocalDate.of(1995, 5, 20));
                kh2.setGioiTinh("Nữ");
                kh2.setDiemThuong(300);
                kh2.setHangThanhVien(tiers.get(1));

                List<com.noithat.qlnt.backend.entity.KhachHang> customersCreated = khachHangRepository
                        .saveAll(Arrays.asList(kh1, kh2));
                System.out.println("✓ Created " + customersCreated.size() + " sample customers");

                // 12. Seed sample notifications (ThongBao) in Vietnamese
                try {
                    com.noithat.qlnt.backend.entity.ThongBao tb1 = new com.noithat.qlnt.backend.entity.ThongBao();
                    tb1.setLoai("info");
                    tb1.setTieuDe("Chào mừng khách hàng mới");
                    tb1.setNoiDung(
                            "Xin chào " + kh1.getHoTen() + ", cảm ơn bạn đã đăng ký tài khoản tại cửa hàng chúng tôi.");
                    tb1.setLoaiNguoiNhan("CUSTOMER");
                    tb1.setNguoiNhanId(kh1.getMaKhachHang());
                    tb1.setDoUuTien("normal");
                    tb1.setNgayTao(java.time.LocalDateTime.now());
                    tb1.setLienKetId(null);

                    com.noithat.qlnt.backend.entity.ThongBao tb2 = new com.noithat.qlnt.backend.entity.ThongBao();
                    tb2.setLoai("success");
                    tb2.setTieuDe("Thanh toán thành công");
                    tb2.setNoiDung("Đơn hàng #1001 của bạn đã được thanh toán. Cảm ơn bạn!");
                    tb2.setLoaiNguoiNhan("ALL");
                    tb2.setDoUuTien("normal");
                    tb2.setNgayTao(java.time.LocalDateTime.now().minusDays(1));

                    // Persist sample notifications using injected ThongBaoRepository
                    try {
                        ThongBao tbEntity1 = new ThongBao();
                        tbEntity1.setLoai("info");
                        tbEntity1.setTieuDe("Chào mừng khách hàng mới");
                        tbEntity1.setNoiDung("Xin chào " + kh1.getHoTen()
                                + ", cảm ơn bạn đã đăng ký tài khoản tại cửa hàng chúng tôi.");
                        tbEntity1.setLoaiNguoiNhan("CUSTOMER");
                        tbEntity1.setNguoiNhanId(kh1.getMaKhachHang());
                        tbEntity1.setDoUuTien("normal");
                        tbEntity1.setNgayTao(LocalDateTime.now());

                        ThongBao tbEntity2 = new ThongBao();
                        tbEntity2.setLoai("success");
                        tbEntity2.setTieuDe("Thanh toán thành công");
                        tbEntity2.setNoiDung("Đơn hàng #1001 của bạn đã được thanh toán. Cảm ơn bạn!");
                        tbEntity2.setLoaiNguoiNhan("ALL");
                        tbEntity2.setDoUuTien("normal");
                        tbEntity2.setNgayTao(LocalDateTime.now().minusDays(1));

                        // Save using the injected repository
                        thongBaoRepository.saveAll(Arrays.asList(tbEntity1, tbEntity2));
                        System.out.println("✓ Created 2 sample ThongBao notifications");
                    } catch (Exception ex) {
                        System.err.println("Không thể tạo ThongBao sample: " + ex.getMessage());
                    }
                } catch (Exception ex) {
                    System.err.println("Lỗi khi tạo sample ThongBao: " + ex.getMessage());
                }

                // 13. Create default accounts (admin, staff) and link to sample customers
                try {
                    System.out.println("Seeding default accounts (admin, staff, customers)...");
                    // Admin account
                    TaiKhoan adminAccount = new TaiKhoan();
                    adminAccount.setTenDangNhap("admin");
                    adminAccount.setMatKhauHash(passwordEncoder.encode("admin"));
                    adminAccount.setEmail("admin@example.com");
                    adminAccount.setVaiTro(adminRole);
                    adminAccount.setEnabled(true);
                    taiKhoanRepository.save(adminAccount);

                    // Staff account
                    TaiKhoan staffAccount = new TaiKhoan();
                    staffAccount.setTenDangNhap("staff");
                    staffAccount.setMatKhauHash(passwordEncoder.encode("staff"));
                    staffAccount.setEmail("staff@example.com");
                    staffAccount.setVaiTro(staffRole);
                    staffAccount.setEnabled(true);
                    taiKhoanRepository.save(staffAccount);

                    // Create accounts for seeded customers and link
                    if (customersCreated != null && !customersCreated.isEmpty()) {
                        TaiKhoan acc1 = new TaiKhoan();
                        acc1.setTenDangNhap("nguyenvana");
                        acc1.setMatKhauHash(passwordEncoder.encode("password"));
                        acc1.setEmail(customersCreated.get(0).getEmail());
                        acc1.setVaiTro(userRole);
                        acc1.setEnabled(true);
                        TaiKhoan savedAcc1 = taiKhoanRepository.save(acc1);
                        customersCreated.get(0).setTaiKhoan(savedAcc1);
                        khachHangRepository.save(customersCreated.get(0));

                        if (customersCreated.size() > 1) {
                            TaiKhoan acc2 = new TaiKhoan();
                            acc2.setTenDangNhap("tranthib");
                            acc2.setMatKhauHash(passwordEncoder.encode("password"));
                            acc2.setEmail(customersCreated.get(1).getEmail());
                            acc2.setVaiTro(userRole);
                            acc2.setEnabled(true);
                            TaiKhoan savedAcc2 = taiKhoanRepository.save(acc2);
                            customersCreated.get(1).setTaiKhoan(savedAcc2);
                            khachHangRepository.save(customersCreated.get(1));
                        }
                    }
                    System.out.println("✓ Created default accounts (admin, staff) and linked customer accounts");
                } catch (Exception ex) {
                    System.err.println("Lỗi khi tạo tài khoản mặc định: " + ex.getMessage());
                }
            } catch (Exception e) {
                System.err.println("Failed to seed customers: " + e.getMessage());
            }

            // 10. Seed some sample reviews if there are customers
            try {
                System.out.println("Seeding sample reviews...");
                java.util.List<com.noithat.qlnt.backend.entity.KhachHang> customers = khachHangRepository.findAll();
                if (!customers.isEmpty() && !products.isEmpty()) {
                    com.noithat.qlnt.backend.entity.KhachHang kh = customers.get(0);
                    // Review for product 1
                    com.noithat.qlnt.backend.entity.DanhGiaSanPham r1 = new com.noithat.qlnt.backend.entity.DanhGiaSanPham();
                    r1.setSanPham(products.get(0));
                    r1.setKhachHang(kh);
                    r1.setDiem(5);
                    r1.setTieuDe("Tốt");
                    r1.setNoiDung("Sản phẩm đẹp, giao nhanh.");
                    danhGiaSanPhamRepository.save(r1);

                    // Review for product 2
                    com.noithat.qlnt.backend.entity.DanhGiaSanPham r2 = new com.noithat.qlnt.backend.entity.DanhGiaSanPham();
                    r2.setSanPham(products.size() > 1 ? products.get(1) : products.get(0));
                    r2.setKhachHang(kh);
                    r2.setDiem(4);
                    r2.setTieuDe("Tốt");
                    r2.setNoiDung("Chất lượng ổn.");
                    danhGiaSanPhamRepository.save(r2);
                }
            } catch (Exception ex) {
                System.err.println("Failed to seed sample reviews: " + ex.getMessage());
            }
        };
    }

    private BienTheSanPham createVariant(SanPham sanPham, String sku, BigDecimal giaMua, BigDecimal giaBan,
            Integer soLuongTon) {
        BienTheSanPham variant = new BienTheSanPham();
        variant.setSanPham(sanPham);
        variant.setSku(sku);
        variant.setGiaMua(giaMua);
        variant.setGiaBan(giaBan);
        variant.setSoLuongTon(soLuongTon);
        variant.setMucTonToiThieu(5);
        variant.setTrangThaiKho("ACTIVE");
        variant.setNgayCapNhatKho(LocalDateTime.now());
        return variant;
    }

    private BienTheThuocTinh createVariantAttribute(BienTheSanPham bienThe, ThuocTinh thuocTinh, String giaTri) {
        BienTheThuocTinh btt = new BienTheThuocTinh();
        btt.setBienTheSanPham(bienThe);
        btt.setThuocTinh(thuocTinh);
        btt.setGiaTri(giaTri);
        return btt;
    }
}
