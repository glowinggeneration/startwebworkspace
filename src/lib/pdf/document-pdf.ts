import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface PdfLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface DocumentPdfInput {
  kind: "Quote" | "Invoice";
  number: string;
  issueDate: string;
  dueOrExpiryDate?: string | null;
  accountName: string;
  lineItems: PdfLineItem[];
  notes?: string | null;
  brandName?: string;
}

const currencyFormat = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 2,
});

/** Renders a quote or invoice to a downloadable PDF. Pure client-side —
 * no server round trip, matching the numbers already shown on screen. */
export function generateDocumentPdf(input: DocumentPdfInput): jsPDF {
  const doc = new jsPDF();
  const brand = input.brandName ?? "Startweb";

  doc.setFontSize(18);
  doc.text(brand, 14, 20);
  doc.setFontSize(12);
  doc.text(`${input.kind} ${input.number}`, 14, 28);

  doc.setFontSize(10);
  doc.text(`Billed to: ${input.accountName}`, 14, 40);
  doc.text(`Issue date: ${input.issueDate}`, 14, 46);
  if (input.dueOrExpiryDate) {
    const label = input.kind === "Invoice" ? "Due date" : "Expires";
    doc.text(`${label}: ${input.dueOrExpiryDate}`, 14, 52);
  }

  const total = input.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  autoTable(doc, {
    startY: 60,
    head: [["Description", "Qty", "Unit price", "Total"]],
    body: input.lineItems.map((item) => [
      item.description,
      String(item.quantity),
      currencyFormat.format(item.unitPrice),
      currencyFormat.format(item.quantity * item.unitPrice),
    ]),
    foot: [["", "", "Total", currencyFormat.format(total)]],
    theme: "grid",
    headStyles: { fillColor: [0, 61, 255] },
  });

  if (input.notes) {
    const finalY =
      (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 60;
    doc.setFontSize(10);
    doc.text("Notes", 14, finalY + 12);
    doc.text(doc.splitTextToSize(input.notes, 180), 14, finalY + 18);
  }

  return doc;
}

export function downloadDocumentPdf(input: DocumentPdfInput): void {
  const doc = generateDocumentPdf(input);
  doc.save(`${input.kind.toLowerCase()}-${input.number}.pdf`);
}

export interface StatementPdfInput {
  accountName: string;
  generatedOn: string;
  lines: Array<{
    invoiceNumber: string;
    issueDate: string;
    total: number;
    paid: number;
    balance: number;
  }>;
  brandName?: string;
}

export function downloadStatementPdf(input: StatementPdfInput): void {
  const doc = new jsPDF();
  const brand = input.brandName ?? "Startweb";

  doc.setFontSize(18);
  doc.text(brand, 14, 20);
  doc.setFontSize(12);
  doc.text(`Statement for ${input.accountName}`, 14, 28);
  doc.setFontSize(10);
  doc.text(`Generated ${input.generatedOn}`, 14, 36);

  const totalOutstanding = input.lines.reduce((sum, line) => sum + line.balance, 0);

  autoTable(doc, {
    startY: 44,
    head: [["Invoice", "Issued", "Total", "Paid", "Balance"]],
    body: input.lines.map((line) => [
      line.invoiceNumber,
      line.issueDate,
      currencyFormat.format(line.total),
      currencyFormat.format(line.paid),
      currencyFormat.format(line.balance),
    ]),
    foot: [["", "", "", "Outstanding", currencyFormat.format(totalOutstanding)]],
    theme: "grid",
    headStyles: { fillColor: [0, 61, 255] },
  });

  doc.save(`statement-${input.accountName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
