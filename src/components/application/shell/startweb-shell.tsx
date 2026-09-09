import type { CSSProperties, ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { LogOut, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { initialsOf } from "@/lib/initials";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/core/theme-toggle";
import { GlobalCommandPalette } from "@/components/core/global-command";
import {
  NAV_GROUPS,
  NAV_ITEMS,
  SETTINGS_NAV_ITEM,
} from "@/components/application/shell/nav-items";
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
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

/**
 * Authenticated app chrome, per the approved Startweb design language:
 * a solid blue 248px navigation rail with a text only STARTWEB wordmark,
 * a 72px top bar carrying the current page name, and a light canvas below.
 */
export function StartwebShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const { data: profile } = useProfile();

  const currentPage =
    NAV_ITEMS.find((item) => pathname.startsWith(item.to)) ??
    (pathname.startsWith(SETTINGS_NAV_ITEM.to) ? SETTINGS_NAV_ITEM : undefined);

  async function handleSignOut() {
    await supabase.auth.signOut();
    void navigate({ to: "/auth" });
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": "15.5rem" } as CSSProperties}>
      <GlobalCommandPalette items={NAV_ITEMS} />
      <Sidebar collapsible="offcanvas" className="border-r-0">
        <SidebarHeader className="h-18 justify-center px-5">
          <Link
            to="/dashboard"
            className="text-base font-bold tracking-[0.18em] text-sidebar-foreground uppercase"
          >
            Startweb
          </Link>
        </SidebarHeader>

        <SidebarContent className="px-2">
          {NAV_GROUPS.map((group) => (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel className="text-[0.6875rem] font-semibold tracking-[0.1em] text-sidebar-section uppercase">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive = pathname.startsWith(item.to);
                    return (
                      <SidebarMenuItem key={item.to}>
                        <SidebarMenuButton
                          asChild
                          isActive={isActive}
                          className="h-11 gap-3 rounded-md text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-sidebar-foreground"
                        >
                          <Link to={item.to} aria-current={isActive ? "page" : undefined}>
                            <item.icon className="size-4.5" aria-hidden="true" />
                            <span className="type-label">{item.label}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="px-4 pb-4">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith(SETTINGS_NAV_ITEM.to)}
                className="h-11 gap-3 rounded-md text-sidebar-foreground/85 hover:bg-sidebar-accent hover:text-sidebar-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground"
              >
                <Link to={SETTINGS_NAV_ITEM.to}>
                  <SETTINGS_NAV_ITEM.icon className="size-4.5" aria-hidden="true" />
                  <span className="type-label">{SETTINGS_NAV_ITEM.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-background">
        <header className="flex h-18 shrink-0 items-center justify-between border-b border-divider bg-card px-8">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="md:hidden" />
            <span className="type-section">{currentPage?.label ?? "Workspace"}</span>
          </div>
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
                  <Avatar className="size-9">
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
