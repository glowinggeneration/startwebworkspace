import {
  CalendarCheck,
  FileText,
  FolderKanban,
  Gauge,
  Kanban,
  LayoutDashboard,
  Megaphone,
  Receipt,
  ScrollText,
  Settings,
  Sunrise,
  Users,
  UsersRound,
} from "lucide-react";
import type { ComponentType } from "react";
import type { WorkspaceRole } from "@/integrations/supabase/app-types";

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
 * Single source of truth for role based access. The sidebar and the route
 * guard both read this file, so a menu item and the page behind it can never
 * disagree. Hiding a link is presentation only; the database policies remain
 * the real boundary.
 */

const ITEM = {
  dashboard: { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  operations: { to: "/operations", label: "Operations", icon: Sunrise },
  pipeline: { to: "/pipeline", label: "Pipeline", icon: Kanban },
  accounts: { to: "/accounts", label: "Accounts", icon: Users },
  projects: { to: "/projects", label: "Projects", icon: FolderKanban },
  campaigns: { to: "/campaigns", label: "Campaigns", icon: Megaphone },
  team: { to: "/team", label: "Team", icon: UsersRound },
  workload: { to: "/workload", label: "Workload", icon: Gauge },
  activity: { to: "/activity", label: "Activity", icon: CalendarCheck },
  quotes: { to: "/quotes", label: "Quotes", icon: FileText },
  invoicing: { to: "/invoicing", label: "Invoicing", icon: Receipt },
  statements: { to: "/statements", label: "Statements", icon: ScrollText },
} satisfies Record<string, NavItem>;

export const SETTINGS_NAV_ITEM: NavItem = { to: "/settings", label: "Settings", icon: Settings };

export interface RoleWorkspace {
  /** Where this person lands after signing in. */
  landing: string;
  navGroups: NavGroup[];
  /** Extra paths reachable without a sidebar link, e.g. detail pages. */
  extraPaths: string[];
}

const EXECUTIVE: RoleWorkspace = {
  landing: "/dashboard",
  navGroups: [
    {
      label: "Workspace",
      items: [ITEM.dashboard, ITEM.pipeline, ITEM.accounts],
    },
    {
      label: "Delivery",
      items: [ITEM.projects, ITEM.campaigns, ITEM.team, ITEM.workload, ITEM.activity],
    },
    {
      label: "Finance",
      items: [ITEM.quotes, ITEM.invoicing, ITEM.statements],
    },
  ],
  extraPaths: ["/import-review"],
};

const TECHNOLOGY: RoleWorkspace = {
  landing: "/dashboard",
  navGroups: [
    { label: "Workspace", items: [ITEM.dashboard, ITEM.accounts] },
    {
      label: "Delivery",
      items: [ITEM.projects, ITEM.team, ITEM.workload, ITEM.activity],
    },
  ],
  extraPaths: [],
};

const DELIVERY: RoleWorkspace = {
  landing: "/dashboard",
  navGroups: [
    { label: "Workspace", items: [ITEM.dashboard, ITEM.accounts] },
    {
      label: "Delivery",
      items: [ITEM.projects, ITEM.team, ITEM.workload, ITEM.activity],
    },
    { label: "Finance", items: [ITEM.quotes, ITEM.invoicing] },
  ],
  extraPaths: [],
};

const SALES: RoleWorkspace = {
  landing: "/dashboard",
  navGroups: [
    {
      label: "Workspace",
      items: [ITEM.dashboard, ITEM.operations, ITEM.pipeline, ITEM.accounts],
    },
    { label: "Delivery", items: [ITEM.campaigns, ITEM.activity] },
    { label: "Finance", items: [ITEM.quotes, ITEM.invoicing] },
  ],
  extraPaths: [],
};

const BUILDER: RoleWorkspace = {
  landing: "/dashboard",
  navGroups: [
    { label: "My work", items: [ITEM.dashboard, ITEM.projects, ITEM.workload, ITEM.activity] },
  ],
  extraPaths: [],
};

const CLIENT: RoleWorkspace = {
  landing: "/dashboard",
  navGroups: [{ label: "Workspace", items: [ITEM.dashboard, ITEM.projects] }],
  extraPaths: [],
};

const BY_ROLE: Record<WorkspaceRole, RoleWorkspace> = {
  owner: EXECUTIVE,
  admin: EXECUTIVE,
  cto: TECHNOLOGY,
  pm: DELIVERY,
  sales: SALES,
  builder: BUILDER,
  member: DELIVERY,
  client: CLIENT,
};

export function workspaceForRole(role: WorkspaceRole | null | undefined): RoleWorkspace {
  return role ? BY_ROLE[role] : DELIVERY;
}

export function navItemsForRole(role: WorkspaceRole | null | undefined): NavItem[] {
  return workspaceForRole(role).navGroups.flatMap((group) => group.items);
}

/** Detail pages that ride along with their list page. */
const CHILD_PATHS: Record<string, string[]> = {
  "/projects": ["/projects/"],
  "/quotes": ["/quotes/"],
  "/invoicing": ["/invoicing/"],
};

/** Reachable by everyone who is signed in. */
const ALWAYS_ALLOWED = ["/settings", "/profile-setup", "/onboarding"];

export function canOpenPath(role: WorkspaceRole | null | undefined, pathname: string): boolean {
  if (ALWAYS_ALLOWED.some((path) => pathname.startsWith(path))) return true;

  const workspace = workspaceForRole(role);
  const allowed = [
    ...navItemsForRole(role).map((item) => item.to),
    ...workspace.extraPaths,
  ];

  return allowed.some((path) => {
    if (pathname === path || pathname.startsWith(`${path}/`)) return true;
    return (CHILD_PATHS[path] ?? []).some((child) => pathname.startsWith(child));
  });
}
