/**
 * exportToCSV
 * Generic utility for exporting tabular data to a CSV file in the browser.
 * Uses only native browser APIs — no external dependencies required.
 */

type CsvRow = Record<string, string | number | boolean | null | undefined>;

/**
 * Escape a single cell value for CSV output.
 * Wraps in quotes if the value contains commas, quotes, or newlines.
 */
function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  // Wrap in double quotes if the value contains a comma, double-quote, or newline
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Convert an array of objects to a CSV string.
 * @param rows    Array of plain objects — all values must be primitive.
 * @param columns Optional explicit column order + header labels.
 *                If omitted, columns are derived from the first row's keys.
 */
export function toCsvString(
  rows: CsvRow[],
  columns?: { key: string; label: string }[]
): string {
  if (rows.length === 0) return "";

  const cols =
    columns ?? Object.keys(rows[0]).map((key) => ({ key, label: key }));

  const header = cols.map((c) => escapeCsvCell(c.label)).join(",");
  const body = rows
    .map((row) => cols.map((c) => escapeCsvCell(row[c.key])).join(","))
    .join("\n");

  return `${header}\n${body}`;
}

/**
 * Trigger a browser file download for a given CSV string.
 * @param csvString  The CSV content to download.
 * @param filename   Desired filename (e.g. "users_export.csv").
 */
export function downloadCsvFile(csvString: string, filename: string): void {
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Convenience: convert rows to CSV and immediately trigger download.
 * @param rows      Array of plain objects to export.
 * @param filename  Desired filename (e.g. "users_2026_04_07.csv").
 * @param columns   Optional explicit column order + header labels.
 */
export function exportToCSV(
  rows: CsvRow[],
  filename: string,
  columns?: { key: string; label: string }[]
): void {
  if (rows.length === 0) return;
  const csv = toCsvString(rows, columns);
  downloadCsvFile(csv, filename);
}

/**
 * Generate a timestamped filename suitable for exports.
 * e.g. "users_export_2026-04-07.csv"
 */
export function buildExportFilename(prefix: string): string {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return `${prefix}_export_${date}.csv`;
}
