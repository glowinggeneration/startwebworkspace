# Work: conversation import

Namespace `startweb-whatsapp-2026-09-09`. Status: committed 10 September 2026.

## Goal

Bring the client work discussed in the team WhatsApp thread into the
workspace as real clients, contacts, projects, next steps and notes, without
inventing values and without touching money records.

## How it works

- Source pack: `src/data/conversation-import.json`
- Matching and mapping: `src/lib/conversation-import.server.ts`
- Server functions: `src/lib/conversation-import.functions.ts`
  (`runConversationImport`, dry run or commit, owner and admin only)
- Screen: Conversation import card in `/settings`; preview first, then commit
- Decisions: `/import-review`, backed by `import_review_items`

## Rules held

- Every imported row carries `import_key`, `import_source` and `source_refs`,
  so re-running creates and changes nothing.
- Existing values are never overwritten. A difference is recorded as a
  review item instead.
- Internal team addresses are excluded from contacts.
- No quotes, invoices or payments are created by the import.

## Result

22 clients, 7 contacts, 19 projects, 16 tasks, 10 account notes and 10
review items created. AfriBiz Future Tech matched an existing client and was
left untouched. Three contacts were left out as internal addresses.

## Left

Ten review items are open and need an owner or admin decision.
