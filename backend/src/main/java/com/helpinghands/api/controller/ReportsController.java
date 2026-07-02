package com.helpinghands.api.controller;

import com.helpinghands.application.dto.ApiResponse;
import com.helpinghands.application.dto.reports.ReportsSummaryResponse;
import com.helpinghands.application.service.ReportsService;
import com.helpinghands.domain.entity.Request;
import com.helpinghands.infrastructure.repository.RequestRepository;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * PDF export is not implemented yet — CSV covers the "Excel export" spec
 * requirement (opens natively in Excel/Sheets) without pulling in a heavy
 * PDF-generation dependency for an MVP. Swapping in a PDF library later is
 * additive, not a rework of this controller.
 */
@RestController
@RequestMapping("/api/v1/admin/reports")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMINISTRATOR')")
@Tag(name = "Admin Reports", description = "Platform-wide summary stats and CSV export")
public class ReportsController {

    private final ReportsService reportsService;
    private final RequestRepository requestRepository;

    @GetMapping("/summary")
    public ApiResponse<ReportsSummaryResponse> getSummary() {
        return ApiResponse.ok("Retrieved", reportsService.getSummary());
    }

    @GetMapping("/requests/export")
    public ResponseEntity<String> exportRequestsCsv() {
        StringBuilder csv = new StringBuilder("ID,Title,Type,Category,Urgency,Status,Home,PledgedBy,CreatedDate\n");

        for (Request r : requestRepository.findAll()) {
            String category = r.isGoods()
                    ? (r.getGoodsCategory() != null ? r.getGoodsCategory().name() : "")
                    : (r.getServiceCategory() != null ? r.getServiceCategory().name() : "");

            csv.append(csvEscape(r.getId()))
               .append(',').append(csvEscape(r.getTitle()))
               .append(',').append(csvEscape(r.getRequestType()))
               .append(',').append(csvEscape(category))
               .append(',').append(csvEscape(r.getUrgency()))
               .append(',').append(csvEscape(r.getStatus()))
               .append(',').append(csvEscape(r.getChildrensHome().getHomeName()))
               .append(',').append(csvEscape(r.getPledgedBy() != null ? r.getPledgedBy().getUsername() : ""))
               .append(',').append(csvEscape(r.getCreatedDate()))
               .append('\n');
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"requests-export.csv\"")
                .body(csv.toString());
    }

    private String csvEscape(Object value) {
        if (value == null) return "";
        String s = value.toString().replace("\"", "\"\"");
        return s.contains(",") || s.contains("\"") ? "\"" + s + "\"" : s;
    }
}
