import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { COMPANY_INFO } from "./company-info";

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
  projectName?: string | null;
  lineItems: PdfLineItem[];
  notes?: string | null;
  /** Set false for a client not charged VAT. Defaults to true. */
  includeVat?: boolean;
}

const currencyFormat = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 2,
});

const BLUE: [number, number, number] = [0, 61, 255];
const BLACK: [number, number, number] = [17, 17, 17];
const GREY: [number, number, number] = [107, 114, 128];
const DARK_GREY: [number, number, number] = [55, 55, 55];
const LIGHT_GREY: [number, number, number] = [245, 245, 247];

const MARGIN = 14;
const PAGE_WIDTH = 210;
const CONTENT_RIGHT = PAGE_WIDTH - MARGIN;
const RIGHT_COL_A = 120;
const RIGHT_COL_B = 168;

/** Shared letterhead — top/bottom black bars, the STARTWEB wordmark and
 * company line — matching the paid AfriBiz invoice used as the design
 * reference for every document this app generates. */
function drawLetterhead(doc: jsPDF, kindLabel: string, counterpart: string): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  doc.text(`Startweb ${kindLabel}`, MARGIN, 10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...BLACK);
  doc.text(counterpart.toUpperCase(), CONTENT_RIGHT, 10, { align: "right" });

  doc.setFillColor(...BLACK);
  doc.rect(0, 13, PAGE_WIDTH, 3, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...BLACK);
  doc.text("START", MARGIN, 32);
  doc.setTextColor(...BLUE);
  doc.text("WEB", MARGIN + doc.getTextWidth("START"), 32);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BLACK);
  doc.text(COMPANY_INFO.legalName, MARGIN, 41);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...GREY);
  doc.text(COMPANY_INFO.email, MARGIN, 46);

  return 62;
}

function drawHeading(doc: jsPDF, title: string, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...BLUE);
  doc.text(title, MARGIN, y);
  return y + 14;
}

function labelValue(doc: jsPDF, label: string, value: string, x: number, y: number): void {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BLACK);
  doc.text(label, x, y);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...DARK_GREY);
  doc.text(value, x, y + 5);
}

function drawFooter(doc: jsPDF): void {
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFillColor(...BLACK);
  doc.rect(0, pageHeight - 10, PAGE_WIDTH, 3, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...GREY);
  doc.text(new Date().toLocaleString("en-ZA"), MARGIN, pageHeight - 4);
  doc.text(String(doc.getNumberOfPages()), CONTENT_RIGHT, pageHeight - 4, { align: "right" });
}

function drawBankingDetails(doc: jsPDF, y: number): number {
  doc.setFillColor(...BLUE);
  doc.rect(MARGIN, y, CONTENT_RIGHT - MARGIN, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("Banking Details", MARGIN + 3, y + 5.5);

  const rows: Array<[string, string]> = [
    ["Bank:", COMPANY_INFO.bank.name],
    ["Account No:", COMPANY_INFO.bank.accountNumber],
    ["Account Holder:", COMPANY_INFO.bank.accountHolder],
  ];
  let rowY = y + 16;
  doc.setFontSize(9);
  for (const [label, value] of rows) {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BLACK);
    doc.text(label, MARGIN, rowY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK_GREY);
    doc.text(value, MARGIN + 38, rowY);
    rowY += 6;
  }
  return rowY;
}

function getFinalY(doc: jsPDF, fallback: number): number {
  return (
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? fallback
  );
}

/** Renders a quote or invoice to a downloadable PDF. Pure client-side —
 * no server round trip, matching the numbers already shown on screen. */
