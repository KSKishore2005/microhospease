package com.cognizant.hospease.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Slf4j
@Service
public class PdfGeneratorService {

    @Value("${report.storage.path}")
    private String folderPath;

    /**
     * Generates a styled PDF and returns the absolute path of the saved file.
     */
    public String generatePdf(String fileName, String reportTitle,
                              String parameters, String dataSummary) throws IOException {

        File directory = new File(folderPath);
        if (!directory.exists()) directory.mkdirs();

        String filePath = folderPath + File.separator + fileName;
        Document document = new Document(PageSize.A4, 36, 36, 54, 36);

        try (FileOutputStream fos = new FileOutputStream(filePath)) {
            PdfWriter.getInstance(document, fos);
            document.open();

            // Branding
            Font brandFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24, new Color(0, 51, 102));
            Paragraph brand = new Paragraph("HOSPEASE HOTEL GROUP", brandFont);
            brand.setAlignment(Element.ALIGN_LEFT);
            document.add(brand);

            Font subBrandFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY);
            document.add(new Paragraph("Global Operations & Analytics Division", subBrandFont));
            document.add(new Paragraph(" "));

            // Title
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Paragraph title = new Paragraph(reportTitle.toUpperCase(), titleFont);
            title.setSpacingAfter(10f);
            document.add(title);

            // Meta table
            PdfPTable metaTable = new PdfPTable(2);
            metaTable.setWidthPercentage(100);
            metaTable.addCell(labelCell("Run Date: " + LocalDateTime.now()
                    .format(DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm"))));
            metaTable.addCell(labelCell("Filter Criteria: " + parameters));
            document.add(metaTable);

            document.add(new Paragraph("________________________________________________________"));
            document.add(new Paragraph(" "));

            // Summary section
            document.add(new Paragraph("REPORT SUMMARY",
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11)));

            PdfPTable notesTable = new PdfPTable(1);
            notesTable.setWidthPercentage(100);
            notesTable.setSpacingBefore(5f);

            PdfPCell notesCell = new PdfPCell(new Phrase(dataSummary != null ? dataSummary : "",
                    FontFactory.getFont(FontFactory.HELVETICA, 10)));
            notesCell.setPadding(10);
            notesCell.setBackgroundColor(new Color(245, 245, 245));
            notesTable.addCell(notesCell);
            document.add(notesTable);

            // Footer
            document.add(new Paragraph(" "));
            Paragraph footer = new Paragraph("© 2026 HospEase Group. Internal Use Only.",
                    FontFactory.getFont(FontFactory.HELVETICA, 8, Color.GRAY));
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
        }

        log.info("PDF generated: {}", filePath);
        return filePath;
    }

    private PdfPCell labelCell(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text,
                FontFactory.getFont(FontFactory.HELVETICA, 10)));
        cell.setBorder(Rectangle.NO_BORDER);
        return cell;
    }
}
