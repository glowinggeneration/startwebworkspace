import { describe, expect, it } from "vitest";
import { invoiceBalance, lineItemsTotal, paymentsTotal } from "./balance";

describe("finance balances", () => {
  it("totals line items by quantity and price", () => {
    expect(
      lineItemsTotal([
        { quantity: 2, unit_price: 1500 },
        { quantity: 1, unit_price: 500 },
      ]),
    ).toBe(3500);
  });

  it("totals payments", () => {
    expect(paymentsTotal([{ amount: 1000 }, { amount: 250 }])).toBe(1250);
  });

  it("returns the outstanding balance", () => {
    expect(
      invoiceBalance({
        status: "sent",
        invoice_line_items: [{ quantity: 1, unit_price: 10000 }],
        payments: [{ amount: 4000 }],
      }),
    ).toBe(6000);
  });

  it("never reports a negative balance", () => {
    expect(
      invoiceBalance({
        status: "sent",
        invoice_line_items: [{ quantity: 1, unit_price: 1000 }],
        payments: [{ amount: 1200 }],
      }),
    ).toBe(0);
  });

  it("treats void invoices as owing nothing", () => {
    expect(
      invoiceBalance({
        status: "void",
        invoice_line_items: [{ quantity: 1, unit_price: 5000 }],
        payments: [],
      }),
    ).toBe(0);
  });
});
