package com.noithat.qlnt.backend.service.impl;

import com.noithat.qlnt.backend.service.IDashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.ColumnMapRowMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class DashboardServiceImpl implements IDashboardService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private List<Map<String, Object>> runProcedure(String procName) {
        String sql = "EXEC " + procName;
        return jdbcTemplate.query(sql, new ColumnMapRowMapper());
    }

    private List<Map<String, Object>> runProcedureWithIntParam(String procName, String paramName, int value) {
        String sql = "EXEC " + procName + " " + paramName + " = ?";
        return jdbcTemplate.query(sql, ps -> ps.setInt(1, value), new ColumnMapRowMapper());
    }

    private List<Map<String, Object>> runProcedureWithParams(String procName, Object... params) {
        // Build EXEC with positional params: EXEC procName ?, ?, ?
        StringBuilder sb = new StringBuilder("EXEC ").append(procName);
        if (params.length > 0) {
            sb.append(' ');
            for (int i = 0; i < params.length; i++) {
                if (i > 0)
                    sb.append(", ");
                sb.append('?');
            }
        }
        String sql = sb.toString();

        return jdbcTemplate.query(sql, ps -> {
            for (int i = 0; i < params.length; i++) {
                Object p = params[i];
                if (p instanceof Integer)
                    ps.setInt(i + 1, (Integer) p);
                else if (p instanceof Long)
                    ps.setLong(i + 1, (Long) p);
                else if (p instanceof String)
                    ps.setString(i + 1, (String) p);
                else if (p instanceof java.sql.Date)
                    ps.setDate(i + 1, (java.sql.Date) p);
                else if (p == null)
                    ps.setObject(i + 1, null);
                else
                    ps.setObject(i + 1, p);
            }
        }, new ColumnMapRowMapper());
    }

    @Override
    public List<Map<String, Object>> getOverviewMetrics() {
        return runProcedure("sp_Dashboard_GetOverviewMetrics");
    }

    @Override
    public List<Map<String, Object>> getRevenueTrend() {
        return runProcedure("sp_Dashboard_GetRevenueTrend");
    }

    @Override
    public List<Map<String, Object>> getSalesByProduct() {
        return runProcedure("sp_Dashboard_GetSalesByProduct");
    }

    @Override
    public List<Map<String, Object>> getCustomerMetrics() {
        return runProcedure("sp_Dashboard_GetCustomerMetrics");
    }

    @Override
    public List<Map<String, Object>> getInventoryMetrics() {
        return runProcedure("sp_Dashboard_GetInventoryMetrics");
    }

    @Override
    public List<Map<String, Object>> getInventoryAlerts() {
        return runProcedure("sp_Dashboard_GetInventoryAlerts");
    }

    @Override
    public List<Map<String, Object>> getRevenueSummary() {
        return getRevenueSummary(30);
    }

    @Override
    public List<Map<String, Object>> getRevenueSummary(int days) {
        int safeDays = days <= 0 ? 30 : days;
        return runProcedureWithIntParam("sp_Dashboard_GetRevenueSummary", "@Days", safeDays);
    }

    @Override
    public List<Map<String, Object>> getSalesMetrics() {
        return runProcedure("sp_Dashboard_GetSalesMetrics");
    }

    @Override
    public List<Map<String, Object>> getVipCustomerAnalysis() {
        return runProcedure("sp_Dashboard_GetVipCustomerAnalysis");
    }

    @Override
    public List<Map<String, Object>> getCustomerReport(String action, int days, int topN) {
        String safeAction = (action == null || action.isBlank()) ? "segmentation" : action;
        int d = days <= 0 ? 30 : days;
        int n = topN <= 0 ? 10 : topN;
        // Call stored procedure with positional parameters
        return runProcedureWithParams("sp_Report_Customers", safeAction, d, n);
    }

    @Override
    public List<Map<String, Object>> getCustomerReport(String action, java.time.LocalDate startDate,
            java.time.LocalDate endDate, int topN) {
        String safeAction = (action == null || action.isBlank()) ? "segmentation" : action;
        int n = topN <= 0 ? 10 : topN;
        java.sql.Date sd = (startDate != null) ? java.sql.Date.valueOf(startDate) : null;
        java.sql.Date ed = (endDate != null) ? java.sql.Date.valueOf(endDate) : null;
        // Call with all 5 parameters: @Action, @Days, @TopN, @StartDate, @EndDate
        return runProcedureWithParams("sp_Report_Customers",
                safeAction,
                30, /* ignored when dates provided */
                n,
                sd,
                ed);
    }

    @Override
    public List<Map<String, Object>> getCustomerAnalytics(String action, int days) {
        String safeAction = (action == null || action.isBlank()) ? "rfm" : action;
        int d = days <= 0 ? 90 : days;
        return runProcedureWithParams("sp_Report_CustomerAnalytics", safeAction, null, null, d);
    }

    @Override
    public List<Map<String, Object>> getCustomerAnalytics(String action, java.time.LocalDate startDate,
            java.time.LocalDate endDate) {
        String safeAction = (action == null || action.isBlank()) ? "rfm" : action;
        java.sql.Date sd = (startDate != null) ? java.sql.Date.valueOf(startDate) : null;
        java.sql.Date ed = (endDate != null) ? java.sql.Date.valueOf(endDate) : null;
        return runProcedureWithParams("sp_Report_CustomerAnalytics", safeAction, sd, ed, 90);
    }

    @Override
    public List<Map<String, Object>> getProductsReport(String action, int days, int topN, Integer categoryId, Integer brandId) {
        String safeAction = (action == null || action.isBlank()) ? "top-revenue" : action;
        // stored procedure expects snake_case action names
        String spAction = safeAction.replace('-', '_');
        int d = days <= 0 ? 30 : days;
        int n = topN <= 0 ? 10 : topN;
    // Default to using start_date/end_date based on current date and days
    java.time.LocalDate today = java.time.LocalDate.now();
    java.time.LocalDate start = today.minusDays(d);
    java.sql.Date sd = java.sql.Date.valueOf(start);
    java.sql.Date ed = java.sql.Date.valueOf(today);
    return runProcedureWithParams("sp_report_products",
        spAction, d /* kept for compatibility but ignored by SP when dates provided */, n, sd, ed, categoryId, brandId);
    }

    @Override
    public List<Map<String, Object>> getProductsReport(String action, java.time.LocalDate startDate, java.time.LocalDate endDate, int topN, Integer categoryId, Integer brandId) {
        String safeAction = (action == null || action.isBlank()) ? "top-revenue" : action;
        String spAction = safeAction.replace('-', '_');
        int n = topN <= 0 ? 10 : topN;
        java.sql.Date sd = (startDate != null) ? java.sql.Date.valueOf(startDate) : null;
        java.sql.Date ed = (endDate != null) ? java.sql.Date.valueOf(endDate) : null;
        return runProcedureWithParams("sp_report_products", 
            spAction, 30, n, sd, ed, categoryId, brandId);
    }
}
