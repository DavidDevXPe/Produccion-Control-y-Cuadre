/**
 * Helper to trigger print dialog for PDF generation with printable CSS formatting.
 */
export function exportPageToPdf(title: string = "Reporte"): void {
  const previousTitle = document.title;
  if (title) {
    document.title = title;
  }
  window.print();
  document.title = previousTitle;
}