export function generateDocumentPdf(input: DocumentPdfInput): jsPDF {
  const doc = new jsPDF();
  const letterheadEnd = drawLetterhead(doc, input.kind, input.accountName);
  const infoY = drawHeading(doc, input.kind, letterheadEnd);

  labelValue(doc, `${input.kind} for`, input.accountName, MARGIN, infoY);
  labelValue(doc, "Payable to", COMPANY_INFO.payableTo, RIGHT_COL_A, infoY);
  labelValue(doc, `${input.kind} #`, input.number, RIGHT_COL_B, infoY);

  const row2Y = infoY + 16;
  labelValue(doc, "Project", input.projectName ?? "—", RIGHT_COL_A, row2Y);
  labelValue(doc, "Date", input.issueDate, RIGHT_COL_B, row2Y);

  let tableStartY = row2Y + 14;
  if (input.dueOrExpiryDate) {
    const label = input.kind === "Invoice" ? "Due date" : "Expires";
    labelValue(doc, label, input.dueOrExpiryDate, RIGHT_COL_B, row2Y + 16);
    tableStartY = row2Y + 30;
  }

  // The line-item total is treated as VAT-inclusive: it's the same number
  // recorded as the invoice/quote total everywhere else in the app
  // (outstanding balance, payments, dashboard rollups), so the PDF must
  // never add VAT on top of it — that would make the amount the client
  // sees diverge from the amount the app tracks as owed. Subtotal/VAT
  // below are just that total decomposed for display.
  const total = input.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const includeVat = input.includeVat ?? true;
  const subtotal = includeVat ? total / (1 + COMPANY_INFO.vatRatePercent / 100) : total;
  const vat = total - subtotal;

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Description", "Qty", "Rate", "Total"]],
    body: input.lineItems.map((item) => [
      item.description,
      String(item.quantity),
      currencyFormat.format(item.unitPrice),
      currencyFormat.format(item.quantity * item.unitPrice),
    ]),
    theme: "grid",
    headStyles: { fillColor: BLUE, textColor: 255 },
    alternateRowStyles: { fillColor: LIGHT_GREY },
    styles: { fontSize: 9 },
  });

  const finalY = getFinalY(doc, tableStartY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BLACK);
  doc.text("Subtotal", RIGHT_COL_A, finalY + 8);
  doc.setFont("helvetica", "bold");
  doc.text(currencyFormat.format(subtotal), CONTENT_RIGHT, finalY + 8, { align: "right" });

  let totalsBottom = finalY + 8;
  if (includeVat) {
    doc.setFont("helvetica", "normal");
    doc.text(`VAT (${COMPANY_INFO.vatRatePercent}%)`, RIGHT_COL_A, finalY + 14);
    doc.setFont("helvetica", "bold");
    doc.text(currencyFormat.format(vat), CONTENT_RIGHT, finalY + 14, { align: "right" });
    totalsBottom = finalY + 14;
  }

  const boxY = totalsBottom + 4;
  doc.setDrawColor(...BLACK);
  doc.rect(CONTENT_RIGHT - 56, boxY, 56, 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(currencyFormat.format(total), CONTENT_RIGHT - 3, boxY + 8, { align: "right" });

  let cursorY = boxY + 22;
  if (input.notes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...BLACK);
    doc.text("Notes", MARGIN, cursorY);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...DARK_GREY);
    doc.text(doc.splitTextToSize(input.notes, 180), MARGIN, cursorY + 6);
    cursorY += 20;
  }

  drawBankingDetails(doc, cursorY);
  drawFooter(doc);

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
}

export function downloadStatementPdf(input: StatementPdfInput): void {
  const doc = new jsPDF();
  const letterheadEnd = drawLetterhead(doc, "Statement", input.accountName);
  const infoY = drawHeading(doc, "Statement", letterheadEnd);

  labelValue(doc, "Statement for", input.accountName, MARGIN, infoY);
  labelValue(doc, "Payable to", COMPANY_INFO.payableTo, RIGHT_COL_A, infoY);
  labelValue(doc, "Generated", input.generatedOn, RIGHT_COL_B, infoY);

  const tableStartY = infoY + 16;
  const totalOutstanding = input.lines.reduce((sum, line) => sum + line.balance, 0);

  autoTable(doc, {
    startY: tableStartY,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Invoice", "Issued", "Total", "Paid", "Balance"]],
    body: input.lines.map((line) => [
      line.invoiceNumber,
      line.issueDate,
      currencyFormat.format(line.total),
      currencyFormat.format(line.paid),
      currencyFormat.format(line.balance),
    ]),
    theme: "grid",
    headStyles: { fillColor: BLUE, textColor: 255 },
    alternateRowStyles: { fillColor: LIGHT_GREY },
    styles: { fontSize: 9 },
  });

  const finalY = getFinalY(doc, tableStartY);
  const boxY = finalY + 8;
  doc.setDrawColor(...BLACK);
  doc.rect(CONTENT_RIGHT - 70, boxY, 70, 12);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...BLACK);
  doc.text(`Outstanding: ${currencyFormat.format(totalOutstanding)}`, CONTENT_RIGHT - 3, boxY + 8, {
    align: "right",
  });

  drawBankingDetails(doc, boxY + 22);
  drawFooter(doc);

  doc.save(`statement-${input.accountName.replace(/\s+/g, "-").toLowerCase()}.pdf`);
}
