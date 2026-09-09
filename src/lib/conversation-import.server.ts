/**
 * Conversation import pack: reviewed observations taken from client
 * conversations up to 9 September 2026. Server-only so the fixture never
 * ships to the browser bundle.
 */
import pack from "@/data/conversation-import.json";

export interface PackAccount {
  account_key: string;
  account_name: string;
  account_type: string | null;
  relationship_status: string | null;
  primary_service: string | null;
  primary_contact: string | null;
  review_priority: string | null;
  summary: string | null;
  source_refs: string | null;
}

export interface PackContact {
  contact_key: string;
  full_name: string;
  role: string | null;
  account_keys: string | null;
  business_email: string | null;
  notes: string | null;
  source_refs: string | null;
}

export interface PackProject {
  project_key: string;
  project_name: string;
  account_key: string;
  service_type: string | null;
  status: string | null;
  owner_contact_key: string | null;
  start_date: string | null;
  due_date: string | null;
  value_zar: string | null;
  summary: string | null;
  source_refs: string | null;
}

export interface PackAction {
  action_key: string;
  project_key: string | null;
  action: string;
  owner_contact_key: string | null;
  status: string | null;
  priority: string | null;
  due_date: string | null;
  notes: string | null;
  source_refs: string | null;
}

export interface PackNote {
  note_key: string;
  account_key: string;
  note_date: string | null;
  category: string | null;
  note: string;
  source_refs: string | null;
}

export interface PackReviewItem {
  review_key: string;
  record_type: string;
  record_key: string | null;
  issue: string;
  evidence: string | null;
  required_decision: string | null;
  source_refs: string | null;
}

export interface ConversationPack {
  namespace: string;
  as_of: string;
  accounts: PackAccount[];
  contacts: PackContact[];
  projects: PackProject[];
  actions: PackAction[];
  notes: PackNote[];
  review_items: PackReviewItem[];
}

export const conversationPack = pack as unknown as ConversationPack;

/** Internal teammates are matched to workspace profiles, never created as client contacts. */
export const INTERNAL_CONTACT_EMAILS: Record<string, string> = {
  "CON-THABO": "thabo@startweb.co.za",
  "CON-DODI": "maleka@startweb.co.za",
  "CON-NDU": "ndumiso@startweb.co.za",
  "CON-NTOKOZO": "ntokozo@startweb.co.za",
};

const ON_HOLD_HINTS = ["paused", "hold", "blocked", "at risk", "review", "waiting", "closing"];

/** The pack's own wording is preserved separately; the status column keeps existing screens working. */
export function mapProjectStatus(label: string | null): "active" | "on_hold" {
  const value = (label ?? "").toLowerCase();
  return ON_HOLD_HINTS.some((hint) => value.includes(hint)) ? "on_hold" : "active";
}

export function mapTaskPriority(label: string | null): "low" | "normal" | "high" {
  const value = (label ?? "").toLowerCase();
  if (value === "high") return "high";
  if (value === "low") return "low";
  return "normal";
}

/** Every imported action is a next step, so nothing arrives as already done. */
export function mapTaskStatus(label: string | null): "todo" | "in_progress" {
  const value = (label ?? "").toLowerCase();
  return value.includes("progress") ? "in_progress" : "todo";
}

export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

export const IMPORT_PHASE_NAME = "Next steps";
