export const currency = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  maximumFractionDigits: 2,
});

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
