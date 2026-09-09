/**
 * South African rand, formatted the approved way: "R30 000" — no space after
 * the symbol, a narrow gap between thousands, and cents only when they exist.
 */
function formatRand(value: number): string {
  const amount = Number.isFinite(value) ? value : 0;
  const hasCents = Math.round(Math.abs(amount) * 100) % 100 !== 0;
  const digits = hasCents ? 2 : 0;
  const body = new Intl.NumberFormat("en-ZA", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
    .format(Math.abs(amount))
    .replace(/[\u00A0\u202F,]/g, " ");
  return `${amount < 0 ? "-" : ""}R${body}`;
}

export const currency = { format: formatRand };


export interface LineItem {
  description: string;
  quantity: number;
  unitPrice: number;
}

export function lineItemTotal(item: LineItem): number {
  return item.quantity * item.unitPrice;
}

export function documentTotal(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + lineItemTotal(item), 0);
}
