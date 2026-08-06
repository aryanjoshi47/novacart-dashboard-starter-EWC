/**
 * exportToExcel.js
 *
 * Exports one or more named sheets of data to a formatted .xlsx file.
 *
 * Usage:
 *   exportToExcel(filename, [
 *     { sheetName: 'Monthly Revenue', headers: [...], rows: [...], colWidths: [...] },
 *   ]);
 *
 * Each sheet config:
 *   sheetName  – tab label in Excel
 *   headers    – array of column header strings
 *   rows       – array of arrays (one inner array per row, values in same order as headers)
 *   colWidths  – (optional) array of { wch: number } column width objects
 */

import * as XLSX from 'xlsx';

export function exportToExcel(filename, sheets) {
  const wb = XLSX.utils.book_new();

  sheets.forEach(({ sheetName, headers, rows, colWidths }) => {
    // Build array-of-arrays: header row first, then data rows
    const aoa = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(aoa);

    // Bold the header row via cell styles (xlsx community edition supports cell metadata)
    headers.forEach((_, colIdx) => {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIdx });
      if (!ws[cellAddress]) return;
      ws[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'D9E1F2' } },
        alignment: { horizontal: 'center' },
      };
    });

    // Column widths
    if (colWidths && colWidths.length) {
      ws['!cols'] = colWidths;
    }

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  });

  XLSX.writeFile(wb, `${filename}.xlsx`);
}
