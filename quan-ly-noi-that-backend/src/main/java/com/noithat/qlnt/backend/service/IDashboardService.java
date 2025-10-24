package com.noithat.qlnt.backend.service;

import java.util.List;
import java.util.Map;

public interface IDashboardService {
    List<Map<String, Object>> getOverviewMetrics();
    List<Map<String, Object>> getRevenueTrend();
    List<Map<String, Object>> getSalesByProduct();
    List<Map<String, Object>> getCustomerMetrics();
    List<Map<String, Object>> getInventoryMetrics();
    List<Map<String, Object>> getInventoryAlerts();
    List<Map<String, Object>> getRevenueSummary();
    List<Map<String, Object>> getRevenueSummary(int days);
    List<Map<String, Object>> getSalesMetrics();
    List<Map<String, Object>> getVipCustomerAnalysis();
    List<Map<String, Object>> getCustomerReport(String action, int days, int topN);
    java.util.List<java.util.Map<String, Object>> getCustomerReport(String action, java.time.LocalDate startDate, java.time.LocalDate endDate, int topN);
    
    // Advanced Analytics
    List<Map<String, Object>> getCustomerAnalytics(String action, int days);
    List<Map<String, Object>> getCustomerAnalytics(String action, java.time.LocalDate startDate, java.time.LocalDate endDate);
    
    // Products Report
    List<Map<String, Object>> getProductsReport(String action, int days, int topN, Integer categoryId, Integer brandId);
    List<Map<String, Object>> getProductsReport(String action, java.time.LocalDate startDate, java.time.LocalDate endDate, int topN, Integer categoryId, Integer brandId);
}
