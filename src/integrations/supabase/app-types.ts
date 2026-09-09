/**
 * Hand-maintained domain aliases layered on top of the generated Supabase
 * types. Status columns are text with CHECK constraints in the database, so
 * they arrive as `string`; these unions mirror those constraints. Kept out of
 * `types.ts` because that file is regenerated automatically.
 */
export type { Database, Json, Tables, TablesInsert, TablesUpdate, Enums } from "./types";
import type { Database } from "./types";

export type WorkspaceRole = Database["public"]["Enums"]["workspace_role"];

export type DealStatus = "open" | "won" | "lost" | "later";
export type ProjectStatus = "active" | "on_hold" | "completed";
export type ProjectPhaseStatus = "not_started" | "in_progress" | "done";
export type TaskStatus = "todo" | "in_progress" | "done";
export type QuoteStatus = "draft" | "sent" | "accepted" | "declined" | "expired";
export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "void";
