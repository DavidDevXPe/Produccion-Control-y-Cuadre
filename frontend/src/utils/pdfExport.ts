/**
 * Utility helper for triggering browser print-to-PDF
 * for weekly summary and daily production reports.
 */

export function exportPageToPdf(reportTitle?: string): void {
  if (typeof window === "undefined") return;

  const originalTitle = document.title;
  if (reportTitle) {
    document.title = `${reportTitle} - Trabunda Producción`;
  }

  window.print();

  if (reportTitle) {
    document.title = originalTitle;
  }
}
