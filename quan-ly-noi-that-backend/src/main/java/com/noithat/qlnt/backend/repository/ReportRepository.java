package com.noithat.qlnt.backend.repository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.sql.DataSource;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Repository
public class ReportRepository {

    private static final Logger logger = LoggerFactory.getLogger(ReportRepository.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public List<Map<String, Object>> executeFinancialReport(String action, LocalDate startDate, LocalDate endDate) {
        List<Map<String, Object>> results = new ArrayList<>();

        // Null-safe defaults (last 30 days)
        LocalDate safeEnd = (endDate != null) ? endDate : LocalDate.now();
        LocalDate safeStart = (startDate != null) ? startDate : safeEnd.minusDays(30);

        // SQL Server DATETIME2 expects timestamp, we pass start-of-day and end-of-day
        LocalDateTime startTs = safeStart.atStartOfDay();
        LocalDateTime endTs = safeEnd.atTime(LocalTime.of(23, 59, 59));

        logger.info("Executing financial report - Action: {}, StartDate: {}, EndDate: {}", action, safeStart, safeEnd);

        DataSource ds = jdbcTemplate.getDataSource();
        if (ds == null) {
            String msg = "No DataSource configured for JdbcTemplate";
            logger.error(msg);
            throw new IllegalStateException(msg);
        }

    String sql = "{call dbo.sp_Report_Financial(?, ?, ?)}"; // explicit schema for SQL Server

        try (Connection connection = ds.getConnection();
             CallableStatement statement = connection.prepareCall(sql)) {

            statement.setString(1, action);
            statement.setTimestamp(2, Timestamp.valueOf(startTs));
            statement.setTimestamp(3, Timestamp.valueOf(endTs));

            boolean hasResults = statement.execute();

            // Some JDBC drivers may return update counts before the first result set.
            // Iterate until we find a result set or there are no more results.
            boolean processed = false;
            while (true) {
                if (hasResults) {
                    try (ResultSet rs = statement.getResultSet()) {
                        results = convertResultSetToList(rs);
                        processed = true;
                        logger.info("Financial report executed successfully - {} rows returned", results.size());
                    }
                    break;
                } else {
                    int updateCount = statement.getUpdateCount();
                    if (updateCount == -1) {
                        break; // no more results
                    }
                }
                hasResults = statement.getMoreResults();
            }

            if (!processed) {
                logger.warn("Stored procedure sp_Report_Financial returned no result set.");
            }

        } catch (SQLException e) {
            logger.error("Error executing sp_Report_Financial. SQLState={}, ErrorCode={}, Message={}",
                    safe(e.getSQLState()), e.getErrorCode(), e.getMessage(), e);
            throw new RuntimeException("Error executing financial report: " + e.getMessage(), e);
        }

        return results;
    }

    private String safe(String s) { return s == null ? "" : s; }
    
    private List<Map<String, Object>> convertResultSetToList(ResultSet rs) throws SQLException {
        List<Map<String, Object>> list = new ArrayList<>();
        int columnCount = rs.getMetaData().getColumnCount();
        
        while (rs.next()) {
            Map<String, Object> row = new HashMap<>();
            for (int i = 1; i <= columnCount; i++) {
                String columnName = rs.getMetaData().getColumnName(i);
                Object value = rs.getObject(i);
                row.put(columnName, value);
            }
            list.add(row);
        }
        
        return list;
    }
}
