/**
 * Helper to trigger print dialog for PDF generation with printable CSS formatting.
 */
export function exportPageToPdf(_title: string = "Reporte"): void {
  window.print();
}
