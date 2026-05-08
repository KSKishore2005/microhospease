package com.cognizant.hospease.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.stream.Stream;

@Service
public class PdfGeneratorService {

    @Value("${report.storage.path}")
    private String folderPath;

    public String generateOccupancyReport(String fileName, String reportTitle, String parameters, String dataSummary)
            throws IOException {

        File directory = new File(folderPath);
        if (!directory.exists()) directory.mkdirs();

        String filePath = folderPath + File.separator + fileName;
        Document document = new Document(PageSize.A4, 36, 36, 54, 36);

        try (FileOutputStream fos = new FileOutputStream(filePath)) {
            PdfWriter.getInstance(document, fos);
            document.open();

            // 1. Corporate Branding Header
            Font brandFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 24, new Color(0, 51, 102)); // Navy Blue
            Paragraph brand = new Paragraph("HOSPEASE HOTEL GROUP", brandFont);
            brand.setAlignment(Element.ALIGN_LEFT);
            document.add(brand);

            Font subBrandFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.GRAY);
            document.add(new Paragraph("Global Operations & Analytics Division", subBrandFont));

            document.add(new Paragraph(" ")); // Spacer

            // 2. Report Title and Metadata
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Paragraph title = new Paragraph(reportTitle.toUpperCase(), titleFont);
            title.setSpacingAfter(10f);
            document.add(title);

            PdfPTable metaTable = new PdfPTable(2);
            metaTable.setWidthPercentage(100);
            metaTable.addCell(createLabelCell("Run Date: " + LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm"))));
            metaTable.addCell(createLabelCell("Filter Criteria: " + parameters));
            document.add(metaTable);

            document.add(new Paragraph("______________________________________________________________________________"));
            document.add(new Paragraph(" "));

            // 3. Operational Data Table (The "Real" Management Grid)
            document.add(new Paragraph("DETAILED OPERATIONAL BREAKDOWN", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11)));
            document.add(new Paragraph(" "));

            PdfPTable dataTable = new PdfPTable(4); // 4 Columns: Room, Category, Status, Revenue
            dataTable.setWidthPercentage(100);
            dataTable.setSpacingBefore(10f);

            // Add Table Headers
            Stream.of("Room No.", "Room Category", "Occupancy Status", "Nightly Rate")
                    .forEach(columnTitle -> {
                        PdfPCell header = new PdfPCell();
                        header.setBackgroundColor(new Color(0, 51, 102));
                        header.setBorderWidth(1);
                        header.setPhrase(new Phrase(columnTitle, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE)));
                        header.setHorizontalAlignment(Element.ALIGN_CENTER);
                        header.setPadding(5);
                        dataTable.addCell(header);
                    });

            // Mock Data Rows (Simulating a real hotel inventory)
            addTableRow(dataTable, "101", "Deluxe King", "OCCUPIED", "$250.00");
            addTableRow(dataTable, "102", "Executive Suite", "VACANT", "$450.00");
            addTableRow(dataTable, "205", "Standard Twin", "MAINTENANCE", "$0.00");
            addTableRow(dataTable, "304", "Presidential", "OCCUPIED", "$1,200.00");

            document.add(dataTable);

            // 4. Executive Summary / Manager's Notes
            document.add(new Paragraph(" "));
            document.add(new Paragraph("MANAGER'S SUMMARY & NOTES", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11)));

            PdfPTable notesTable = new PdfPTable(1);
            notesTable.setWidthPercentage(100);
            notesTable.setSpacingBefore(5f);

            PdfPCell notesCell = new PdfPCell(new Phrase(dataSummary, FontFactory.getFont(FontFactory.HELVETICA, 10)));
            notesCell.setPadding(10);
            notesCell.setBackgroundColor(new Color(245, 245, 245));
            notesTable.addCell(notesCell);
            document.add(notesTable);

            // 5. Footer
            document.add(new Paragraph(" "));
            Paragraph footer = new Paragraph("© 2026 HospEase Group. Internal Use Only. Page 1 of 1",
                    FontFactory.getFont(FontFactory.HELVETICA, 8, Color.GRAY));
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
        }

        return filePath;
    }

    private void addTableRow(PdfPTable table, String c1, String c2, String c3, String c4) {
        table.addCell(createDataCell(c1));
        table.addCell(createDataCell(c2));
        table.addCell(createDataCell(c3));
        table.addCell(createDataCell(c4));
    }

    private PdfPCell createDataCell(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA, 9)));
        cell.setPadding(5);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        return cell;
    }

    private PdfPCell createLabelCell(String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA, 10)));
        cell.setBorder(Rectangle.NO_BORDER);
        return cell;
    }
}