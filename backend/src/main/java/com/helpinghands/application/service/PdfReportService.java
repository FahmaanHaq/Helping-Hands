package com.helpinghands.application.service;

import com.helpinghands.application.dto.reports.ReportsSummaryResponse;
import com.helpinghands.domain.entity.Request;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Deliberately hand-rolled with PDFBox's low-level content stream API rather
 * than a templating/table library — there's no table layout engine in plain
 * PDFBox, so this manually tracks a Y cursor and starts a new page when it
 * runs out of room. Adequate for a report this shape; would need a proper
 * reporting library (e.g. JasperReports) if this grows into multi-column
 * layouts, images, or anything visually complex.
 */
@Service
public class PdfReportService {

    private static final float MARGIN = 50;
    private static final float PAGE_WIDTH = PDRectangle.A4.getWidth();
    private static final float PAGE_HEIGHT = PDRectangle.A4.getHeight();
    private static final float LINE_HEIGHT = 16;
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public byte[] generateReportPdf(ReportsSummaryResponse summary, List<Request> requests) {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            var titleFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
            var bodyFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
            var boldFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);

            PageCursor cursor = new PageCursor(document);

            cursor.writeLine("Helping Hands - Platform Report", titleFont, 16);
            cursor.writeLine("Generated " + java.time.LocalDateTime.now().format(DATE_FMT), bodyFont, 9);
            cursor.blankLine();

            cursor.writeLine("Summary", boldFont, 12);
            cursor.writeLine("Goods Requests: " + summary.totalGoodsRequests()
                    + "    Service Requests: " + summary.totalServiceRequests(), bodyFont, 10);
            cursor.writeLine("Active: " + summary.activeRequests()
                    + "    Completed: " + summary.completedRequests()
                    + "    Cancelled: " + summary.cancelledRequests(), bodyFont, 10);
            cursor.writeLine("Donors: " + summary.totalDonors()
                    + "    Service Providers: " + summary.totalServiceProviders()
                    + "    Children's Homes: " + summary.totalChildrensHomes(), bodyFont, 10);
            cursor.writeLine("Suspended Users: " + summary.suspendedUsers()
                    + "    Platform Avg Rating: " + (summary.platformAverageRating() != null
                            ? String.format("%.1f", summary.platformAverageRating()) : "N/A")
                    + " (" + summary.totalRatingsSubmitted() + " ratings)", bodyFont, 10);
            cursor.blankLine();

            cursor.writeLine("Requests (" + requests.size() + ")", boldFont, 12);
            cursor.writeLine(String.format("%-6s %-30s %-8s %-10s %-12s %-20s", "ID", "Title", "Type", "Urgency", "Status", "Home"), boldFont, 9);

            for (Request r : requests) {
                String title = truncate(r.getTitle(), 28);
                String home = truncate(r.getChildrensHome().getHomeName(), 18);

                cursor.writeLine(String.format("%-6d %-30s %-8s %-10s %-12s %-20s",
                        r.getId(), title, r.getRequestType(), r.getUrgency(), r.getStatus(), home), bodyFont, 9);
            }

            cursor.close();
            document.save(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new RuntimeException("Failed to generate PDF report", e);
        }
    }

    private String truncate(String s, int maxLen) {
        if (s == null) return "";
        return s.length() <= maxLen ? s : s.substring(0, maxLen - 1) + "…";
    }

    /**
     * Tracks the current page/content-stream/Y-position and transparently
     * starts a new page when content would run off the bottom margin.
     */
    private static class PageCursor {
        private final PDDocument document;
        private PDPageContentStream contentStream;
        private float y;

        PageCursor(PDDocument document) throws IOException {
            this.document = document;
            newPage();
        }

        void writeLine(String text, PDType1Font font, float fontSize) throws IOException {
            if (y < MARGIN + LINE_HEIGHT) {
                newPage();
            }
            contentStream.beginText();
            contentStream.setFont(font, fontSize);
            contentStream.newLineAtOffset(MARGIN, y);
            contentStream.showText(sanitize(text));
            contentStream.endText();
            y -= LINE_HEIGHT;
        }

        void blankLine() {
            y -= LINE_HEIGHT / 2;
        }

        private String sanitize(String text) {
            // PDFBox's standard fonts (WinAnsiEncoding) can't render every
            // Unicode character (e.g. some emoji or CJK) — strip anything
            // outside the printable Latin-1 range rather than throwing.
            StringBuilder sb = new StringBuilder();
            for (char c : text.toCharArray()) {
                sb.append(c < 256 ? c : '?');
            }
            return sb.toString();
        }

        private void newPage() throws IOException {
            if (contentStream != null) {
                contentStream.close();
            }
            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);
            contentStream = new PDPageContentStream(document, page);
            y = PAGE_HEIGHT - MARGIN;
        }

        void close() throws IOException {
            contentStream.close();
        }
    }
}
