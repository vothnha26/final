package com.noithat.qlnt.backend.service;

import com.noithat.qlnt.backend.dto.FinancialReportRequest;
import com.noithat.qlnt.backend.repository.ReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class ReportService {

    @Autowired
    private ReportRepository reportRepository;

    public List<Map<String, Object>> getFinancialReport(FinancialReportRequest request) {
        // Validate action
        String action = request.getAction();
        if (!isValidAction(action)) {
            throw new IllegalArgumentException("Invalid action: " + action);
        }

        // Execute stored procedure
        return reportRepository.executeFinancialReport(
            action,
            request.getStartDate(),
            request.getEndDate()
        );
    }

    private boolean isValidAction(String action) {
        return action != null && (
            action.equals("Financial_Summary") ||
            action.equals("Financial_Trend") ||
            action.equals("Financial_CostStructure") ||
            action.equals("Financial_OrderDistribution") ||
            action.equals("Financial_Waterfall")
        );
    }
}
