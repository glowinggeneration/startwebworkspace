import type { ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { initialsOf } from "@/lib/initials";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/core/theme-toggle";
import { GlobalCommandPalette } from "@/components/core/global-command";
import { NAV_ITEMS, SETTINGS_NAV_ITEM } from "@/components/application/shell/nav-items";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

/**
 * Authenticated app chrome — adapted from the sibling SMAIT project's
 * workspace-shell.tsx structure (sidebar + top bar + user menu), trimmed
 * for Phase 0 and rewired for workspace-scoped RBAC instead of a hardcoded
 * admin email. Command palette and a notifications surface are wired in
 * (the latter is a placeholder until a notifications table exists).
 */
export function StartwebShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { data: profile } = useProfile();

  async function handleSignOut() {
    await supabase.auth.signOut();
    void navigate({ to: "/auth" });
  }

  return (
    <SidebarProvider>
      <GlobalCommandPalette items={NAV_ITEMS} />
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Link to="/dashboard" className="flex items-center gap-2 px-2 py-1.5">
            <img src="/brand/startweb-blue.svg" alt="" aria-hidden="true" className="h-5 w-auto" />
            <span className="type-card font-semibold group-data-[collapsible=icon]:hidden">
              Startweb
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname.startsWith(item.to);
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                        <Link to={item.to} aria-current={isActive ? "page" : undefined}>
                          <item.icon className="size-4" aria-hidden="true" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={SETTINGS_NAV_ITEM.label}>
                <Link to={SETTINGS_NAV_ITEM.to}>
                  <SETTINGS_NAV_ITEM.icon className="size-4" aria-hidden="true" />
                  <span>{SETTINGS_NAV_ITEM.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <SidebarTrigger />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full"
                  aria-label="Account menu"
                >
                  <Avatar className="size-8">
                    <AvatarFallback>{initialsOf(profile?.full_name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className={cn("truncate")}>
                  {profile?.full_name || profile?.email}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={SETTINGS_NAV_ITEM.to}>
                    <Settings className="mr-2 size-4" aria-hidden="true" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleSignOut}>
                  <LogOut className="mr-2 size-4" aria-hidden="true" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex flex-1 flex-col">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
