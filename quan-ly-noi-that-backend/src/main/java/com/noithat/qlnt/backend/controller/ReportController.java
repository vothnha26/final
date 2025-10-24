package com.noithat.qlnt.backend.controller;

import com.noithat.qlnt.backend.dto.FinancialReportRequest;
import com.noithat.qlnt.backend.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import jakarta.annotation.security.PermitAll;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    @Autowired
    private ReportService reportService;
    private static final Logger logger = LoggerFactory.getLogger(ReportController.class);

    @PostMapping("/financial")
    @PermitAll
    public ResponseEntity<List<Map<String, Object>>> getFinancialReport(
            @RequestBody FinancialReportRequest request) {
        try {
            List<Map<String, Object>> result = reportService.getFinancialReport(request);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            logger.warn("Bad request for financial report: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            // Log full error for server-side troubleshooting
            logger.error("Financial report failed: {}", e.getMessage(), e);
            // Return a minimal error for clients to help diagnose during dev
            return ResponseEntity.status(500).body(List.of(Map.of(
                "error", "Financial report failed",
                "message", e.getMessage() != null ? e.getMessage() : "Internal Server Error"
            )));
        }
    }
}
