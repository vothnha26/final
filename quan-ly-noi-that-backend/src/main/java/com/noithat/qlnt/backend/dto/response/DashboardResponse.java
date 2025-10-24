package com.noithat.qlnt.backend.dto.response;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class DashboardResponse {
    private long ordersCount;
    private BigDecimal revenue;
    private long customersCount;
    private long productsCount;
    private double growth; // optional, set by service if available
    private List<RecentOrderItem> recentOrders;
    private List<LowStockItem> lowStockAlerts;

    @Data
    public static class RecentOrderItem {
        private Integer id;
        private String orderNumber;
        private String customerName;
        private BigDecimal amount;
        private String status;
        private LocalDateTime createdAt;
    }

    @Data
    public static class LowStockItem {
        private Integer variantId;
        private String sku;
        private String productName;
        private Integer currentStock;
        private Integer minStock;
    }
}
