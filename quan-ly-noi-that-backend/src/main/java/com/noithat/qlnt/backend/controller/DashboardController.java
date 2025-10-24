package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.dto.response.DashboardResponse;
import com.noithat.qlnt.backend.dto.response.DonHangResponse;
import com.noithat.qlnt.backend.entity.BienTheSanPham;
import com.noithat.qlnt.backend.entity.KhachHang;
import com.noithat.qlnt.backend.service.IDonHangService;
import com.noithat.qlnt.backend.service.IKhachHangService;
import com.noithat.qlnt.backend.service.IProductService;
import com.noithat.qlnt.backend.service.IQuanLyTonKhoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final IDonHangService donHangService;
    private final IKhachHangService khachHangService;
    private final IProductService productService;
    private final IQuanLyTonKhoService quanLyTonKhoService;

    /**
     * Staff dashboard aggregated metrics.
     * GET /api/v1/dashboard/staff
     */
    @GetMapping("/staff")
    public ResponseEntity<DashboardResponse> getStaffDashboard() {
        DashboardResponse out = new DashboardResponse();

        // Orders: reuse existing service which returns DonHangResponse list
        List<DonHangResponse> orders = donHangService.getTatCaDonHang();
        long ordersCount = orders != null ? orders.size() : 0L;
        // Sum revenue using available fields (thanhTien or tongTienGoc)
        BigDecimal revenue = orders.stream()
                .map(d -> d.getThanhTien() != null ? d.getThanhTien() : d.getTongTienGoc())
                .filter(v -> v != null)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Customers
        List<KhachHang> customers = khachHangService.getAll();
        long customersCount = customers != null ? customers.size() : 0L;

        // Products: reuse productService.getAllProducts() which returns product DTOs
        List<?> products = productService.getAllProducts();
        long productsCount = products != null ? products.size() : 0L;

        // Recent Orders: take first 5 (sorted by date if available)
        List<DashboardResponse.RecentOrderItem> recent = orders.stream()
                .sorted((a, b) -> {
                    if (a.getNgayDatHang() == null || b.getNgayDatHang() == null) return 0;
                    return b.getNgayDatHang().compareTo(a.getNgayDatHang());
                })
                .limit(5)
                .map(d -> {
                    DashboardResponse.RecentOrderItem item = new DashboardResponse.RecentOrderItem();
                    item.setId(d.getMaDonHang());
                    item.setOrderNumber(d.getMaDonHang() != null ? ("DH" + d.getMaDonHang()) : null);
                    item.setCustomerName(d.getTenKhachHang());
                    item.setAmount(d.getThanhTien() != null ? d.getThanhTien() : d.getTongTienGoc());
                    item.setStatus(d.getTrangThai());
                    item.setCreatedAt(d.getNgayDatHang());
                    return item;
                })
                .collect(Collectors.toList());

        // Low stock: reuse stock management service
        List<BienTheSanPham> lowStock = quanLyTonKhoService.getLowStockProducts();
        List<DashboardResponse.LowStockItem> lowStockItems = lowStock.stream().map(bt -> {
            DashboardResponse.LowStockItem li = new DashboardResponse.LowStockItem();
            li.setVariantId(bt.getMaBienThe());
            li.setSku(bt.getSku());
            li.setProductName(bt.getSanPham() != null ? bt.getSanPham().getTenSanPham() : null);
            li.setCurrentStock(bt.getSoLuongTon());
            li.setMinStock(null); // service currently doesn't expose minStock, leave null
            return li;
        }).limit(10).collect(Collectors.toList());

        out.setOrdersCount(ordersCount);
        out.setRevenue(revenue);
        out.setCustomersCount(customersCount);
        out.setProductsCount(productsCount);
        out.setRecentOrders(recent);
        out.setLowStockAlerts(lowStockItems);
        out.setGrowth(0.0);

        return ResponseEntity.ok(out);
    }
}
