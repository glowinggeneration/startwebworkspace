import {
  CalendarCheck,
  FileText,
  FolderKanban,
  Gauge,
  Kanban,
  Megaphone,
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

export interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * Navigation is grouped by the work being done, not by data model. Labels stay
 * short and task based, per the approved Startweb design language.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/pipeline", label: "Pipeline", icon: Kanban },
      { to: "/accounts", label: "Accounts", icon: Users },
    ],
  },
  {
    label: "Delivery",
    items: [
      { to: "/projects", label: "Projects", icon: FolderKanban },
      { to: "/campaigns", label: "Campaigns", icon: Megaphone },
      { to: "/team", label: "Team", icon: UsersRound },
      { to: "/workload", label: "Workload", icon: Gauge },
      { to: "/activity", label: "Activity", icon: CalendarCheck },
    ],
  },
  {
    label: "Finance",
    items: [
      { to: "/quotes", label: "Quotes", icon: FileText },
      { to: "/invoicing", label: "Invoicing", icon: Receipt },
      { to: "/statements", label: "Statements", icon: ScrollText },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

export const SETTINGS_NAV_ITEM: NavItem = { to: "/settings", label: "Settings", icon: Settings };
