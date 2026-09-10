/** The one place the agency's own letterhead details live, so quotes,
 * invoices and statements stay in sync if the bank account or VAT rate
 * ever changes. Sourced from the paid AfriBiz invoice used as the design
 * reference for these documents. */
export const COMPANY_INFO = {
  legalName: "Glowing Generation T/A Startweb",
  email: "info@startweb.co.za",
  payableTo: "Glowing Generation",
  vatRatePercent: 15,
  bank: {
    name: "FNB/RMB",
    accountNumber: "62857346665",
    accountHolder: "Glowing Generation (Pty) Ltd",
  },
};
