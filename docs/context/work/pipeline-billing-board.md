# Pipeline billing board

10 September 2026. Done.

## Goal

Follow each quote through to a signed invoice and its payments on the
Pipeline page, instead of across Quotes and Invoicing.

## Screens and tables

- `/pipeline` Billing view: `billing-board.tsx`, `sign-invoice-dialog.tsx`
- `quotes`, `quote_line_items`, `invoices` (+ `signed_at`, `signed_by`,
  `signed_note`), `invoice_line_items`, `payments`

## Acceptance checks

- Quote status can be changed on the card; Create invoice only once accepted
- Create invoice copies the quote's line items (existing convert routine)
- Record signature stores who signed, when and an optional reference, and
  moves a draft invoice to sent
- Payment meter shows paid vs total; Record payment refuses more than the
  balance (existing trigger); settled invoices move to Paid
- Voided invoices stay visible with no signature or payment controls
- No amounts invented; board shows only existing documents

## Out of scope

Editing line items on the board, PDF signing, online payment collection.
