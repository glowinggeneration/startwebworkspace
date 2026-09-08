import {
  CalendarCheck,
  FileText,
  FolderKanban,
  Gauge,
  Kanban,
  LayoutDashboard,
  Receipt,
  ScrollText,
  Settings,
  Users,
} from "lucide-react";
import type { ComponentType } from "react";

export interface NavItem {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/pipeline", label: "Pipeline", icon: Kanban },
  { to: "/accounts", label: "Accounts", icon: Users },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/workload", label: "Workload", icon: Gauge },
  { to: "/activity", label: "Activity", icon: CalendarCheck },
  { to: "/quotes", label: "Quotes", icon: FileText },
  { to: "/invoicing", label: "Invoicing", icon: Receipt },
  { to: "/statements", label: "Statements", icon: ScrollText },
];

export const SETTINGS_NAV_ITEM: NavItem = { to: "/settings", label: "Settings", icon: Settings };
