/** Shared money maths for invoices. Kept pure so the same rules apply on the
 * invoicing list, account rows and statements. */

export interface LineItemAmount {
  quantity: number;
  unit_price: number;
}

export function lineItemsTotal(lineItems: LineItemAmount[]): number {
  return lineItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
}

export function paymentsTotal(payments: { amount: number }[]): number {
  return payments.reduce((sum, payment) => sum + payment.amount, 0);
}

/** Outstanding balance, never negative. Void invoices owe nothing. */
export function invoiceBalance(invoice: {
  status: string;
  invoice_line_items: LineItemAmount[];
  payments: { amount: number }[];
}): number {
  if (invoice.status === "void") return 0;
  return Math.max(lineItemsTotal(invoice.invoice_line_items) - paymentsTotal(invoice.payments), 0);
}
